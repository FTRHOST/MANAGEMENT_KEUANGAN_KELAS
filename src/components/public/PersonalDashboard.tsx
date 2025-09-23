
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, TrendingDown, TrendingUp, Wallet, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper function to format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Component for rendering the list of unpaid dues
const DuesList = ({ days, title, amount }: { days: CashierDay[], title: string, amount: number }) => {
  if (days.length === 0) return null;
  return (
    <div>
      <h4 className="font-semibold mb-2">{title} ({formatCurrency(amount)})</h4>
      <ul className="space-y-2">
        {days.map(day => (
          <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-red-50 text-red-800">
            <span>{day.description} ({format(new Date(day.date), 'PPP', { locale: id })})</span>
            <span>{formatCurrency(2000)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component for rendering the list of expenses
const ExpensesList = ({ transactions, title }: { transactions: Transaction[], title: string }) => {
  if (transactions.length === 0) return null;
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <ul className="space-y-2">
        {transactions.map(t => (
          <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-orange-50 text-orange-800">
            <span>{t.description}</span>
            <span>{formatCurrency(t.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
}) {
  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalPaid,
    totalDues,
    personalExpenses,
    personalExpensesTransactions,
    sharedExpensePerMember,
    paidDues,
    unpaidDues
  } = useMemo(() => {
    const personalTransactions = allTransactions.filter(t => t.memberId === member.id);

    const totalPaid = personalTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDues = cashierDays.length * duesPerMeeting;

    const personalExpensesTransactions = personalTransactions.filter(t => t.type === 'Pengeluaran');
    const personalExpenses = personalExpensesTransactions.reduce((sum, t) => sum + t.amount, 0);

    const sharedExpensesTotal = allTransactions
      .filter(t => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const safeTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpensesTotal / safeTotalMembers;

    // Logic to determine paid/unpaid dues
    let paidAmountTracker = totalPaid;
    const paidDues: CashierDay[] = [];
    const unpaidDues: CashierDay[] = [];

    // Sort cashier days from oldest to newest to pay them in order
    const sortedCashierDays = [...cashierDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const day of sortedCashierDays) {
      if (paidAmountTracker >= duesPerMeeting) {
        paidDues.push(day);
        paidAmountTracker -= duesPerMeeting;
      } else {
        unpaidDues.push(day);
      }
    }

    return { totalPaid, totalDues, personalExpenses, personalExpensesTransactions, sharedExpensePerMember, paidDues, unpaidDues };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  const totalExpenses = personalExpenses + sharedExpensePerMember;
  const totalObligations = totalDues + totalExpenses;
  const finalBalance = totalPaid - totalObligations;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>
            Berikut adalah rincian keuangan dan status kas Anda di kelas.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas Masuk (Tabungan)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Total uang yang telah Anda setorkan.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalObligations)}</div>
            <p className="text-xs text-muted-foreground">Iuran wajib + total beban pengeluaran.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Saldo / Tunggakan</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? 'Sisa saldo Anda di kas.' : 'Total tunggakan yang harus dibayar.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Keuangan</CardTitle>
          <CardDescription>Detail dari semua iuran, pembayaran, dan pengeluaran yang memengaruhi saldo Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4">
            <DuesList days={unpaidDues} title="Iuran Wajib Belum Dibayar" amount={unpaidDues.length * duesPerMeeting} />
            
            {paidDues.length > 0 && unpaidDues.length > 0 && <Separator className="my-4"/>}

            {paidDues.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Iuran Wajib Lunas ({formatCurrency(paidDues.length * duesPerMeeting)})</h4>
                    <ul className="space-y-2">
                        {paidDues.map(day => (
                            <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-green-50 text-green-800">
                                <span><CheckCircle2 className="inline-block mr-2 h-4 w-4"/>{day.description}</span>
                                <span>Lunas</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
          
          <Separator />

          <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rincian Beban Pengeluaran ({formatCurrency(totalExpenses)})</h3>
              <ExpensesList transactions={personalExpensesTransactions} title="Beban Pengeluaran Pribadi" />
              {sharedExpensePerMember > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Beban Pengeluaran Bersama</h4>
                     <div className="flex justify-between items-center p-2 rounded-md bg-orange-50 text-orange-800">
                        <span>Kontribusi Anda untuk pengeluaran kelas</span>
                        <span>{formatCurrency(sharedExpensePerMember)}</span>
                    </div>
                </div>
              )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

    