"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Member, Transaction, Settings, CashierDay } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, Loader2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';
import { getSettings } from '@/lib/actions';


function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

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
  settings: initialSettings,
}: PersonalDashboardProps) {
  const [isDetailOpen, setDetailOpen] = useState(false);

  const {
    totalPaid,
    paymentStatus,
    arrearsDetails,
    totalDues,
    finalBalance,
  } = useMemo(() => {
    const duesAmount = initialSettings.duesAmount || 0;
    
    // Calculate total expected dues based on the number of cashier days
    const totalDues = cashierDays.length * duesAmount;

    // Calculate total paid by the member
    const memberPayments = transactions.filter(
      (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    const totalPaid = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    // Calculate personal expenses for the member
    const memberExpenses = transactions.filter(
        (t) => t.memberId === member.id && t.type === 'Pengeluaran'
    );
    const totalPersonalExpenses = memberExpenses.reduce((sum, t) => sum + t.amount, 0);


    // Determine payment status for each cashier day
    const paymentStatus = cashierDays.map(day => {
      const hasPaid = memberPayments.some(p => new Date(p.date) <= new Date(day.date) && p.description?.trim().toLowerCase() === day.description?.trim().toLowerCase());
       // A simple heuristic: check if a payment for this member exists for the same description.
       // This is not foolproof but works for most cases. A more robust system might link payments to specific cashier days.
      const hasMadeAnyPaymentOnDay = memberPayments.some(p => new Date(p.date).toDateString() === new Date(day.date).toDateString());
      return {
        ...day,
        status: hasMadeAnyPaymentOnDay ? 'Lunas' : 'Belum Lunas'
      };
    });
    
    // Filter for unpaid cashier days
    const arrearsDetails = paymentStatus.filter(p => p.status === 'Belum Lunas').map(p => ({label: p.description, amount: duesAmount}));

     // Add personal expenses to arrears
     memberExpenses.forEach(expense => {
        arrearsDetails.push({ label: `Beban: ${expense.description}`, amount: expense.amount });
    });


    // Calculate total class balance
    const totalIncome = transactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    const finalBalance = totalIncome - totalExpenses;

    return { totalPaid, paymentStatus, arrearsDetails, totalDues: totalDues + totalPersonalExpenses, finalBalance };
  }, [member.id, transactions, cashierDays, initialSettings.duesAmount]);


  const totalArrears = arrearsDetails.reduce((sum, item) => sum + item.amount, 0);
  const progress = totalDues > 0 ? (totalPaid / totalDues) * 100 : 100;
  const isFullyPaid = totalPaid >= totalDues;

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">
            Dashboard Keuangan: {member.name}
          </h1>
          <p className="text-muted-foreground">
            Ringkasan status iuran dan keuangan kelas Anda.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Iuran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
              <p className="text-xs text-muted-foreground">
                Total yang seharusnya dibayarkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bayar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                Total yang sudah Anda bayarkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tunggakan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalArrears > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(totalArrears)}
              </div>
              <p className="text-xs text-muted-foreground">Sisa iuran yang belum dibayar</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Kas Kelas</CardTitle>
               <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(finalBalance)}
              </div>
               <p className="text-xs text-muted-foreground">Sisa uang kas kelas saat ini</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progress Pembayaran Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="flex justify-between text-sm font-medium">
                <span>{formatCurrency(totalPaid)}</span>
                <span>{formatCurrency(totalDues)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert variant={isFullyPaid ? 'default' : 'destructive'} className={`${isFullyPaid ? 'bg-green-50 border-green-200 text-green-900' : ''}`}>
          <Terminal className="h-4 w-4" />
          <AlertTitle>
            {isFullyPaid ? 'Lunas!' : 'Anda Memiliki Tunggakan'}
          </AlertTitle>
          <AlertDescription>
            {isFullyPaid
              ? 'Terima kasih! Anda telah melunasi semua iuran kas.'
              : `Anda memiliki total tunggakan sebesar ${formatCurrency(totalArrears)}. `}
            {!isFullyPaid && (
              <Button
                variant="link"
                className="p-0 h-auto text-destructive font-bold"
                onClick={() => setDetailOpen(true)}
              >
                Lihat Rincian Tunggakan
              </Button>
            )}
          </AlertDescription>
        </Alert>

        <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-900">
            <Info className="h-4 w-4" />
            <AlertTitle>Informasi Penting</AlertTitle>
            <AlertDescription>
                Jumlah iuran adalah <strong>{formatCurrency(initialSettings.duesAmount || 0)}</strong> per pertemuan yang diadakan. Jika ada pertanyaan, hubungi bendahara kelas.
            </AlertDescription>
        </Alert>
      </div>
      <DuesDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setDetailOpen(false)}
        arrearsDetails={arrearsDetails}
      />
    </>
  );
}
