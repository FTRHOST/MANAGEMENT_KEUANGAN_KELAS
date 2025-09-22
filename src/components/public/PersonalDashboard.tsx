
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Member, Transaction, Settings } from '@/lib/types';
import { getSettings, getPeriodicDues } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Terminal, Info, Loader2, ListTree, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';
import { getWeeks, getMonths } from '@/lib/date-utils';

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
    return 'Invalid Date';
  }
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type ArrearsDetail = {
  label: string;
  amount: number;
};

type PersonalDashboardProps = {
  member: Member;
  transactions: Transaction[];
};

export function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [totalDues, setTotalDues] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [arrearsDetails, setArrearsDetails] = useState<ArrearsDetail[]>([]);

  useEffect(() => {
    async function fetchSettingsAndDues() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);
        if (fetchedSettings.startDate && fetchedSettings.duesAmount && fetchedSettings.duesFrequency) {
          const duesResult = await getPeriodicDues(fetchedSettings.startDate, fetchedSettings.duesAmount, fetchedSettings.duesFrequency);
          setTotalDues(duesResult.totalDues);
        }
      } catch (error) {
        console.error("Failed to fetch settings or dues:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettingsAndDues();
  }, []);

  const memberTransactions = useMemo(
    () => transactions.filter((t) => t.memberId === member.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, member.id]
  );

  const stats = useMemo(() => {
    const totalPaid = memberTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalArrears = totalDues - totalPaid;
    return { totalPaid, totalArrears };
  }, [memberTransactions, totalDues]);


  const handleShowDetails = () => {
    if (!settings?.startDate || !settings?.duesAmount || !settings.duesFrequency) {
      setArrearsDetails([]);
      setDetailOpen(true);
      return;
    }

    const periods = settings.duesFrequency === 'weekly'
      ? getWeeks(settings.startDate)
      : getMonths(settings.startDate);

    const paidTransactions = memberTransactions.filter(t => t.type === 'Pemasukan');

    const details = periods
      .map(period => {
        const hasPaid = paidTransactions.some(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= period.start && transactionDate <= period.end;
        });

        if (!hasPaid) {
          return {
            label: period.label,
            amount: settings.duesAmount || 0,
          };
        }
        return null;
      })
      .filter((item): item is ArrearsDetail => item !== null);

    setArrearsDetails(details);
    setDetailOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">
            Halo, {member.name}!
          </CardTitle>
          <CardDescription>
            Ini adalah ringkasan keuangan dan status iuran kas Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-8">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-700">Total Iuran Dibayar</h3>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-700">Total Iuran Seharusnya</h3>
              {isLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-900" />
              ) : (
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalDues)}</p>
              )}
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="text-sm font-medium text-red-700">Total Tunggakan</h3>
              {isLoading ? (
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-red-900" />
              ) : (
                <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalArrears > 0 ? stats.totalArrears : 0)}</p>
              )}
            </div>
          </div>
          
          {stats.totalArrears > 0 && !isLoading && (
            <div className="text-center mb-6">
                <Button onClick={handleShowDetails} variant="destructive">
                  <ListTree className="mr-2"/>
                  Lihat Rincian Tunggakan
                </Button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center"><HandCoins className="mr-2"/> Riwayat Pembayaran Iuran Anda</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberTransactions.filter(t => t.type === 'Pemasukan').length > 0 ? (
                    memberTransactions.filter(t => t.type === 'Pemasukan').map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        <div className="flex justify-center items-center py-8">
                            <Info className="mr-2" />
                            <span>Anda belum pernah membayar iuran kas.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <DuesDetailDialog 
        isOpen={isDetailOpen}
        onClose={() => setDetailOpen(false)}
        arrearsDetails={arrearsDetails}
        duesAmount={settings?.duesAmount || 0}
      />
    </>
  );
}
