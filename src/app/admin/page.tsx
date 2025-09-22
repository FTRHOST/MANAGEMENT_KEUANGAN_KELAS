import { getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import AdminTabs from './components/AdminTabs';
import { getCashierDays, getSettings } from '@/lib/actions';
import { collection, getDoc, doc } from 'firebase/firestore';


async function getAdminData() {
  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(query(membersCol, orderBy('name')));
  const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));

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

  const cashierDays = await getCashierDays();
  const settings = await getSettings();
  
  return { members, transactions, cashierDays, settings };
}

export default async function AdminPage() {
    const { members, transactions, cashierDays, settings } = await getAdminData();
  
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Panel Admin</h1>
                <p className="text-muted-foreground">Kelola keuangan dan anggota kelas di sini.</p>
            </div>
            <AdminTabs members={members} transactions={transactions} cashierDays={cashierDays} settings={settings} />
        </div>
    );
}
