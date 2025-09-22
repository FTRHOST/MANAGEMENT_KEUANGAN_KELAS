"use client";

import { useMemo, useState } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';
import { Terminal, Info, Loader2, Wallet, Scale, Users, TrendingUp, TrendingDown, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);

  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalDeposits,
    totalDues,
    finalBalance,
    balanceStatus,
    balanceDescription,
    arrearsDetails,
    classBalance,
  } = useMemo(() => {
    const memberDeposits = allTransactions
      .filter((t) => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const personalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions
        .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpenses / totalMembers : 0;
    
    const totalPaidOnDuesDays = allTransactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedDues = cashierDays.length * duesPerMeeting;
    const currentDues = expectedDues - totalPaidOnDuesDays;
    
    const finalPersonalBalance = memberDeposits - personalExpenses - sharedExpensePerMember;
    
    const memberPaidForDays = new Set(
        allTransactions
            .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
            .map(t => t.description) // Assuming description matches cashier day description
    );

    const unpaidDays = cashierDays
        .filter(day => !memberPaidForDays.has(day.description))
        .map(day => ({ date: day.date, description: day.description, amount: duesPerMeeting }));
    
    const totalArrearsAmount = unpaidDays.reduce((sum, day) => sum + day.amount, 0);

    const totalDeposits = memberDeposits;
    const totalDues = totalArrearsAmount + personalExpenses + sharedExpensePerMember;
    const finalBalance = totalDeposits - totalDues;

    let balanceStatus: 'Lunas' | 'Kurang' | 'Lebih';
    let balanceDescription: string;
    if (finalBalance > 0) {
      balanceStatus = 'Lebih';
      balanceDescription = `Anda memiliki kelebihan pembayaran sebesar ${formatCurrency(finalBalance)}.`;
    } else if (finalBalance < 0) {
      balanceStatus = 'Kurang';
      balanceDescription = `Anda memiliki tunggakan sebesar ${formatCurrency(Math.abs(finalBalance))}.`;
    } else {
      balanceStatus = 'Lunas';
      balanceDescription = 'Selamat, Anda tidak memiliki tunggakan.';
    }

    const totalIncome = allTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    const classBalance = totalIncome - totalExpenses;

    return {
      totalDeposits,
      totalDues,
      finalBalance,
      balanceStatus,
      balanceDescription,
      arrearsDetails: unpaidDays,
      classBalance,
    };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline">Halo, {member.name}!</CardTitle>
              <CardDescription>Ini adalah ringkasan keuangan pribadimu di kelas.</CardDescription>
            </div>
             <Badge
              className={
                balanceStatus === 'Lunas'
                  ? 'bg-green-100 text-green-800'
                  : balanceStatus === 'Lebih'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }
            >
              Status: {balanceStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
                <p className="text-xs text-muted-foreground">Total uang yang telah Anda setorkan.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <CircleHelp className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Total tagihan mencakup iuran kas yang belum dibayar, ditambah bagian Anda dari setiap pengeluaran bersama kelas, dan pengeluaran pribadi yang dibebankan kepada Anda.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
                 <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setDetailDialogOpen(true)}>
                  Lihat Rincian Tagihan
                </Button>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Keuangan (Saldo)</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${finalBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(finalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Jika negatif, ini adalah jumlah yang harus Anda bayar.
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Kas Kelas Saat Ini</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(classBalance)}</div>
                 <p className="text-xs text-muted-foreground">Total uang yang ada di kas kelas.</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <DuesDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        arrearsDetails={arrearsDetails}
        duesPerMeeting={settings.duesAmount || 0}
      />
    </>
  );
}
