
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Member, Transaction, Settings, CashierDay } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Terminal, Info, Loader2, User, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';

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

type ArrearsDetail = {
  label: string;
  amount: number;
  paid: boolean;
};

type PersonalDashboardProps = {
  member: Member;
  transactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
};

export function PersonalDashboard({
  member,
  transactions,
  cashierDays,
  settings,
}: PersonalDashboardProps) {
  const [isDetailOpen, setDetailOpen] = useState(false);

  const {
    totalDues,
    totalPaid,
    balance,
    arrearsDetails,
    paymentPercentage,
    memberTransactions
  } = useMemo(() => {
    const duesAmount = settings.duesAmount || 0;
    const sortedCashierDays = cashierDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const calculatedTotalDues = sortedCashierDays.length * duesAmount;

    const memberPayments = transactions.filter(
      (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    const calculatedTotalPaid = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    const calculatedBalance = calculatedTotalPaid - calculatedTotalDues;

    const details: ArrearsDetail[] = sortedCashierDays.map(day => {
      // Find if a payment was made around this cashier day.
      // This is a simplified logic. A more robust solution might be needed.
      // For now, we assume one payment covers one due.
      const paymentForThisDay = memberPayments.find(p => {
        const paymentDate = new Date(p.date);
        const dayDate = new Date(day.date);
        // A simple check if payment is on the same day.
        return paymentDate.toISOString().split('T')[0] === dayDate.toISOString().split('T')[0];
      });

      // A more accurate way to calculate if a due is paid
      // is to count paid dues and compare with the index.
      const paidDuesCount = Math.floor(calculatedTotalPaid / duesAmount);
      const currentIndex = sortedCashierDays.findIndex(d => d.id === day.id);

      return {
        label: `${day.description} (${formatDate(day.date)})`,
        amount: duesAmount,
        paid: currentIndex < paidDuesCount,
      };
    });

    const arrears = details.filter(d => !d.paid);

    const percentage = calculatedTotalDues > 0 ? (calculatedTotalPaid / calculatedTotalDues) * 100 : 100;

    const personalTransactions = transactions.filter(t => t.memberId === member.id);

    return {
      totalDues: calculatedTotalDues,
      totalPaid: calculatedTotalPaid,
      balance: calculatedBalance,
      arrearsDetails: arrears,
      paymentPercentage: percentage,
      memberTransactions: personalTransactions,
    };
  }, [member.id, transactions, cashierDays, settings.duesAmount]);


  if (!settings) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Memuat Data...</CardTitle>
            </CardHeader>
            <CardContent>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
             <User className="h-8 w-8 text-primary" />
             <div>
                <CardTitle className="text-3xl font-bold font-headline">Halo, {member.name}!</CardTitle>
                <CardDescription>Ini adalah ringkasan status keuanganmu di kelas.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {balance >= 0 ? (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Status: Lunas</AlertTitle>
              <AlertDescription>
                Terima kasih! Semua iuran kas Anda sudah lunas.
                {balance > 0 && ` Anda memiliki kelebihan pembayaran sebesar ${formatCurrency(balance)}.`}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Status: Ada Tunggakan</AlertTitle>
              <AlertDescription>
                Anda memiliki tunggakan sebesar {formatCurrency(Math.abs(balance))}.
                <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setDetailOpen(true)}>Lihat Rincian</Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-3">
             <Card className="p-4">
                <CardHeader className="p-2 pt-0">
                   <CardTitle className="text-sm font-medium flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground"/>Total Tunggakan</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                    <div className="text-2xl font-bold">{formatCurrency(balance < 0 ? Math.abs(balance) : 0)}</div>
                </CardContent>
             </Card>
             <Card className="p-4">
                <CardHeader className="p-2 pt-0">
                   <CardTitle className="text-sm font-medium flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> Total Iuran Seharusnya</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                    <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
                    <p className="text-xs text-muted-foreground">dari {cashierDays.length} pertemuan</p>
                </CardContent>
             </Card>
             <Card className="p-4">
                <CardHeader className="p-2 pt-0">
                   <CardTitle className="text-sm font-medium flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground"/>Total Sudah Dibayar</CardTitle>
                </CardHeader>
                 <CardContent className="p-2 pt-0">
                    <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                </CardContent>
             </Card>
          </div>
          
          <div>
            <label className="text-sm font-medium">Progress Pembayaran</label>
            <div className="flex items-center gap-2">
              <Progress value={paymentPercentage} className="w-full" />
              <span className="text-sm font-semibold">{Math.round(paymentPercentage)}%</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Riwayat Transaksi Pribadi</h3>
            <div className="rounded-md border max-h-60 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberTransactions.length > 0 ? (
                    memberTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{formatDate(t.date)}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell className={`text-right font-semibold ${t.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                           {t.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Belum ada transaksi.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </CardContent>
      </Card>
      <DuesDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setDetailOpen(false)}
        arrearsDetails={arrearsDetails}
      />
    </>
  );
}
