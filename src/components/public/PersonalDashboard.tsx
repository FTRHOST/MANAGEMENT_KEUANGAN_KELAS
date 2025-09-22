
"use client";

import { useState, useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: PersonalDashboardProps) {
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);

  const duesPerMeeting = settings.duesAmount ?? 0;

  const { totalDeposits, totalDues, finalBalance, arrearsDetails, balanceStatus, currentClassBalance } = useMemo(() => {
    const memberDeposits = allTransactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const memberPersonalExpenses = allTransactions
        .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSharedExpenses = allTransactions
        .filter(t => t.type === 'Pengeluaran' && !t.memberId)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const memberShareOfSharedExpenses = totalMembers > 0 ? totalSharedExpenses / totalMembers : 0;

    const paidDuesDescriptions = allTransactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .map(t => t.description);

    const unpaidDues = cashierDays.filter(day => !paidDuesDescriptions.includes(day.description));

    const totalDuesFromCashierDays = unpaidDues.length * duesPerMeeting;

    const totalDues = totalDuesFromCashierDays + memberPersonalExpenses + memberShareOfSharedExpenses;

    const finalBalance = memberDeposits - totalDues;

    const arrearsDetails = unpaidDues.map(day => ({
        description: day.description,
        amount: duesPerMeeting
    }));
    
    if (memberPersonalExpenses > 0) {
        arrearsDetails.push({
            description: 'Pengeluaran Pribadi',
            amount: memberPersonalExpenses,
        });
    }

    if (memberShareOfSharedExpenses > 0) {
        arrearsDetails.push({
            description: 'Patungan Pengeluaran Kelas',
            amount: memberShareOfSharedExpenses,
        });
    }

    let status: { text: string; color: "bg-green-500" | "bg-yellow-500" | "bg-red-500"; description: string };
    if (finalBalance >= 0) {
      status = { text: 'Lunas', color: 'bg-green-500', description: 'Anda tidak memiliki tunggakan.' };
    } else {
      status = { text: 'Nunggak', color: 'bg-red-500', description: `Anda memiliki tunggakan sebesar ${formatCurrency(Math.abs(finalBalance))}` };
    }
    
    const totalIncome = allTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentClassBalance = totalIncome - totalExpenses;

    return {
      totalDeposits: memberDeposits,
      totalDues,
      finalBalance,
      arrearsDetails,
      balanceStatus: status,
      currentClassBalance,
    };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  const progressValue = finalBalance >= 0 ? 100 : (totalDeposits / totalDues) * 100;

  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Halo, {member.name}!</h1>
        <p className="text-muted-foreground">Ini adalah ringkasan keuangan kas Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">Jumlah uang yang telah Anda setorkan.</p>
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
                        <p className="max-w-xs">Total tagihan mencakup iuran wajib, pengeluaran pribadi yang dibebankan, dan patungan pengeluaran kelas.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
            <p className="text-xs text-muted-foreground">Total iuran dan pengeluaran Anda.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Personal</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
                {finalBalance < 0 ? 'Jumlah yang harus Anda bayar.' : 'Kelebihan pembayaran Anda.'}
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas Kelas</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentClassBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(currentClassBalance)}
            </div>
             <p className="text-xs text-muted-foreground">Sisa uang kas kelas saat ini.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Pembayaran</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
                <span className={`h-3 w-3 rounded-full ${balanceStatus.color}`}></span>
                <span>{balanceStatus.description}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressValue} className="w-full" />
           {finalBalance < 0 && (
             <div className="mt-4 text-center">
                <Button onClick={() => setDetailDialogOpen(true)}>Lihat Rincian Tunggakan</Button>
             </div>
           )}
        </CardContent>
      </Card>
      
      <DuesDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        arrearsDetails={arrearsDetails}
        duesPerMeeting={settings.duesAmount}
      />
    </>
  );
}
