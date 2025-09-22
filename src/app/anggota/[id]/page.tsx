import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction } from '@/lib/types';
import PersonalDashboard from '@/components/public/PersonalDashboard';
import { notFound } from 'next/navigation';
import ClassFinanceSummary from '@/components/public/ClassFinanceSummary';

async function getData(memberId: string) {
  const memberRef = doc(db, 'members', memberId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    return null;
  }
  const member = { id: memberSnap.id, ...memberSnap.data() } as Member;

  const transactionsCol = collection(db, 'transactions');
  const transactionsSnapshot = await getDocs(query(transactionsCol, orderBy('date', 'desc')));
  const transactions = transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate().toISOString(),
    } as unknown as Transaction;
  });

  return { member, transactions };
}

export default async function AnggotaPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);

  if (!data) {
    notFound();
  }

  const { member, transactions } = data;

  return (
    <div className="space-y-8">
      <PersonalDashboard
        member={member}
        transactions={transactions}
      />
      <ClassFinanceSummary transactions={transactions} />
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const membersCol = collection(db, 'members');
    const membersSnapshot = await getDocs(membersCol);
    return membersSnapshot.docs.map(doc => ({
      id: doc.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}
