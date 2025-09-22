
"use client";

import { useMemo, useState } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Terminal, Info, Loader2, Wallet, Scale, Users, TrendingUp, TrendingDown, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string | Date) {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) {
    return 'Tanggal tidak valid';
  }
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);

  const memberTransactions = useMemo(() => {
    return allTransactions.filter(
      (t) => t.memberId === member.id || (t.type === 'Pengeluaran' && !t.memberId)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, member.id]);

  const { balance, arrearsDetails, totalDues, paymentProgress, totalPaid, totalExpenses } = useMemo(() => {
    const duesPerMeeting = settings.duesAmount || 0;
    const totalDues = cashierDays.length * duesPerMeeting;

    const memberDuesTransactions = allTransactions.filter(
      (t) => t.type === 'Pemasukan' && t.memberId === member.id
    );
    
    const totalPaid = memberDuesTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const personalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpenses / totalMembers : 0;
    const totalPersonalExpenses = personalExpenses + sharedExpensePerMember;

    const currentBalance = totalPaid - totalDues - totalPersonalExpenses;
    
    const progress = totalDues > 0 ? (totalPaid / (totalDues + totalPersonalExpenses)) * 100 : (totalPaid > 0 ? 100 : 0);

    const paidOnCashierDays = new Set<string>();
    memberDuesTransactions.forEach(t => {
      const relatedCashierDay = cashierDays.find(d => t.description.includes(d.description));
      if (relatedCashierDay) {
        paidOnCashierDays.add(relatedCashierDay.id);
      }
    });

    const arrears: { description: string; amount: number, type: 'Dues' | 'Shared' | 'Personal' }[] = [];
    cashierDays.forEach(day => {
      if (!paidOnCashierDays.has(day.id)) {
        arrears.push({
          description: `Iuran: ${day.description}`,
          amount: duesPerMeeting,
          type: 'Dues'
        });
      }
    });

    allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId).forEach(t => {
        arrears.push({
            description: `Beban Kelas: ${t.description}`,
            amount: t.amount / totalMembers,
            type: 'Shared'
        });
    });

    allTransactions.filter(t => t.type === 'Pengeluaran' && t.memberId === member.id).forEach(t => {
        arrears.push({
            description: `Beban Pribadi: ${t.description}`,
            amount: t.amount,
            type: 'Personal'
        });
    });


    return {
      balance: currentBalance,
      arrearsDetails: arrears,
      totalDues,
      paymentProgress: Math.min(100, progress),
      totalPaid,
      totalExpenses: totalPersonalExpenses,
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const totalClassBalance = useMemo(() => {
    const totalIncome = allTransactions.filter(t => t.type === 'Pemasukan').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTransactions.filter(t => t.type === 'Pengeluaran').reduce((sum, t) => sum + t.amount, 0);
    return totalIncome - totalExpenses;
  }, [allTransactions]);

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Dasbor Personal: {member.name}</h1>
        <p className="text-muted-foreground">Status keuangan dan riwayat transaksimu.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Keuangan (Saldo)
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance >= 0 ? 'Sisa uang Anda.' : 'Total yang perlu Anda bayar.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Total iuran yang telah dibayar.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDues + totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Total iuran wajib, beban pribadi & kelas.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas Kelas Saat Ini</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalClassBalance)}</div>
            <p className="text-xs text-muted-foreground">Sisa uang di kas kelas.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progres Pembayaran Iuran Wajib</CardTitle>
          <CardDescription>
            Persentase pembayaran iuran Anda dari total kewajiban iuran kas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={paymentProgress} className="w-full" />
          <div className="mt-2 flex justify-between text-sm font-medium">
            <span>{formatCurrency(totalPaid)}</span>
            <span>{formatCurrency(totalDues)}</span>
          </div>
          {arrearsDetails.length > 0 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(true)}>
                Lihat Rincian Tagihan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Personal</CardTitle>
          <CardDescription>
            Daftar semua transaksi yang terkait dengan Anda, termasuk pengeluaran bersama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Belum ada transaksi.</TableCell>
                </TableRow>
              ) : (
                memberTransactions.map((t) => {
                  const isSharedExpense = t.type === 'Pengeluaran' && !t.memberId;
                  const amount = isSharedExpense ? (t.amount / totalMembers) : t.amount;

                  return(
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'Pemasukan' ? 'default' : 'destructive'} className={`${t.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.description}
                        {isSharedExpense && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-2 cursor-help"><Users className="h-3 w-3 inline-block text-muted-foreground" /></span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Biaya ini adalah pengeluaran bersama yang dibagi rata.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${t.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                        {t.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(amount)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DuesDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        arrearsDetails={arrearsDetails}
        duesAmount={settings.duesAmount || 0}
      />
    </>
  );
}

    