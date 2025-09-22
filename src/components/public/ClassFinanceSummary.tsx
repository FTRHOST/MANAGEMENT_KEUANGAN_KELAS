"use client";

import { useMemo } from 'react';
import type { Transaction } from '@/lib/types';
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
import { TrendingDown, TrendingUp, Scale } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string | Date) {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) {
    return 'Tanggal tidak valid';
  }
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type ClassFinanceSummaryProps = {
  transactions: Transaction[];
};

export default function ClassFinanceSummary({
  transactions,
}: ClassFinanceSummaryProps) {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    const finalBalance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, finalBalance };
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-headline">Ringkasan Keuangan Kelas</h2>
        <p className="text-muted-foreground">
          Statistik keseluruhan dan riwayat transaksi kas kelas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.finalBalance)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Kelas</CardTitle>
          <CardDescription>
            Seluruh transaksi pemasukan dan pengeluaran yang tercatat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama/Deskripsi</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === 'Pemasukan' ? 'default' : 'destructive'
                        }
                        className={transaction.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.type === 'Pemasukan'
                        ? transaction.memberName
                        : transaction.description}
                    </TableCell>
                    <TableCell>{transaction.treasurer || '-'}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === 'Pemasukan'
                          ? 'text-green-600'
                          : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'Pemasukan' ? '+' : '-'}{' '}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
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
