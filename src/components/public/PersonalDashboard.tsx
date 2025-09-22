"use client";

import { useEffect, useMemo, useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Member, Transaction, Settings } from '@/lib/types';
import { getPeriodicDues, getSettings } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

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

type PersonalDashboardProps = {
  member: Member;
  transactions: Transaction[];
};

export default function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [totalDues, setTotalDues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettingsAndDues() {
      setIsLoading(true);
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);
      
      if (fetchedSettings.startDate && fetchedSettings.duesAmount && fetchedSettings.duesFrequency) {
        const result = await getPeriodicDues(fetchedSettings.startDate, fetchedSettings.duesAmount, fetchedSettings.duesFrequency);
        setTotalDues(result.totalDues);
      }
      setIsLoading(false);
    }
    fetchSettingsAndDues();
  }, []);

  const { paidAmount, paymentHistory } = useMemo(() => {
    const personalPayments = transactions
      .filter((t) => t.type === 'Pemasukan' && t.memberId === member.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const paidAmount = personalPayments.reduce((sum, t) => sum + t.amount, 0);

    return {
      paidAmount,
      paymentHistory: personalPayments,
    };
  }, [transactions, member.id]);

  const arrears = useMemo(() => Math.max(0, totalDues - paidAmount), [totalDues, paidAmount]);
  const progress = useMemo(() => (totalDues > 0 ? (paidAmount / totalDues) * 100 : 100), [paidAmount, totalDues]);

  const duesStatus = useMemo(() => {
    if (arrears === 0 && totalDues > 0) return { text: 'Lunas', color: 'bg-green-500' };
    if (arrears > 0) return { text: 'Belum Lunas', color: 'bg-yellow-500' };
    return { text: 'Belum Ada Tagihan', color: 'bg-gray-500' };
  }, [arrears, totalDues]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className="text-3xl font-bold font-headline">Halo, {member.name}!</CardTitle>
            <CardDescription>
              Ini adalah ringkasan status iuran kas kelas Anda.
            </CardDescription>
          </div>
          <Badge className={`${duesStatus.color} text-white`}>{duesStatus.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {!settings?.startDate || !settings?.duesAmount ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Pengaturan Belum Lengkap</AlertTitle>
                <AlertDescription>
                  Admin belum mengatur tanggal mulai kas atau jumlah iuran. Tagihan belum dapat dihitung.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Tagihan</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(totalDues)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Dibayar</CardDescription>
                      <CardTitle className="text-2xl text-green-600">{formatCurrency(paidAmount)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Tunggakan</CardDescription>
                      <CardTitle className="text-2xl text-destructive">{formatCurrency(arrears)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                <div>
                  <div className="mb-2 flex justify-between">
                      <span className="text-sm text-muted-foreground">Progres Pembayaran</span>
                      <span className="text-sm font-semibold">{formatCurrency(paidAmount)} / {formatCurrency(totalDues)}</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Riwayat Pembayaran</h3>
          <div className="rounded-md border">
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
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>{t.description}</TableCell>
                       <TableCell>{t.treasurer || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Belum ada riwayat pembayaran.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
