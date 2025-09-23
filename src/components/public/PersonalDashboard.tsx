
"use client";

import { useMemo } from 'react';
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
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Banknote, Landmark, MinusCircle, TrendingDown, Wallet } from 'lucide-react';

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

export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: PersonalDashboardProps) {
  const financialSummary = useMemo(() => {
    const memberTransactions = allTransactions.filter(t => t.memberId === member.id);
    const sharedExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    
    const totalPaid = memberTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const personalExpensesList = memberTransactions.filter(t => t.type === 'Pengeluaran');
    const personalExpenses = personalExpensesList.reduce((sum, t) => sum + t.amount, 0);

    const validTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpenses.reduce((sum, t) => sum + t.amount, 0) / validTotalMembers;
    
    const totalDues = (settings.duesAmount || 0) * cashierDays.length;

    const totalBill = totalDues + personalExpenses + sharedExpensePerMember;
    const finalBalance = totalPaid - totalBill;

    return {
      totalPaid,
      totalDues,
      personalExpenses,
      sharedExpensePerMember,
      totalBill,
      finalBalance,
      duesList: cashierDays,
      paymentList: memberTransactions.filter(t => t.type === 'Pemasukan'),
      personalExpensesList,
      sharedExpensesList: sharedExpenses,
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const {
    totalPaid,
    totalDues,
    personalExpenses,
    sharedExpensePerMember,
    finalBalance,
    duesList,
    paymentList,
    personalExpensesList,
    sharedExpensesList
  } = financialSummary;

  const totalExpenses = personalExpenses + sharedExpensePerMember;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">Halo, {member.name}!</h1>
        <p className="text-muted-foreground text-lg">
          Ini adalah ringkasan keuangan pribadimu di kelas.
        </p>
      </div>

      {/* Main Financial Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Iuran Masuk</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Jumlah yang sudah kamu setorkan.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Iuran Wajib</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
            <p className="text-xs text-muted-foreground">{duesList.length} pertemuan kas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Pribadi + patungan kelas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? 'Sisa saldo kamu.' : 'Jumlah yang perlu kamu lunasi.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Accordion */}
      <Card>
        <CardHeader>
            <CardTitle>Rincian Keuangan</CardTitle>
            <CardDescription>Lihat detail semua iuran, pembayaran, dan pengeluaranmu di sini.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="dues">
                    <AccordionTrigger>Rincian Iuran Wajib ({formatCurrency(totalDues)})</AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {duesList.map(due => (
                                <TableRow key={due.id}>
                                    <TableCell>{new Date(due.date).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell>{due.description}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(settings.duesAmount)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="payments">
                    <AccordionTrigger>Riwayat Pembayaran ({formatCurrency(totalPaid)})</AccordionTrigger>
                    <AccordionContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentList.length > 0 ? paymentList.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell>{new Date(payment.date).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell>{payment.description}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                </TableRow>
                                )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">Belum ada riwayat pembayaran.</TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="expenses">
                    <AccordionTrigger>Rincian Beban Pengeluaran ({formatCurrency(totalExpenses)})</AccordionTrigger>
                    <AccordionContent>
                       <p className="font-semibold text-md mb-2">Pengeluaran Pribadi ({formatCurrency(personalExpenses)})</p>
                        <Table className="mb-4">
                            <TableBody>
                                {personalExpensesList.length > 0 ? personalExpensesList.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                                </TableRow>
                                )) : (
                                     <TableRow><TableCell className="text-center text-muted-foreground">Tidak ada pengeluaran pribadi.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <p className="font-semibold text-md mb-2">Patungan Pengeluaran Bersama ({formatCurrency(sharedExpensePerMember)})</p>
                        <Table>
                            <TableBody>
                                {sharedExpensesList.length > 0 ? sharedExpensesList.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(expense.amount / (totalMembers > 0 ? totalMembers : 1))}</TableCell>
                                </TableRow>
                                )) : (
                                     <TableRow><TableCell className="text-center text-muted-foreground">Tidak ada pengeluaran bersama.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

    