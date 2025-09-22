
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Clock, TrendingDown, TrendingUp, User, Users, Wallet } from 'lucide-react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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
    totalDues,
    totalPaid,
    balance,
    paidWeeks,
    totalWeeks,
    paymentPercentage,
    personalExpenses,
    sharedExpensePerMember,
    personalExpenseTransactions,
    sharedExpenseTransactions,
  } = useMemo(() => {
    const duesPerMeeting = settings.duesAmount || 0;
    const totalWeeks = cashierDays.length;
    const totalDues = totalWeeks * duesPerMeeting;

    const memberPayments = allTransactions.filter(
      (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    const totalPaid = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    const paidWeeks = Math.floor(totalPaid / duesPerMeeting);
    const paymentPercentage = totalWeeks > 0 ? (paidWeeks / totalWeeks) * 100 : 0;

    const personalExpenseTransactions = allTransactions.filter(
      (t) => t.type === 'Pengeluaran' && t.memberId === member.id
    );
    const personalExpenses = personalExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenseTransactions = allTransactions.filter(
        (t) => t.type === 'Pengeluaran' && !t.memberId
    );
    const sharedExpenses = sharedExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const validTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpenses / validTotalMembers;
    
    const balance = totalPaid - totalDues - personalExpenses - sharedExpensePerMember;

    return {
      totalDues,
      totalPaid,
      balance,
      paidWeeks,
      totalWeeks,
      paymentPercentage,
      personalExpenses,
      sharedExpensePerMember,
      personalExpenseTransactions,
      sharedExpenseTransactions: sharedExpenseTransactions.map(t => ({...t, amount: t.amount / validTotalMembers})), // Show per-member amount
    };
  }, [member.id, allTransactions, cashierDays, settings.duesAmount, totalMembers]);

  const memberSpecificTransactions = allTransactions
    .filter(t => t.memberId === member.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <User className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-2 text-3xl font-headline">{member.name}</CardTitle>
          <CardDescription>
            Ringkasan status keuangan dan iuran kas Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {balance >= 0 ? (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 !text-green-600" />
                    <AlertTitle className="font-bold">Status: Lunas</AlertTitle>
                    <AlertDescription>
                        Terima kasih! Anda tidak memiliki tunggakan. Saldo Anda saat ini adalah <strong>{formatCurrency(balance)}</strong>.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert variant="destructive">
                    <Clock className="h-4 w-4" />
                    <AlertTitle className="font-bold">Status: Ada Tunggakan</AlertTitle>
                    <AlertDescription>
                        Anda memiliki tunggakan sebesar <strong>{formatCurrency(Math.abs(balance))}</strong>. Mohon segera selesaikan pembayaran.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500"/> Total Iuran Masuk</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totalPaid)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Dari total kewajiban iuran {formatCurrency(totalDues)}.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardDescription className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500"/> Total Beban Pengeluaran</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(personalExpenses + sharedExpensePerMember)}</CardTitle>
          </CardHeader>
           <CardContent>
            <p className="text-xs text-muted-foreground">Pribadi {formatCurrency(personalExpenses)} + Bersama {formatCurrency(sharedExpensePerMember)}.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardDescription className="flex items-center gap-2"><Wallet className="h-4 w-4 text-blue-500"/> Saldo Akhir</CardDescription>
            <CardTitle className={`text-3xl ${balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(balance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">Total Pemasukan - Total Beban.</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Rincian Beban Pengeluaran</CardTitle>
          <CardDescription>Detail pengeluaran yang dibebankan kepada Anda, baik secara pribadi maupun bersama.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {personalExpenseTransactions.length === 0 && sharedExpenseTransactions.length === 0 ? (
                 <p className="text-muted-foreground text-sm">Tidak ada data pengeluaran yang dibebankan kepada Anda.</p>
            ) : (
                <div className="space-y-3">
                    {personalExpenseTransactions.length > 0 && (
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-2"><User className="h-4 w-4"/>Beban Pribadi</h3>
                            <ul className="space-y-1 text-sm list-disc pl-5">
                                {personalExpenseTransactions.map(t => (
                                    <li key={t.id} className="flex justify-between">
                                        <span>{t.description}</span>
                                        <span className="font-medium text-destructive">-{formatCurrency(t.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {sharedExpenseTransactions.length > 0 && (
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-2"><Users className="h-4 w-4"/>Beban Bersama (dibagi rata)</h3>
                            <ul className="space-y-1 text-sm list-disc pl-5">
                                {sharedExpenseTransactions.map(t => (
                                    <li key={t.id} className="flex justify-between">
                                        <span>{t.description}</span>
                                        <span className="font-medium text-destructive">-{formatCurrency(t.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
       </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progres Pembayaran Iuran</CardTitle>
          <CardDescription>
            Anda telah membayar {paidWeeks} dari total {totalWeeks} pertemuan yang ada iurannya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={paymentPercentage} className="w-full" />
          <p className="text-right text-sm font-bold mt-2 text-primary">{paymentPercentage.toFixed(0)}% Lunas</p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Anda</CardTitle>
          <CardDescription>
            Semua transaksi pemasukan dan pengeluaran pribadi yang tercatat atas nama Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {memberSpecificTransactions.length > 0 ? (
            <ul className="space-y-3">
              {memberSpecificTransactions.map(t => (
                <li key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                  </div>
                   <Badge variant={t.type === 'Pemasukan' ? 'default' : 'destructive'} className={`font-bold ${t.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(t.amount)}
                    </Badge>
                </li>
              ))}
            </ul>
           ) : (
            <p className="text-muted-foreground text-sm">Belum ada riwayat transaksi untuk Anda.</p>
           )}
        </CardContent>
      </Card>

    </div>
  );
}

    