
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, DollarSign, PiggyBank, Receipt, Wallet } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Sub-component for displaying a list of dues
const DuesList = ({ title, dues, amount, isPaid = false }: { title: string, dues: CashierDay[], amount: number, isPaid?: boolean }) => {
    if (dues.length === 0) return null;
    
    const totalAmount = dues.length * amount;

    return (
        <div>
            <h4 className="font-semibold mb-2">{title} ({formatCurrency(totalAmount)})</h4>
            <ul className="space-y-2">
                {dues.map(day => (
                    <li key={day.id} className={`flex justify-between items-center p-2 rounded-md ${isPaid ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span>{day.description}</span>
                        <Badge variant={isPaid ? 'default' : 'destructive'} className={isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {formatCurrency(amount)}
                        </Badge>
                    </li>
                ))}
            </ul>
        </div>
    );
};


// Sub-component for displaying a list of expenses
const ExpensesList = ({ title, expenses, isShared = false, memberCount = 1 }: { title: string, expenses: Transaction[], isShared?: boolean, memberCount?: number }) => {
    if (expenses.length === 0) return null;

    return (
        <div>
            <h4 className="font-semibold mb-2">{title}</h4>
            <ul className="space-y-2">
                {expenses.map(expense => (
                    <li key={expense.id} className="flex justify-between items-center p-2 rounded-md bg-yellow-50">
                        <div className="flex flex-col">
                            <span>{expense.description}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                        </div>
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                            {formatCurrency(isShared ? expense.amount / memberCount : expense.amount)}
                        </Badge>
                    </li>
                ))}
            </ul>
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
    totalPaid,
    totalDues,
    personalExpenses,
    sharedExpenses,
    personalExpensesTotal,
    sharedExpensePerMember,
    totalArrears,
    withdrawableBalance,
    totalExpenses,
    paidDues,
    unpaidDues
  } = useMemo(() => {
    // 1. Total Pembayaran
    const totalPaid = allTransactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Total Iuran Wajib
    const totalDues = cashierDays.length * duesPerMeeting;

    // 3. Rincian Iuran Lunas & Belum Lunas
    const paidDuesCount = Math.floor(totalPaid / duesPerMeeting);
    const sortedCashierDays = [...cashierDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const paidDues = sortedCashierDays.slice(0, paidDuesCount);
    const unpaidDues = sortedCashierDays.slice(paidDuesCount);

    // 4. Beban Pengeluaran Pribadi
    const personalExpenses = allTransactions.filter(
      t => t.type === 'Pengeluaran' && t.memberId === member.id
    );
    const personalExpensesTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

    // 5. Beban Pengeluaran Bersama
    const sharedExpenses = allTransactions.filter(
      t => t.type === 'Pengeluaran' && !t.memberId
    );
    const sharedExpensesTotal = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;
    
    // 6. Total Beban Pengeluaran
    const totalExpenses = personalExpensesTotal + sharedExpensePerMember;

    // 7. Total Tunggakan Iuran
    const totalArrears = Math.max(0, totalDues - totalPaid);

    // 8. Sisa Kas yang Dapat Ditarik
    const withdrawableBalance = Math.max(0, totalPaid - totalExpenses);

    return {
      totalPaid,
      totalDues,
      personalExpenses,
      sharedExpenses,
      personalExpensesTotal,
      sharedExpensePerMember,
      totalArrears,
      withdrawableBalance,
      totalExpenses,
      paidDues,
      unpaidDues
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers, duesPerMeeting]);


  return (
    <>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold font-headline">Halo, {member.name}!</h1>
        <p className="text-muted-foreground">
          Berikut adalah ringkasan dan rincian keuangan kas Anda di kelas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tunggakan Iuran</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalArrears > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(totalArrears)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total iuran wajib yang belum Anda bayar.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban Pengeluaran</CardTitle>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pengeluaran pribadi & bersama Anda.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Kas (Dapat Ditarik)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${withdrawableBalance > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formatCurrency(withdrawableBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sisa dana setelah semua pengeluaran dilunasi.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction Details */}
      <Card>
        <CardHeader>
            <CardTitle>Rincian Keuangan</CardTitle>
            <CardDescription>Detail dari semua iuran dan beban pengeluaran Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-8 md:grid-cols-2">
                
                {/* Dues Details */}
                <div className="space-y-4">
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><PiggyBank className="w-5 h-5 text-primary"/> Rincian Iuran</h3>
                        <p className="text-sm text-muted-foreground">Total iuran wajib Anda adalah {formatCurrency(totalDues)} dari {cashierDays.length} pertemuan.</p>
                     </div>
                    
                    <div className="space-y-4 pt-2">
                        <DuesList title={`Iuran Lunas (${paidDues.length} dari ${cashierDays.length})`} dues={paidDues} amount={duesPerMeeting} isPaid={true} />
                        <DuesList title={`Iuran Belum Dibayar (${unpaidDues.length} dari ${cashierDays.length})`} dues={unpaidDues} amount={duesPerMeeting} isPaid={false} />
                    </div>
                </div>

                {/* Expenses Details */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Receipt className="w-5 h-5 text-destructive"/> Rincian Beban Pengeluaran</h3>
                        <p className="text-sm text-muted-foreground">
                           Beban pribadi: {formatCurrency(personalExpensesTotal)} + Beban bersama: {formatCurrency(sharedExpensePerMember)}.
                        </p>
                    </div>
                    <div className="space-y-4 pt-2">
                        <ExpensesList title="Pengeluaran Pribadi" expenses={personalExpenses} />
                        <ExpensesList title="Pengeluaran Bersama" expenses={sharedExpenses} isShared={true} memberCount={totalMembers} />
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </>
  );
}

    