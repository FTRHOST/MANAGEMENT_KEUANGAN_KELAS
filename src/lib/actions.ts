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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction, TransactionData } from '@/lib/types';
import { calculateMemberDues } from '@/ai/flows/calculate-member-dues';

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
  let memberName = '';
  if (transaction.type === 'Pemasukan' && transaction.memberId) {
    const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
    if(memberDoc.exists()) {
        memberName = memberDoc.data().name;
    }
  }

  const dataToSave = {
    ...transaction,
    memberName: transaction.type === 'Pemasukan' ? memberName : undefined,
    date: Timestamp.fromDate(transaction.date),
  };

  await addDoc(collection(db, 'transactions'), dataToSave);
  revalidatePath('/admin');
  revalidatePath('/anggota', 'layout');
}

export async function updateTransaction(id: string, transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }) {
    let memberName = '';
    if (transaction.type === 'Pemasukan' && transaction.memberId) {
        const memberDoc = await getDoc(doc(db, 'members', transaction.memberId));
        if(memberDoc.exists()) {
            memberName = memberDoc.data().name;
        }
    }

  const dataToUpdate = {
    ...transaction,
    memberName: transaction.type === 'Pemasukan' ? memberName : undefined,
    date: Timestamp.fromDate(transaction.date),
  };
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
export async function getPeriodicDues(startDate: string | null) {
  if (!startDate) {
    return { totalDues: 0 };
  }
  try {
    const result = await calculateMemberDues({
      startDate,
      weeklyRate: 2000,
      currentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });
    return result;
  } catch (error) {
    console.error("AI flow error:", error);
    // Fallback simple calculation
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return { totalDues: diffWeeks * 2000 };
  }
}
