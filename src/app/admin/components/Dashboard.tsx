
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Member, Transaction } from '@/lib/types';
import { ArrowDownCircle, ArrowUpCircle, Scale, Users, Wallet, ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';


function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard({
  members,
  transactions,
}: {
  members: Member[];
  transactions: Transaction[];
}) {
  const { toast } = useToast();

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const finalBalance = totalIncome - totalExpenses;
    const totalMembers = members.length;
    
    const treasurer1Income = transactions
      .filter((t) => t.type === 'Pemasukan' && t.treasurer === 'Bendahara 1')
      .reduce((sum, t) => sum + t.amount, 0);
    const treasurer1Expenses = transactions
      .filter((t) => t.type === 'Pengeluaran' && t.treasurer === 'Bendahara 1')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const treasurer1Balance = treasurer1Income - treasurer1Expenses;

    const treasurer2Income = transactions
      .filter((t) => t.type === 'Pemasukan' && t.treasurer === 'Bendahara 2')
      .reduce((sum, t) => sum + t.amount, 0);
    const treasurer2Expenses = transactions
        .filter((t) => t.type === 'Pengeluaran' && t.treasurer === 'Bendahara 2')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const treasurer2Balance = treasurer2Income - treasurer2Expenses;

    return { totalIncome, totalExpenses, finalBalance, totalMembers, treasurer1Balance, treasurer2Balance };
  }, [transactions, members]);

  const chartData = [
    {
      name: 'Keuangan Kelas',
      Pemasukan: stats.totalIncome,
      Pengeluaran: stats.totalExpenses,
    },
  ];
  
  const handleCopySummary = () => {
    const today = format(new Date(), 'EEEE, d MMMM yyyy', { locale: id });
    const textToCopy = `*📊 LAPORAN KEUANGAN KELAS 📊*

Berikut adalah ringkasan keuangan per tanggal ${today}:

*PEMASUKAN*
- Total Pemasukan: *${formatCurrency(stats.totalIncome)}*

*PENGELUARAN*
- Total Pengeluaran: *${formatCurrency(stats.totalExpenses)}*

*SALDO*
- Saldo Akhir Kelas: *${formatCurrency(stats.finalBalance)}*
- Saldo di Bendahara 1: *${formatCurrency(stats.treasurer1Balance)}*
- Saldo di Bendahara 2: *${formatCurrency(stats.treasurer2Balance)}*

*INFORMASI LAINNYA*
- Jumlah Anggota: *${stats.totalMembers}*

Terima kasih.`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: 'Ringkasan disalin!', description: 'Laporan ringkasan keuangan berhasil disalin.' });
    }).catch(err => {
        toast({ variant: 'destructive', title: 'Gagal menyalin', description: 'Tidak dapat menyalin teks ke clipboard.' });
        console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-end">
          <Button variant="outline" onClick={handleCopySummary}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Salin Ringkasan Laporan
          </Button>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pemasukan
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengeluaran
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.finalBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Saldo Bendahara 1</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.treasurer1Balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Saldo Bendahara 2</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.treasurer2Balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Anggota</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visualisasi Keuangan</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) =>
                  `Rp${new Intl.NumberFormat('id-ID').format(value as number)}`
                }
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
              />
              <Legend />
              <Bar dataKey="Pemasukan" fill="hsl(var(--primary))" />
              <Bar dataKey="Pengeluaran" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
