"use client";

import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import type { Member, Transaction } from '@/lib/types';
import { getPeriodicDues } from '@/lib/actions';
import useLocalStorage from '@/hooks/use-local-storage';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownCircle, ArrowUpCircle, Banknote, Scale, Users } from 'lucide-react';

type PersonalDashboardProps = {
  member: Member;
  transactions: Transaction[];
  allMembers: Member[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(timestamp: any) {
  if (!timestamp || !timestamp.toDate) return 'Tanggal tidak valid';
  return timestamp.toDate().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PersonalDashboard({
  member,
  transactions,
  allMembers,
}: PersonalDashboardProps) {
  const [startDate] = useLocalStorage<string | null>('kas-start-date', null);
  const [periodicDues, setPeriodicDues] = useState(0);
  const [isLoadingDues, setIsLoadingDues] = useState(true);

  useEffect(() => {
    async function fetchDues() {
      setIsLoadingDues(true);
      const result = await getPeriodicDues(startDate);
      setPeriodicDues(result.totalDues);
      setIsLoadingDues(false);
    }
    fetchDues();
  }, [startDate]);

  const financials = useMemo(() => {
    const memberDeposits = transactions.filter(
      t => t.type === 'Pemasukan' && t.memberId === member.id
    );
    const totalDeposits = memberDeposits.reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const sharedExpensePerMember = allMembers.length > 0 ? totalExpenses / allMembers.length : 0;

    const totalLiability = periodicDues + sharedExpensePerMember;
    const finalBalance = totalDeposits - totalLiability;

    const totalIncomeClass = transactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const classBalance = totalIncomeClass - totalExpenses;

    return {
      memberDeposits,
      totalDeposits,
      totalLiability,
      finalBalance,
      totalIncomeClass,
      totalExpenses,
      classBalance
    };
  }, [transactions, member.id, allMembers.length, periodicDues]);

  const { memberDeposits, totalDeposits, totalLiability, finalBalance, totalIncomeClass, totalExpenses, classBalance } = financials;

  const getStatus = (balance: number) => {
    if (balance >= 0) return { text: 'Lunas', color: 'bg-green-500' };
    return { text: 'Kurang Bayar', color: 'bg-destructive' };
  };

  const balanceStatus = getStatus(finalBalance);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Dashboard Keuangan {member.name}</h1>
        <p className="text-muted-foreground">Selamat datang kembali! Berikut adalah rincian keuangan Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">
              Total uang yang telah Anda setorkan.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDues ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(totalLiability)}</div>}
            <p className="text-xs text-muted-foreground">
              Total iuran mingguan & pembagian pengeluaran.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
             <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDues ? <Skeleton className="h-8 w-3/4" /> : 
            <>
              <div className={`text-2xl font-bold ${finalBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(finalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Status: <span className={`font-semibold ${finalBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>{balanceStatus.text}</span>
              </p>
            </>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Setoran Pribadi</CardTitle>
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
              {memberDeposits.length > 0 ? (
                memberDeposits.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Belum ada setoran.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="space-y-4 pt-8 border-t">
        <div className="text-center">
            <h2 className="text-2xl font-bold font-headline">Transparansi Keuangan Kelas</h2>
            <p className="text-muted-foreground">Ringkasan dan riwayat transaksi seluruh kelas.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pemasukan Kelas</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalIncomeClass)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengeluaran Kelas</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Kas Kelas</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(classBalance)}</div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama / Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'Pemasukan' ? 'default' : 'destructive'} className={`${t.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.type === 'Pemasukan' ? t.memberName : t.description}</TableCell>
                    <TableCell className={`text-right font-medium ${t.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                        {t.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
