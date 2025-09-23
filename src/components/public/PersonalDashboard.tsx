
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToLine, ArrowUpFromLine, Banknote, Scale, Landmark, ReceiptText, CircleHelp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type PersonalDashboardProps = {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
};

export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: PersonalDashboardProps) {
  const {
    totalPaid,
    totalDues,
    personalExpenses,
    sharedExpensePerMember,
    finalBalance,
    totalExpenses,
    duesTransactions,
    expenseTransactions
  } = useMemo(() => {
    const totalPaid = allTransactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const duesPerMeeting = settings.duesAmount || 0;
    const totalDues = cashierDays.length * duesPerMeeting;

    const personalExpenses = allTransactions
      .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions
      .filter(t => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);

    const safeTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpenses / safeTotalMembers;
    
    const totalExpenses = personalExpenses + sharedExpensePerMember;

    const finalBalance = totalPaid - totalDues - totalExpenses;
    
    const duesTransactions = allTransactions.filter(t => t.type === 'Pemasukan' && t.memberId === member.id);
    const expenseTransactions = allTransactions.filter(t => (t.type === 'Pengeluaran' && t.memberId === member.id));

    return { totalPaid, totalDues, personalExpenses, sharedExpensePerMember, finalBalance, totalExpenses, duesTransactions, expenseTransactions };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const totalObligations = totalDues + totalExpenses;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Dashboard Personal: {member.name}</h1>
        <p className="text-muted-foreground">Ringkasan status keuangan Anda di kas kelas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas Masuk</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Total uang yang telah Anda setorkan.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kewajiban</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalObligations)}</div>
            <p className="text-xs text-muted-foreground">Total iuran wajib + semua beban pengeluaran.</p>
          </CardContent>
        </Card>

        <Card className={finalBalance < 0 ? "border-destructive" : "border-green-500"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {finalBalance < 0 ? "Total tunggakan yang perlu Anda lunasi." : "Sisa dana Anda setelah kewajiban terpenuhi."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rincian Kewajiban</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Landmark className="h-4 w-4 text-muted-foreground"/>
                  Total Iuran Wajib
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help"/>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{cashierDays.length} pertemuan x {formatCurrency(settings.duesAmount)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="font-semibold">{formatCurrency(totalDues)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Banknote className="h-4 w-4 text-muted-foreground"/>
                  Total Beban Pengeluaran
                </span>
                <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
              </li>
              <li className="flex justify-between items-center pl-8 text-xs text-muted-foreground">
                <span>Pengeluaran Pribadi</span>
                <span>{formatCurrency(personalExpenses)}</span>
              </li>
               <li className="flex justify-between items-center pl-8 text-xs text-muted-foreground">
                <span>Anil Pengeluaran Bersama</span>
                <span>{formatCurrency(sharedExpensePerMember)}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Setoran</CardTitle>
                <CardDescription>Daftar semua iuran yang telah Anda bayarkan.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {duesTransactions.length > 0 ? duesTransactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{formatDate(t.date)}</TableCell>
                                <TableCell>{t.description}</TableCell>
                                <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Belum ada setoran.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}

    