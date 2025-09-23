
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, CheckCircle2, XCircle, DollarSign, ArrowDown, ArrowUp, Wallet, Scale } from 'lucide-react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string | Date) {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
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
  const { duesAmount } = settings;

  const {
    totalDeposit,
    personalExpenses,
    personalExpenseTransactions,
    sharedExpensePerMember,
    sharedExpenseTransactions,
    paymentHistory,
    finalBalance,
    totalExpenses,
    duesStatus,
  } = useMemo(() => {
    const memberTransactions = allTransactions.filter((t) => t.memberId === member.id);
    
    // Total uang yang telah disetor oleh anggota
    const totalDeposit = memberTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const paymentHistory = memberTransactions
      .filter((t) => t.type === 'Pemasukan')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Total pengeluaran yang dibebankan ke anggota secara pribadi
    const personalExpenses = memberTransactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const personalExpenseTransactions = memberTransactions
      .filter((t) => t.type === 'Pengeluaran');

    // Bagian anggota dari pengeluaran bersama
    const totalSharedExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = totalSharedExpenses / (totalMembers > 0 ? totalMembers : 1);
    const sharedExpenseTransactions = allTransactions.filter((t) => t.type === 'Pengeluaran' && !t.memberId);
    
    // Total semua beban pengeluaran
    const totalExpenses = personalExpenses + sharedExpensePerMember;
    
    // Saldo Akhir = Total Setoran - Total Beban Pengeluaran
    const finalBalance = totalDeposit - totalExpenses;

    // Menentukan status pembayaran iuran wajib
    const sortedCashierDays = [...cashierDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let paidDuesCount = Math.floor(totalDeposit / duesAmount);

    const duesStatus = sortedCashierDays.map((day) => {
      const isPaid = paidDuesCount > 0;
      if (isPaid) {
        paidDuesCount--;
      }
      return { ...day, isPaid };
    });

    return {
      totalDeposit,
      personalExpenses,
      personalExpenseTransactions,
      sharedExpensePerMember,
      sharedExpenseTransactions,
      paymentHistory,
      finalBalance,
      totalExpenses,
      duesStatus,
    };
  }, [member.id, allTransactions, cashierDays, duesAmount, totalMembers]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">{member.name}</h1>
        <p className="text-muted-foreground text-lg">Laporan Keuangan Personal</p>
      </div>

      {/* Main Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kas Anda (Total Setoran)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban Pengeluaran</CardTitle>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
                Pribadi {formatCurrency(personalExpenses)} + Bersama {formatCurrency(sharedExpensePerMember)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? 'Sisa saldo di kas' : 'Jumlah kekurangan'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dues Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><List className="h-5 w-5" />Status Iuran Wajib</CardTitle>
            <CardDescription>
                Daftar iuran wajib mingguan/bulanan dan status pembayarannya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {duesStatus.map((due) => (
                        <TableRow key={due.id}>
                             <TableCell>
                                <div>{due.description}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(due.date)}</div>
                            </TableCell>
                            <TableCell className="text-right">
                                {due.isPaid ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1 w-fit ml-auto">
                                        <CheckCircle2 className="h-3 w-3" /> Lunas
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="flex items-center gap-1 w-fit ml-auto">
                                        <XCircle className="h-3 w-3" /> Belum Lunas
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5"/>Rincian Beban Pengeluaran</CardTitle>
            <CardDescription>
                Detail pengeluaran yang dibebankan kepada Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <h3 className="font-semibold mb-2">Pengeluaran Pribadi</h3>
              {personalExpenseTransactions.length > 0 ? (
                <Table>
                    <TableBody>
                        {personalExpenseTransactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{t.description}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : <p className="text-sm text-muted-foreground">Tidak ada pengeluaran pribadi.</p>}

              <h3 className="font-semibold mt-4 mb-2">Pengeluaran Bersama</h3>
              {sharedExpenseTransactions.length > 0 ? (
                <Table>
                    <TableBody>
                        {sharedExpenseTransactions.map(t => (
                             <TableRow key={t.id}>
                                <TableCell>{t.description}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(t.amount / (totalMembers > 0 ? totalMembers : 1))}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : <p className="text-sm text-muted-foreground">Tidak ada pengeluaran bersama.</p>}
          </CardContent>
        </Card>
      </div>

       {/* Payment History */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowUp className="h-5 w-5"/>Riwayat Setoran Kas</CardTitle>
            <CardDescription>
                Semua transaksi pemasukan yang telah Anda lakukan.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {paymentHistory.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentHistory.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{formatDate(t.date)}</TableCell>
                                <TableCell>{t.description}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             ): (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat setoran.</p>
             )}
          </CardContent>
      </Card>
    </div>
  );
}
