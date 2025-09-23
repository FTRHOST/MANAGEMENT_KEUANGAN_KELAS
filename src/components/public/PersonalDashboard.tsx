
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowDown, ArrowUp, Banknote, ListChecks, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function formatCurrency(amount: number) {
  const isNegative = amount < 0;
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return isNegative ? `-${formattedAmount}` : formattedAmount;
}

type PersonalDashboardProps = {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
};

export function PersonalDashboard({
  member,
  allTransactions,
  cashierDays,
  settings,
  totalMembers,
}: PersonalDashboardProps) {

  const {
    totalDeposit,
    totalDues,
    personalExpenses,
    sharedExpensePerMember,
    totalCharges,
    finalBalance,
    duesDetails,
    expenseDetails
  } = useMemo(() => {
    const duesPerMeeting = settings.duesAmount || 0;
    
    // 1. Total Iuran Masuk (Deposit)
    const totalDeposit = allTransactions
      .filter((t) => t.memberId === member.id && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Total Tagihan
    // 2a. Iuran Wajib
    const totalDues = cashierDays.length * duesPerMeeting;
    const duesDetails = cashierDays.map(day => {
        // Find if the member has a payment transaction that matches the cashier day description.
        const payment = allTransactions.find(t => 
            t.memberId === member.id &&
            t.type === 'Pemasukan' &&
            t.description.toLowerCase() === day.description.toLowerCase()
        );
        return {
            description: day.description,
            date: day.date,
            amount: duesPerMeeting,
            status: payment ? 'paid' : 'unpaid',
            paidAmount: payment ? payment.amount : 0
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    // 2b. Beban Pengeluaran
    const personalExpenses = allTransactions
      .filter((t) => t.memberId === member.id && t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const validTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpenses / validTotalMembers;
    
    const expenseDetails = allTransactions.filter(t => t.type === 'Pengeluaran' && (t.memberId === member.id || !t.memberId)).map(t => ({
        description: t.description,
        date: t.date,
        amount: t.memberId === member.id ? t.amount : (t.amount / validTotalMembers),
        type: t.memberId === member.id ? 'Pribadi' : 'Bersama'
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalCharges = totalDues + personalExpenses + sharedExpensePerMember;
    
    // 3. Saldo Akhir
    const finalBalance = totalDeposit - totalCharges;

    return {
      totalDeposit,
      totalDues,
      personalExpenses,
      sharedExpensePerMember,
      totalCharges,
      finalBalance,
      duesDetails,
      expenseDetails
    };
  }, [member.id, allTransactions, cashierDays, settings.duesAmount, totalMembers]);

  return (
    <div className="space-y-6">
       <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">Halo, {member.name}!</h1>
            <p className="text-muted-foreground">Ini adalah ringkasan keuangan personalmu.</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Iuran Masuk</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDeposit)}</div>
            <p className="text-xs text-muted-foreground">Total uang yang telah kamu setorkan.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalCharges)}</div>
            <p className="text-xs text-muted-foreground">Total dari iuran wajib dan beban pengeluaran.</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? 'Sisa saldo kamu saat ini.' : 'Total tunggakan yang harus dibayar.'}
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/> Rincian Iuran Wajib</CardTitle>
            <CardDescription>Total Iuran Wajib: {formatCurrency(totalDues)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {duesDetails.map((due, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <div>
                        <p className="font-semibold">{due.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(due.date), "PPP", { locale: id })}</p>
                    </div>
                     <Badge variant={due.status === 'paid' ? 'default' : 'destructive'} className={due.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                       {due.status === 'paid' ? `Lunas (${formatCurrency(due.paidAmount)})` : `Belum Bayar (${formatCurrency(due.amount)})`}
                    </Badge>
                </div>
            ))}
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDown className="h-5 w-5 text-destructive"/> Rincian Beban Pengeluaran</CardTitle>
             <CardDescription>Total Beban: Pribadi {formatCurrency(personalExpenses)} + Bersama {formatCurrency(sharedExpensePerMember)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
             {expenseDetails.map((expense, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <div>
                        <p className="font-semibold">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "PPP", { locale: id })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">{formatCurrency(expense.amount)}</p>
                      <Badge variant="secondary">{expense.type}</Badge>
                    </div>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowUp className="h-5 w-5 text-green-600"/> Riwayat Iuran Masuk</CardTitle>
            <CardDescription>
              Total uang yang sudah kamu setorkan ke bendahara.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
             {allTransactions.filter(t => t.type === 'Pemasukan' && t.memberId === member.id).map((t, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <div>
                        <p className="font-semibold">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(t.date), "PPP", { locale: id })} - oleh {t.treasurer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(t.amount)}</p>
                    </div>
                </div>
            ))}
          </CardContent>
        </Card>
    </div>
  );
}

    