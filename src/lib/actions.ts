
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction, TransactionData, Settings } from '@/lib/types';
import { calculateMemberDues } from '@/ai/flows/calculate-member-dues';

// Settings Actions
export async function getSettings(): Promise<Settings> {
  const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
  if (settingsDoc.exists()) {
    const data = settingsDoc.data();
    // Ensure duesAmount is a number, default to 0 if it's missing or not a number
    const duesAmount = typeof data.duesAmount === 'number' ? data.duesAmount : 0;
    return {
      ...data,
      duesAmount,
      startDate: data.startDate?.toDate()?.toISOString(),
    }
  }
  // Default settings if the document doesn't exist
  return {
    duesAmount: 2000,
    duesFrequency: 'weekly',
  };
}

export async function updateSettings(settings: Settings) {
  const settingsDoc = doc(db, 'settings', 'config');
  const dataToSave: any = {
    ...settings,
    duesAmount: Number(settings.duesAmount) || 0,
  };
  if (settings.startDate) {
    dataToSave.startDate = Timestamp.fromDate(new Date(settings.startDate));
  }
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
  revalidatePath('/');
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
    // Fair expense logic
    const transactionsCol = collection(db, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsCol);
    const allTransactions = transactionsSnapshot.docs.map(d => d.data() as Transaction);
    
    const totalIncome = allTransactions.filter(t => t.type === 'Pemasukan').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTransactions.filter(t => t.type === 'Pengeluaran').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = totalIncome - totalExpenses;

    const expenseAmount = transaction.amount;
    
    if (currentBalance >= expenseAmount) {
      // Balance is sufficient, just add the expense transaction
      dataToSave.memberId = null;
      dataToSave.memberName = null;
      dataToSave.treasurer = null;
      await addDoc(collection(db, 'transactions'), dataToSave);
    } else {
      // Balance is not sufficient
      const shortfall = expenseAmount - currentBalance;
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const members = membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      const memberCount = members.length;

      if(memberCount === 0) {
        // No members to divide the cost, just add the expense
        dataToSave.memberId = null;
        dataToSave.memberName = null;
        dataToSave.treasurer = null;
        await addDoc(collection(db, 'transactions'), dataToSave);
        return;
      }

      const costPerMember = Math.ceil(shortfall / memberCount);
      
      const batch = writeBatch(db);

      // 1. Add the initial expense transaction (for the amount covered by balance if any)
      const initialExpense = {
        ...dataToSave,
        amount: currentBalance > 0 ? currentBalance : 0,
        description: `${transaction.description} (dari kas)`,
        memberId: null,
        memberName: null,
        treasurer: null,
      };
      if (initialExpense.amount > 0) {
        batch.set(doc(collection(db, 'transactions')), initialExpense);
      }

      // 2. Add expense for each member
      const memberExpenseDescription = `Iuran untuk: ${transaction.description}`;
      for (const member of members) {
        const memberExpense = {
          type: 'Pengeluaran',
          amount: costPerMember,
          date: Timestamp.fromDate(transaction.date),
          description: memberExpenseDescription,
          memberId: member.id,
          memberName: member.name,
          treasurer: null,
        };
        batch.set(doc(collection(db, 'transactions')), memberExpense);
      }
      
      await batch.commit();
    }
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
        dataToUpdate.memberId = dataToUpdate.memberId || null;
        dataToUpdate.memberName = dataToUpdate.memberName || null;
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

// AI Dues Calculation Action
export async function getPeriodicDues(startDate: string, duesAmount: number, duesFrequency: 'weekly' | 'monthly') {
  if (!startDate || !duesAmount || !duesFrequency) {
    return { totalDues: 0 };
  }
  try {
    const result = await calculateMemberDues({
      startDate,
      weeklyRate: duesFrequency === 'weekly' ? duesAmount : duesAmount / 4, // simplistic conversion for AI
      currentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });
    return result;
  } catch (error) {
    console.error("AI flow error:", error);
    // Fallback simple calculation
    const start = new Date(startDate);
    const now = new Date();
    if(duesFrequency === 'weekly') {
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return { totalDues: diffWeeks * duesAmount };
    } else {
      let months;
      months = (now.getFullYear() - start.getFullYear()) * 12;
      months -= start.getMonth();
      months += now.getMonth();
      return { totalDues: months <= 0 ? 0 : months * duesAmount };
    }
  }
}
