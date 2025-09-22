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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction, TransactionData, Settings } from '@/lib/types';
import { calculateMemberDues } from '@/ai/flows/calculate-member-dues';

// Settings Actions
export async function getSettings(): Promise<Settings> {
  const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
  if (settingsDoc.exists()) {
    const data = settingsDoc.data();
    return {
      ...data,
      startDate: data.startDate?.toDate()?.toISOString(),
    }
  }
  return {};
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
  } else if (transaction.type === 'Pengeluaran') {
    dataToSave.memberId = null;
    dataToSave.memberName = null;
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
        }
    } else {
      dataToUpdate.memberId = null;
      dataToUpdate.memberName = null;
      dataToUpdate.treasurer = null;
    }

    if (transaction.type === 'Pengeluaran') {
        dataToUpdate.memberId = null;
        dataToUpdate.memberName = null;
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
