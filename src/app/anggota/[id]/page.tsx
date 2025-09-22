
import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction } from '@/lib/types';
import { PersonalDashboard } from '@/components/public/PersonalDashboard';
import { notFound } from 'next/navigation';
import { ClassFinanceSummary } from '@/components/public/ClassFinanceSummary';
import { getCashierDays, getSettings } from '@/lib/actions';

async function getData(memberId: string) {
  const memberRef = doc(db, 'members', memberId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    return null;
  }
  const member = { id: memberSnap.id, ...memberSnap.data() } as Member;

  const allMembersSnapshot = await getDocs(collection(db, 'members'));
  const totalMembers = allMembersSnapshot.size;

  const transactionsCol = collection(db, 'transactions');
  const transactionsSnapshot = await getDocs(query(transactionsCol, orderBy('date', 'desc')));
  const transactions = transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate().toISOString(), // Convert Timestamp to ISO string
    } as unknown as Transaction;
  });

  const cashierDays = await getCashierDays();
  const settings = await getSettings();

  return { member, transactions, cashierDays, settings, totalMembers };
}

export default async function AnggotaPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);

  if (!data) {
    notFound();
  }

  const { member, transactions, cashierDays, settings, totalMembers } = data;

  return (
    <div className="space-y-8">
      <PersonalDashboard
        member={member}
        allTransactions={transactions}
        cashierDays={cashierDays}
        settings={settings}
        totalMembers={totalMembers}
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
