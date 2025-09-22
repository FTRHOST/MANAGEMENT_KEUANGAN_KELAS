
'use client';
import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { getSettings, getPeriodicDues } from '@/lib/actions';
import type { Member, Transaction, Settings } from '@/lib/types';
import { getWeeks, getMonths } from '@/lib/date-utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string | Date) {
  const date =
    typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) {
    return 'Tanggal tidak valid';
  }
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type ArrearsDetailProps = {
  settings: Settings;
  memberTransactions: Transaction[];
};

function ArrearsDetail({
  settings,
  memberTransactions,
}: ArrearsDetailProps) {
  const { startDate, duesAmount = 0, duesFrequency = 'weekly' } = settings;

  if (!startDate) {
    return <p>Tanggal mulai iuran belum diatur.</p>;
  }

  const periods =
    duesFrequency === 'weekly'
      ? getWeeks(startDate)
      : getMonths(startDate);

  const unpaidPeriods = periods.filter((period) => {
    const hasPaid = memberTransactions.some((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === 'Pemasukan' &&
        transactionDate >= period.start &&
        transactionDate <= period.end
      );
    });
    return !hasPaid;
  });

  if (unpaidPeriods.length === 0) {
    return <p>Tidak ada tunggakan iuran. Terima kasih!</p>;
  }

  return (
    <div className="space-y-4">
      <p>Berikut adalah rincian tunggakan iuran Anda:</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periode</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unpaidPeriods.map((period, index) => (
            <TableRow key={index}>
              <TableCell>{period.label}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(duesAmount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PersonalDashboard({
  member,
  transactions,
}: {
  member: Member;
  transactions: Transaction[];
}) {
  const [settings, setSettings] = useState<Settings>({});
  const [totalDues, setTotalDues] = useState(0);
  const [isLoading, setLoading] = useState(true);

  const memberTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.memberId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, member.id]
  );

  const stats = useMemo(() => {
    const totalPaid = memberTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const sharedExpenses = transactions
      .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const arrears = totalDues > totalPaid ? totalDues - totalPaid : 0;
    const totalArrears = arrears + sharedExpenses;

    const paymentProgress = totalDues > 0 ? (totalPaid / totalDues) * 100 : 100;

    return { totalPaid, totalArrears, paymentProgress, sharedExpenses };
  }, [memberTransactions, totalDues, member.id, transactions]);

  useState(() => {
    async function fetchSettingsAndDues() {
      setLoading(true);
      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);

        if (
          fetchedSettings.startDate &&
          fetchedSettings.duesAmount &&
          fetchedSettings.duesFrequency
        ) {
          // AI Calculation
          const duesResult = await getPeriodicDues(
            fetchedSettings.startDate,
            fetchedSettings.duesAmount,
            fetchedSettings.duesFrequency
          );
           setTotalDues(duesResult.totalDues);

        } else {
           setTotalDues(0);
        }
      } catch (error) {
        console.error('Failed to fetch settings or calculate dues:', error);
        setTotalDues(0);
      }
      setLoading(false);
    }

    fetchSettingsAndDues();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Dashboard Keuangan, {member.name}
        </h1>
        <p className="text-muted-foreground">
          Ringkasan status keuangan dan riwayat transaksi Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Iuran Wajib Dibayar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-1/2 animate-pulse rounded-md bg-muted"></div>
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(totalDues)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Telah Dibayar</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
          </CardContent>
        </Card>
         <Card className={stats.totalArrears > 0 ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tunggakan</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.totalArrears > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalArrears > 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(stats.totalArrears)}
            </div>
            {stats.totalArrears > 0 && settings.startDate && (
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">Lihat Rincian</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rincian Tunggakan</DialogTitle>
                      </DialogHeader>
                      {stats.arrears > 0 && (
                        <div>
                          <h3 className="font-semibold">Tunggakan Iuran Rutin</h3>
                           <ArrearsDetail settings={settings} memberTransactions={memberTransactions} />
                        </div>
                      )}
                      {stats.sharedExpenses > 0 && (
                        <div className="mt-4">
                           <h3 className="font-semibold">Tunggakan Pengeluaran Bersama</h3>
                           <p className="text-sm">Anda memiliki total {formatCurrency(stats.sharedExpenses)} tunggakan dari pengeluaran bersama kelas.</p>
                           {/* Detail of shared expenses could be listed here if needed */}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
            )}
          </CardContent>
        </Card>
      </div>
      
       <Card>
          <CardHeader>
            <CardTitle>Progres Pembayaran Iuran</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="h-4 w-full animate-pulse rounded-full bg-muted"></div>
            ) : (
                <Progress value={stats.paymentProgress} className="w-full" />
            )}
            <p className="text-sm text-muted-foreground mt-2">{Math.round(stats.paymentProgress)}% dari iuran wajib telah lunas.</p>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Anda</CardTitle>
          <CardDescription>
            Berikut adalah semua pemasukan dan pengeluaran yang tercatat atas nama Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberTransactions.length > 0 ? (
                memberTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.type === 'Pemasukan' ? 'default' : 'destructive'
                        }
                      >
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        t.type === 'Pemasukan'
                          ? 'text-green-600'
                          : 'text-destructive'
                      }`}
                    >
                      {t.type === 'Pemasukan' ? '+' : '-'}{' '}
                      {formatCurrency(t.amount)}
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
