import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction } from '@/lib/types';
import AdminTabs from './components/AdminTabs';

async function getAdminData() {
  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(query(membersCol, orderBy('name')));
  const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));

  const transactionsCol = collection(db, 'transactions');
  const transactionsSnapshot = await getDocs(query(transactionsCol, orderBy('date', 'desc')));
  const transactions = transactionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
  
  return { members, transactions };
}

export default async function AdminPage() {
    const { members, transactions } = await getAdminData();
  
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Panel Admin</h1>
                <p className="text-muted-foreground">Kelola keuangan dan anggota kelas di sini.</p>
            </div>
            <AdminTabs members={members} transactions={transactions} />
        </div>
    );
}
