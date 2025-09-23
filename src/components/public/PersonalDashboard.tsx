"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, CheckCircle, XCircle, ArrowRight, Wallet, TrendingDown, TrendingUp } from 'lucide-react';

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
  const memberFinance = useMemo(() => {
    // 1. Total Iuran Wajib (Kewajiban dari pertemuan kas)
    const duesPerMeeting = settings.duesAmount || 0;
    const totalDues = cashierDays.length * duesPerMeeting;

    // 2. Total Pembayaran (Uang yang sudah disetor anggota)
    const totalPaid = allTransactions
      .filter((t) => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Beban Pengeluaran Pribadi
    const personalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const personalExpenseDetails = allTransactions.filter(
      (t) => t.type === 'Pengeluaran' && t.memberId === member.id
    );

    // 4. Beban Pengeluaran Bersama
    const sharedExpensesTotal = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;
    
    const sharedExpenseDetails = allTransactions.filter(
        (t) => t.type === 'Pengeluaran' && !t.memberId
    );

    // 5. Hitung Saldo Akhir
    const finalBalance = totalPaid - totalDues - personalExpenses - sharedExpensePerMember;

    return {
      totalPaid,
      totalDues,
      personalExpenses,
      personalExpenseDetails,
      sharedExpensePerMember,
      sharedExpenseDetails,
      finalBalance,
      totalMembers
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const {
    totalPaid,
    totalDues,
    personalExpenses,
    personalExpenseDetails,
    sharedExpensePerMember,
    sharedExpenseDetails,
    finalBalance,
  } = memberFinance;
  
  const totalLiabilities = totalDues + personalExpenses + sharedExpensePerMember;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">{member.name}</CardTitle>
          <CardDescription>Laporan Keuangan Personal</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-lg font-semibold text-muted-foreground">
                {finalBalance >= 0 ? 'Sisa Saldo Anda' : 'Total Tunggakan Anda'}
            </p>
            <h2 className={`text-4xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(finalBalance)}
            </h2>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Pemasukan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-6 w-6"/> Total Pemasukan
            </CardTitle>
            <CardDescription>Total uang yang telah Anda setorkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>

        {/* Kolom Kewajiban */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-6 w-6"/> Total Kewajiban
            </CardTitle>
            <CardDescription>Total tagihan dari iuran wajib dan pengeluaran.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalLiabilities)}</p>
             <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                    <span>Total Iuran Wajib:</span>
                    <span className="font-medium">{formatCurrency(totalDues)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Beban Pengeluaran Pribadi:</span>
                    <span className="font-medium">{formatCurrency(personalExpenses)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Beban Pengeluaran Bersama:</span>
                    <span className="font-medium">{formatCurrency(sharedExpensePerMember)}</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

       {/* Rincian Transaksi */}
       <Card>
        <CardHeader>
            <CardTitle>Rincian Transaksi</CardTitle>
            <CardDescription>Detail dari semua pemasukan, iuran wajib, dan pengeluaran Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div>
                <h3 className="font-semibold text-lg mb-2">Riwayat Pemasukan</h3>
                <ul className="space-y-1 text-sm list-disc list-inside">
                    {allTransactions
                        .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
                        .map(t => (
                            <li key={t.id} className="flex justify-between">
                                <span>{t.description} ({new Date(t.date).toLocaleDateString('id-ID')})</span>
                                <span className="font-medium text-green-600">{formatCurrency(t.amount)}</span>
                            </li>
                        ))
                    }
                     {allTransactions.filter(t => t.type === 'Pemasukan' && t.memberId === member.id).length === 0 && (
                        <p className="text-sm text-muted-foreground">Belum ada riwayat pemasukan.</p>
                    )}
                </ul>
            </div>
             <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">Rincian Kewajiban</h3>
                <p className="text-sm text-muted-foreground mb-2">Terdiri dari iuran wajib dan beban pengeluaran.</p>
                <ul className="space-y-1 text-sm list-disc list-inside">
                    {cashierDays.map(day => (
                         <li key={day.id} className="flex justify-between">
                            <span>Iuran Wajib: {day.description}</span>
                            <span className="font-medium text-destructive">-{formatCurrency(settings.duesAmount)}</span>
                        </li>
                    ))}
                    {personalExpenseDetails.map(t => (
                        <li key={t.id} className="flex justify-between">
                            <span>Pengeluaran Pribadi: {t.description}</span>
                            <span className="font-medium text-destructive">-{formatCurrency(t.amount)}</span>
                        </li>
                    ))}
                     {sharedExpenseDetails.map(t => (
                        <li key={t.id} className="flex justify-between">
                            <span>Anil Pengeluaran Bersama: {t.description}</span>
                            <span className="font-medium text-destructive">-{formatCurrency(sharedExpensePerMember / sharedExpenseDetails.length)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
