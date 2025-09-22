"use client";

import { useMemo, useState, useEffect } from 'react';
import type { Member, Transaction } from '@/lib/types';
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
import { getPeriodicDues } from '@/lib/actions';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';

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
};

export default function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [startDate] = useLocalStorage<string | null>('kas-start-date', null);
  const [totalDues, setTotalDues] = useState<number | null>(null);
  const [isLoadingDues, setLoadingDues] = useState(true);

  useEffect(() => {
    const fetchDues = async () => {
      setLoadingDues(true);
      try {
        const result = await getPeriodicDues(startDate);
        setTotalDues(result.totalDues);
      } catch (error) {
        console.error("Failed to fetch periodic dues:", error);
        setTotalDues(0); // Fallback to 0 if AI call fails
      }
      setLoadingDues(false);
    };

    fetchDues();
  }, [startDate]);

  const memberTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'Pemasukan' && t.memberId === member.id
    );
  }, [transactions, member.id]);

  const totalDeposits = useMemo(() => {
    return memberTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [memberTransactions]);

  const finalBalance = useMemo(() => {
    if (totalDues === null) return null;
    return totalDeposits - totalDues;
  }, [totalDeposits, totalDues]);

  const balanceStatus = useMemo(() => {
    if (finalBalance === null) {
      return {
        text: 'Menghitung...',
        color: 'bg-gray-500',
        icon: <Skeleton className="h-6 w-6 rounded-full" />,
      };
    }
    if (finalBalance >= 0) {
      return {
        text: 'Lunas',
        color: 'bg-green-500',
        icon: <CheckCircle2 className="h-6 w-6 text-white" />,
      };
    }
    return {
      text: 'Belum Lunas',
      color: 'bg-red-500',
      icon: <AlertCircle className="h-6 w-6 text-white" />,
    };
  }, [finalBalance]);


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">
          Dashboard Keuangan, {member.name}
        </h1>
        <p className="text-muted-foreground">
          Berikut adalah rincian keuangan iuran kas kelas Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDeposits)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Iuran</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDues ? (
                <Skeleton className="h-8 w-3/4" />
            ) : (
                <div className="text-2xl font-bold">
                    {formatCurrency(totalDues ?? 0)}
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          {finalBalance === null ? (
             <Skeleton className="h-8 w-1/2" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatCurrency(finalBalance)}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`flex h-2 w-2 rounded-full ${balanceStatus.color}`} />
                  {balanceStatus.text}
              </div>
            </>
          )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Setoran</CardTitle>
          <CardDescription>
            Berikut adalah daftar semua setoran iuran kas yang telah Anda lakukan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberTransactions.length > 0 ? (
                memberTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.treasurer}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Belum ada riwayat setoran.
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
