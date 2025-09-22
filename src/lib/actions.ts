
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

// Settings Actions
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
        logoUrl: data.logoUrl || '',
        duesAmount,
        duesFrequency: data.duesFrequency || 'weekly',
        startDate: startDate,
    };
    
    return settings;
  }
  // Default settings if the document doesn't exist
  return {
    appName: 'Class Cashier',
    logoUrl: '',
    duesAmount: 2000,
    duesFrequency: 'weekly',
    startDate: null,
  };
}

export async function updateSettings(settings: Settings) {
  const settingsDoc = doc(db, 'settings', 'config');
  const dataToSave: any = {
    ...settings,
    duesAmount: Number(settings.duesAmount) || 0,
  };
  if (settings.startDate) {
    dataToSave.startDate = new Date(settings.startDate);
  } else {
    dataToSave.startDate = null;
  }
  
  await setDoc(settingsDoc, dataToSave, { merge: true });
  revalidatePath('/admin/settings');
  revalidatePath('/anggota', 'layout');
  revalidatePath('/');
}


// Member Actions
export async function addMember(name: string) {
  if (!name) {
    return { error: 'Nama anggota tidak boleh kosong.' };
  }
  await addDoc(collection(db, 'members'), { name });
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateMember(id: string, name: string) {
  if (!name) {
    return { error: 'Nama anggota tidak boleh kosong.' };
  }
  const memberDoc = doc(db, 'members', id);
  await updateDoc(memberDoc, { name });
  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

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
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }) {
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
   
  if (!dataToSave.treasurer) {
    dataToSave.treasurer = null;
  }

  await addDoc(collection(db, 'transactions'), dataToSave);

  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

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

export async function deleteTransaction(id: string) {
  await deleteDoc(doc(db, 'transactions', id));
  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

// Cashier Day Actions
export async function getCashierDays(): Promise<CashierDay[]> {
    const cashierDaysCol = collection(db, 'cashier_days');
    const snapshot = await getDocs(query(cashierDaysCol, orderBy('date', 'desc')));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate().toISOString(),
    } as CashierDay));
}

export async function addCashierDay(date: Date, description: string) {
    if (!date || !description) {
        return { error: 'Tanggal dan deskripsi tidak boleh kosong.' };
    }
    await addDoc(collection(db, 'cashier_days'), {
        date: Timestamp.fromDate(date),
        description
    });
    revalidatePath('/admin');
    revalidatePath('/anggota', 'layout');
}

export async function deleteCashierDay(id: string) {
    await deleteDoc(doc(db, 'cashier_days', id));
    revalidatePath('/admin');
    revalidatePath('/anggota', 'layout');
}
