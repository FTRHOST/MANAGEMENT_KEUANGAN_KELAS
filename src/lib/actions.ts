
"use server";

import { revalidatePath } from 'next/cache';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  getDoc,
  setDoc,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction, TransactionData, Settings, CashierDay } from '@/lib/types';
import { randomUUID } from 'crypto';

// Settings Actions
/**
 * Fetches the application settings from Firestore.
 * If no settings are found, it returns a default configuration.
 * @returns {Promise<Settings>} A promise that resolves to the settings object.
 */
export async function getSettings(): Promise<Settings> {
  const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
  if (settingsDoc.exists()) {
    const data = settingsDoc.data();
    // Ensure duesAmount is a number, default to 0 if it's missing or not a number
    const duesAmount = typeof data.duesAmount === 'number' ? data.duesAmount : 0;
    
    // Convert Timestamp to ISO string if it exists
    const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : null;

    const settings: Settings = {
        appName: data.appName || 'Class Cashier',
        logoUrl: data.logoUrl || '/favicon.png',
        duesAmount,
        duesFrequency: data.duesFrequency || 'weekly',
        startDate: startDate,
        heroTitle: data.heroTitle || 'Bendahara Cerdas',
        heroDescription: data.heroDescription || 'Transparansi keuangan kelas di ujung jari Anda. Cari nama Anda untuk melihat status iuran.',
    };
    
    return settings;
  }
  // Default settings if the document doesn't exist
  return {
    appName: 'Class Cashier',
    logoUrl: '/favicon.png',
    duesAmount: 2000,
    duesFrequency: 'weekly',
    startDate: null,
    heroTitle: 'Bendahara Cerdas',
    heroDescription: 'Transparansi keuangan kelas di ujung jari Anda. Cari nama Anda untuk melihat status iuran.',
  };
}

/**
 * Updates the application settings in Firestore.
 * It merges the new settings with the existing ones.
 * @param settings - The settings object to update.
 */
export async function updateSettings(settings: Omit<Settings, 'duesAmount' | 'startDate'> & { duesAmount: number | string, startDate: Date | string | null }) {
  const settingsDoc = doc(db, 'settings', 'config');
  const dataToSave: any = {
    ...settings,
    duesAmount: Number(settings.duesAmount) || 0,
  };
  if (settings.startDate) {
    // Check if it's already a Date object or an ISO string
    dataToSave.startDate = settings.startDate instanceof Date ? settings.startDate : new Date(settings.startDate);
  } else {
    dataToSave.startDate = null;
  }
  
  await setDoc(settingsDoc, dataToSave, { merge: true });
  revalidatePath('/admin/settings');
  revalidatePath('/anggota', 'layout');
  revalidatePath('/');
  revalidatePath('/admin');
}


// Member Actions
/**
 * Adds a new member to the Firestore database.
 * @param name - The name of the member.
 * @param nim - The student ID number of the member (optional).
 * @returns {Promise<{error: string} | undefined>} A promise that resolves to an error object if the name is empty, otherwise undefined.
 */
export async function addMember(name: string, nim?: string) {
  if (!name) {
    return { error: 'Nama anggota tidak boleh kosong.' };
  }
  await addDoc(collection(db, 'members'), { name, nim: nim || '' });
  revalidatePath('/admin');
  revalidatePath('/');
}

/**
 * Updates an existing member's information in the Firestore database.
 * @param id - The ID of the member to update.
 * @param name - The new name of the member.
 * @param nim - The new student ID number of the member (optional).
 * @returns {Promise<{error: string} | undefined>} A promise that resolves to an error object if the name is empty, otherwise undefined.
 */
export async function updateMember(id: string, name: string, nim?: string) {
  if (!name) {
    return { error: 'Nama anggota tidak boleh kosong.' };
  }
  const memberDoc = doc(db, 'members', id);
  await updateDoc(memberDoc, { name, nim: nim || '' });
  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

/**
 * Deletes a member from the Firestore database.
 * A member cannot be deleted if they have associated transactions.
 * @param id - The ID of the member to delete.
 * @returns {Promise<{error: string} | undefined>} A promise that resolves to an error object if the member has transactions, otherwise undefined.
 */
export async function deleteMember(id: string) {
  // Check if member has transactions
  const q = query(collection(db, 'transactions'), where('memberId', '==', id));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { error: 'Anggota ini memiliki riwayat transaksi dan tidak dapat dihapus.' };
  }
  await deleteDoc(doc(db, 'members', id));
  revalidatePath('/admin');
  revalidatePath('/');
}

