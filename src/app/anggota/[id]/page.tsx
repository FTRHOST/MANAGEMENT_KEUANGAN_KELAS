import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction } from '@/lib/types';
import PersonalDashboard from '@/components/public/PersonalDashboard';
import { notFound } from 'next/navigation';

async function getData(memberId: string) {
  const memberRef = doc(db, 'members', memberId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    return null;
  }
  const member = { id: memberSnap.id, ...memberSnap.data() } as Member;

  const transactionsCol = collection(db, 'transactions');
  const transactionsSnapshot = await getDocs(query(transactionsCol, orderBy('date', 'desc')));
  const transactions = transactionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];

  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(membersCol);
  const allMembers = membersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Member[];

  return { member, transactions, allMembers };
}

export default async function AnggotaPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);

  if (!data) {
    notFound();
  }

  const { member, transactions, allMembers } = data;

  return (
    <PersonalDashboard
      member={member}
      transactions={transactions}
      allMembers={allMembers}
    />
  );
}

export async function generateStaticParams() {
  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(membersCol);
  return membersSnapshot.docs.map(doc => ({
    id: doc.id,
  }));
}
