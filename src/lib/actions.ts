
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
        duesAmount,
        duesFrequency: data.duesFrequency || 'weekly',
        startDate: startDate,
    };
    
    return settings;
  }
  // Default settings if the document doesn't exist
  return {
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
    startDate: settings.startDate ? Timestamp.fromDate(new Date(settings.startDate)) : null,
  };
  
  await setDoc(settingsDoc, dataToSave, { merge: true });
  revalidatePath('/admin/settings');
  revalidatePath('/anggota', 'layout');
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
     await addDoc(collection(db, 'transactions'), dataToSave);
  } else if (transaction.type === 'Pengeluaran') {
    
    // If expense is for a specific member
    if (transaction.memberId) {
        const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
        if (memberDoc.exists()) {
            dataToSave.memberName = memberDoc.data().name;
        }
        await addDoc(collection(db, 'transactions'), dataToSave);
    } else {
        // Shared expense: Distribute cost evenly among all members
        const batch = writeBatch(db);
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const members = membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        const memberCount = members.length;

        if (memberCount > 0) {
            // Use Math.ceil to ensure the full cost is covered, with the last person paying any remainder
            const totalCost = transaction.amount;
            const costPerMember = Math.floor(totalCost / memberCount);
            const remainder = totalCost % memberCount;
            
            for (let i = 0; i < members.length; i++) {
               const member = members[i];
               let memberCost = costPerMember;
               // Add remainder to the last member to ensure total cost matches
               if (i === members.length - 1) {
                   memberCost += remainder;
               }

               const memberExpense = {
                   type: 'Pengeluaran',
                   amount: memberCost,
                   date: Timestamp.fromDate(transaction.date),
                   description: transaction.description,
                   memberId: member.id,
                   memberName: member.name,
               };
               batch.set(doc(collection(db, 'transactions')), memberExpense);
            }
            await batch.commit();
        } else {
           // If there are no members, just add it as a general expense (though this case is unlikely)
            delete dataToSave.memberId;
            delete dataToSave.memberName;
            await addDoc(collection(db, 'transactions'), dataToSave);
        }
    }

  } else {
      // Fallback for other cases (Pemasukan without memberId)
      dataToSave.memberId = null;
      dataToSave.memberName = null;
      dataToSave.treasurer = null;
      await addDoc(collection(db, 'transactions'), dataToSave);
  }

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
        }
    } else {
      dataToUpdate.memberId = null;
      dataToUpdate.memberName = null;
      dataToUpdate.treasurer = null;
    }

    if (transaction.type === 'Pengeluaran') {
        // Preserve memberId if it exists (for individual member expenses)
        dataToUpdate.memberId = transaction.memberId || null;
        if (dataToUpdate.memberId && !transaction.memberName) {
           const memberDoc = await getDoc(doc(db, 'members', dataToUpdate.memberId));
           if(memberDoc.exists()) dataToUpdate.memberName = memberDoc.data().name;
        } else {
            dataToUpdate.memberName = transaction.memberName || null;
        }
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



    
