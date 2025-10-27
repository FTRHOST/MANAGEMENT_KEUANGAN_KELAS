import { getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import AdminTabs from './components/AdminTabs';
import { getCashierDays, getSettings } from '@/lib/actions';
import { collection, getDoc, doc } from 'firebase/firestore';
import { cookies } from 'next/headers';

/**
 * Fetches all the data needed for the admin page.
 * This includes members, transactions, cashier days, and settings.
 * @returns {Promise<object>} A promise that resolves to an object containing the admin data.
 */
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

/**
 * The admin page of the application.
 * It fetches the admin data and renders the AdminTabs component.
 * @returns {Promise<JSX.Element>} A promise that resolves to the admin page component.
 */
export default async function AdminPage() {
    const { members, transactions, cashierDays, settings } = await getAdminData();
    const cookieStore = cookies();
    const role = cookieStore.get('session_role')?.value ?? 'readonly';
    const isReadOnly = role === 'readonly';
  
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Panel Admin</h1>
                <p className="text-muted-foreground">
                  {isReadOnly 
                    ? 'Anda masuk dalam mode read-only. Semua fitur modifikasi dinonaktifkan.' 
                    : 'Kelola keuangan dan anggota kelas di sini.'
                  }
                </p>
            </div>
            <AdminTabs 
              members={members} 
              transactions={transactions} 
              cashierDays={cashierDays} 
              settings={settings} 
              isReadOnly={isReadOnly}
            />
        </div>
    );
}
