
"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Member, Transaction, Settings, CashierDay } from '@/lib/types';
import { Terminal, Info, Loader2, Wallet, Scale, Users, TrendingUp, TrendingDown, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DuesDetailDialog from '@/components/public/DuesDetailDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatus(balance: number): { text: string; color: string; description: string } {
  if (balance > 0) {
    return {
      text: 'Lunas & Ada Sisa',
      color: 'bg-green-100 text-green-800',
      description: 'Anda memiliki sisa saldo. Mantap!',
    };
  } else if (balance === 0) {
    return {
      text: 'Lunas',
      color: 'bg-blue-100 text-blue-800',
      description: 'Semua iuran Anda telah lunas. Terima kasih!',
    };
  } else {
    return {
      text: 'Belum Lunas',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Anda memiliki tunggakan yang harus dibayar.',
    };
  }
}

type ArrearsDetail = {
  label: string;
  amount: number;
};

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
  const [arrearsDetails, setArrearsDetails] = useState<ArrearsDetail[]>([]);

  const duesPerMeeting = settings.duesAmount || 0;

  const finance = useMemo(() => {
    const myDeposits = allTransactions
      .filter((t) => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const myPersonalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const myShareOfSharedExpenses = totalMembers > 0 ? sharedExpenses / totalMembers : 0;

    const totalPaidForDues = Math.floor(myDeposits / duesPerMeeting);
    const expectedDuesCount = cashierDays.length;
    const totalDues = expectedDuesCount * duesPerMeeting;

    const finalBalance = myDeposits - totalDues - myPersonalExpenses - myShareOfSharedExpenses;
    
    // Total income and expenses for the entire class
    const totalIncome = allTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = allTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((acc, t) => acc + t.amount, 0);
    const classBalance = totalIncome - totalExpenses;


    return {
      totalDeposits: myDeposits,
      totalDues,
      finalBalance,
      myShareOfSharedExpenses,
      myPersonalExpenses,
      classBalance,
    };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  useEffect(() => {
    const paidDescriptions = new Set(
      allTransactions
        .filter((t) => t.type === 'Pemasukan' && t.memberId === member.id)
        .map((t) => t.description)
    );

    const unpaidDues = cashierDays
      .filter((day) => !paidDescriptions.has(day.description))
      .map((day) => ({
        label: day.description,
        amount: duesPerMeeting,
      }));
    
    setArrearsDetails(unpaidDues);

  }, [allTransactions, cashierDays, member.id, duesPerMeeting]);


  const status = getStatus(finance.finalBalance);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">
            Halo, {member.name}!
          </CardTitle>
          <CardDescription>
            Ini adalah ringkasan keuangan pribadimu di kelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Setoranmu
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(finance.totalDeposits)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Iuran Wajib</CardTitle>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <CircleHelp className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Total iuran dari {cashierDays.length} pertemuan.</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(finance.totalDues)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Akhirmu</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: finance.finalBalance < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                  {formatCurrency(finance.finalBalance)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Kas Kelas</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(finance.classBalance)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-l-4" style={{ borderColor: finance.finalBalance < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
             <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Info className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Status Pembayaran:</h3>
                            <Badge className={status.color}>{status.text}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {status.description}
                        </p>
                        {finance.finalBalance < 0 && (
                            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setDetailDialogOpen(true)}>Lihat Rincian Tunggakan</Button>
                        )}
                    </div>
                </div>
            </CardContent>
          </Card>
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

    