// Transaction Actions
/**
 * Adds a new transaction to the Firestore database.
 * If the transaction is a 'Pemasukan' and 'applyToAll' is true, it creates a transaction for each member.
 * @param transaction - The transaction object to add.
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'date' | 'memberId'> & { date: Date, memberId?: string | null, applyToAll?: boolean }) {
  if (transaction.type === 'Pemasukan' && transaction.applyToAll) {
    const batch = writeBatch(db);
    const membersSnapshot = await getDocs(query(collection(db, 'members'), orderBy('name')));
    const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
    
    if (members.length === 0) throw new Error("Tidak ada anggota untuk menerapkan transaksi.");
    
    const amountPerMember = transaction.amount / members.length;
    const batchId = randomUUID(); // Group transactions from this operation

    members.forEach(member => {
      const transactionDocRef = doc(collection(db, 'transactions'));
      const dataToSave: Partial<Transaction> & { date: Timestamp } = {
        type: transaction.type,
        amount: amountPerMember,
        date: Timestamp.fromDate(transaction.date),
        description: transaction.description,
        memberId: member.id,
        memberName: member.name,
        treasurer: transaction.treasurer || null,
        batchId: batchId, // Add batchId to each transaction
      };
      batch.set(transactionDocRef, dataToSave);
    });

    await batch.commit();

  } else {
    const dataToSave: any = {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
    };

    if (transaction.type === 'Pemasukan' && transaction.memberId) {
      const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
      if(memberDoc.exists()) {
          dataToSave.memberName = memberDoc.data().name;
      }
    } else if (transaction.type === 'Pengeluaran') {
       // For individual expenses, assign member name
       if (transaction.memberId) {
          const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
          if(memberDoc.exists()) dataToSave.memberName = memberDoc.data().name;
       } else {
          // For shared expenses, memberId and memberName are null
          dataToSave.memberId = null;
          dataToSave.memberName = null;
       }
    } else {
        // Fallback for other cases (Pemasukan without memberId)
        dataToSave.memberId = null;
        dataToSave.memberName = null;
    }
    
    delete dataToSave.applyToAll; // Remove temporary flag

    if (!dataToSave.treasurer) {
      dataToSave.treasurer = null;
    }

    await addDoc(collection(db, 'transactions'), dataToSave);
  }

  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

/**
 * Updates an existing transaction in the Firestore database.
 * @param id - The ID of the transaction to update.
 * @param transaction - The transaction object with updated data.
 */
export async function updateTransaction(id: string, transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }) {
    const dataToUpdate: any = {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
    };

    if (transaction.type === 'Pemasukan' && transaction.memberId) {
        const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
        if(memberDoc.exists()) {
            dataToUpdate.memberName = memberDoc.data().name;
        } else {
            // Member might have been deleted, clear the name
            dataToUpdate.memberName = null;
        }
    } else if (transaction.type === 'Pengeluaran') {
        if (transaction.memberId) {
            const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
            if(memberDoc.exists()) {
                dataToUpdate.memberName = memberDoc.data().name;
            } else {
                dataToUpdate.memberName = null;
            }
        } else {
            // Shared expense, no member name
            dataToUpdate.memberId = null;
            dataToUpdate.memberName = null;
        }
    } else {
      dataToUpdate.memberId = null;
      dataToUpdate.memberName = null;
    }

    if (!dataToUpdate.treasurer) {
        dataToUpdate.treasurer = null;
    }

    await updateDoc(doc(db, 'transactions', id), dataToUpdate);
    revalidatePath('/admin');
    revalidatePath('/anggota', 'layout');
}

/**
 * Deletes a transaction from the Firestore database.
 * If a batchId is provided, it deletes all transactions with that batchId.
 * @param id - The ID of the transaction to delete.
 * @param batchId - The batch ID of the transactions to delete (optional).
 */
export async function deleteTransaction(id: string, batchId?: string) {
  if (batchId) {
    // This is a bulk delete request
    const q = query(collection(db, 'transactions'), where('batchId', '==', batchId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } else {
    // This is a single transaction delete
    await deleteDoc(doc(db, 'transactions', id));
  }
  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

// Cashier Day Actions
/**
 * Fetches all cashier days from the Firestore database.
 * @returns {Promise<CashierDay[]>} A promise that resolves to an array of cashier day objects.
 */
export async function getCashierDays(): Promise<CashierDay[]> {
    const cashierDaysCol = collection(db, 'cashier_days');
    const snapshot = await getDocs(query(cashierDaysCol, orderBy('date', 'desc')));
    const settings = await getSettings();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: data.date.toDate().toISOString(),
            duesAmount: typeof data.duesAmount === 'number' ? data.duesAmount : settings.duesAmount,
        } as unknown as CashierDay
    });
}

/**
 * Adds a new cashier day to the Firestore database.
 * @param data - The cashier day object to add.
 * @returns {Promise<{error: string} | undefined>} A promise that resolves to an error object if the date or description is empty, otherwise undefined.
 */
export async function addCashierDay(data: { date: Date; description: string; duesAmount: number }) {
    if (!data.date || !data.description) {
        return { error: 'Tanggal dan deskripsi tidak boleh kosong.' };
    }
    await addDoc(collection(db, 'cashier_days'), {
        date: Timestamp.fromDate(data.date),
        description: data.description,
        duesAmount: data.duesAmount
    });
    revalidatePath('/admin');
    revalidatePath('/anggota', 'layout');
}

/**
 * Deletes a cashier day from the Firestore database.
 * @param id - The ID of the cashier day to delete.
 */
export async function deleteCashierDay(id: string) {
    await deleteDoc(doc(db, 'cashier_days', id));
    revalidatePath('/admin');
    revalidatePath('/anggota', 'layout');
}
