
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSettings, getPeriodicDues } from '@/lib/actions';
import type { Member, Transaction, Settings } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import ArrearsDetailDialog from './ArrearsDetailDialog';

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

export default function PersonalDashboard({
  member,
  transactions,
}: {
  member: Member;
  transactions: Transaction[];
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [totalDues, setTotalDues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isArrearsDetailOpen, setArrearsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);

        if (fetchedSettings.startDate && fetchedSettings.duesAmount && fetchedSettings.duesFrequency) {
          const duesResult = await getPeriodicDues(
            fetchedSettings.startDate,
            fetchedSettings.duesAmount,
            fetchedSettings.duesFrequency
          );
          setTotalDues(duesResult.totalDues);
        }
      } catch (error) {
        console.error("Failed to fetch settings or calculate dues:", error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const { totalPaid, paymentHistory } = useMemo(() => {
    const memberPayments = transactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const total = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    return { totalPaid: total, paymentHistory: memberPayments };
  }, [transactions, member.id]);

  const outstandingDues = Math.max(0, totalDues - totalPaid);
  const paymentProgress = totalDues > 0 ? (totalPaid / totalDues) * 100 : 100;

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!settings || !settings.startDate) {
     return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>Selamat datang di dasbor keuangan pribadimu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Pengaturan Belum Lengkap</AlertTitle>
            <AlertDescription>
              Admin belum selesai mengatur parameter iuran kas. Silakan kembali lagi nanti.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>Selamat datang di dasbor keuangan pribadimu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Iuran Seharusnya</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalDues)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Iuran Dibayar</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalPaid)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tunggakan</CardDescription>
                 <CardTitle className={`text-2xl ${outstandingDues > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(outstandingDues)}
                </CardTitle>
              </CardHeader>
              {outstandingDues > 0 && (
                <CardFooter>
                  <Button variant="link" className="p-0 h-auto" onClick={() => setArrearsDetailOpen(true)}>Lihat Rincian</Button>
                </CardFooter>
              )}
            </Card>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Progress Pembayaran Iuran</p>
            <Progress value={paymentProgress} />
            <p className="text-xs text-right text-muted-foreground mt-1">{Math.round(paymentProgress)}% Lunas</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Riwayat Pembayaran</h3>
            <div className="rounded-md border max-h-96 overflow-y-auto">
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
                    paymentHistory.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>{formatDate(t.date)}</TableCell>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t.treasurer || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
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
      
      {settings && (
        <ArrearsDetailDialog
          isOpen={isArrearsDetailOpen}
          onOpenChange={setArrearsDetailOpen}
          settings={settings}
          transactions={transactions}
          member={member}
        />
      )}
    </>
  );
}
