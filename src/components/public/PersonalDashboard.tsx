
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Banknote, Coins, ReceiptText } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

type StatCardProps = {
  title: string;
  description: string;
  value: string;
  icon: React.ElementType;
  className?: string;
};

const StatCard = ({ title, description, value, icon: Icon, className }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const TransactionList = ({ title, transactions, type }: { title: string; transactions: Transaction[]; type: 'income' | 'expense' }) => {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="rounded-md border">
        <div className="flex flex-col">
          {transactions.map((item, index) => (
            <div key={item.id} className={`flex justify-between p-3 ${index < transactions.length - 1 ? 'border-b' : ''}`}>
              <div className="font-medium">{item.description}</div>
              <div className={`font-semibold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export function PersonalDashboard({
  member,
  allTransactions,
  cashierDays,
  settings,
  totalMembers,
}: {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
}) {
  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalDues,
    totalPaid,
    totalExpenses,
    personalExpenses,
    sharedExpenses,
    incomeTransactions,
    expenseTransactions
  } = useMemo(() => {
    const totalDues = cashierDays.length * duesPerMeeting;

    const memberTransactions = allTransactions.filter(t => t.memberId === member.id);
    
    const incomeTransactions = memberTransactions.filter(t => t.type === 'Pemasukan');
    const totalPaid = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const personalExpenses = memberTransactions.filter(t => t.type === 'Pengeluaran');
    const personalExpensesTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    const sharedExpensesTotal = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;

    const totalExpenses = personalExpensesTotal + sharedExpensePerMember;
    
    const expenseTransactions = [...personalExpenses, ...sharedExpenses.map(t => ({...t, amount: sharedExpensePerMember, description: `${t.description} (Beban Bersama)`}))];

    return { totalDues, totalPaid, totalExpenses, personalExpenses, sharedExpenses, incomeTransactions, expenseTransactions };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  // "Total kekurangan iuran wajib"
  const outstandingDues = Math.max(0, totalDues - totalPaid);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Halo, {member.name}!</h1>
        <p className="text-muted-foreground">Ini adalah rincian keuangan personal Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Tunggakan Iuran"
          value={formatCurrency(outstandingDues)}
          description="Total iuran wajib yang belum dilunasi."
          icon={ReceiptText}
          className={outstandingDues > 0 ? 'text-destructive' : 'text-green-600'}
        />
        <StatCard
          title="Total Beban Pengeluaran"
          value={formatCurrency(totalExpenses)}
          description="Total pengeluaran pribadi & bersama."
          icon={Coins}
          className="text-destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>Rincian semua pemasukan dan pengeluaran Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TransactionList title="Kas Masuk (Pembayaran)" transactions={incomeTransactions} type="income" />
          <TransactionList title="Beban Pengeluaran" transactions={expenseTransactions} type="expense" />
        </CardContent>
      </Card>
    </div>
  );
}
