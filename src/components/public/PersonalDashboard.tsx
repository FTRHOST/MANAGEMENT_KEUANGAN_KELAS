
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPeriodicDues, getSettings } from '@/lib/actions';
import { getWeeks, getMonths } from '@/lib/date-utils';
import type { Member, Transaction, Settings } from '@/lib/types';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type PersonalDashboardProps = {
  member: Member;
  transactions: Transaction[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

type ArrearsDetail = {
  label: string;
  isPaid: boolean;
};

export default function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [totalDues, setTotalDues] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettingsAndDues = async () => {
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
        } else {
          setTotalDues(0);
        }
      } catch (error) {
        console.error("Failed to fetch settings or dues:", error);
        setTotalDues(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettingsAndDues();
  }, []);

  const { totalDeposits, finalBalance, arrearsDetails } = useMemo(() => {
    const memberDeposits = transactions
      .filter((t) => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const memberExpenses = transactions
      .filter((t) => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const effectiveDues = totalDues + memberExpenses;
    const balance = memberDeposits - effectiveDues;

    let details: ArrearsDetail[] = [];
    if (settings?.startDate && settings?.duesAmount && settings?.duesFrequency) {
      const periods =
        settings.duesFrequency === 'weekly'
          ? getWeeks(settings.startDate)
          : getMonths(settings.startDate);

      const memberPaymentsInPeriods = periods.map(period => {
        const payment = transactions.find(t => 
            t.type === 'Pemasukan' && 
            t.memberId === member.id &&
            t.description?.includes(period.label.split(':')[0]) && // e.g. "Minggu" or "Agustus"
            new Date(t.date) >= period.start && new Date(t.date) <= period.end
        );
        return { ...period, isPaid: !!payment };
      });
      
      details = memberPaymentsInPeriods.map(p => ({ label: p.label, isPaid: p.isPaid }));
    }


    return {
      totalDeposits: memberDeposits,
      finalBalance: balance,
      arrearsDetails: details,
    };
  }, [member.id, transactions, totalDues, settings]);

  const balanceStatus =
    finalBalance >= 0
      ? {
          text: 'Lunas',
          color: 'text-green-600',
          icon: <CheckCircle2 className="mr-2" />,
        }
      : {
          text: 'Tunggakan',
          color: 'text-red-600',
          icon: <AlertCircle className="mr-2" />,
        };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">
          Dashboard Keuangan, {member.name}
        </CardTitle>
        <CardDescription>
          Ringkasan status iuran dan keuangan Anda di kelas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-center">
                  <TrendingUp className="mr-2 text-green-500" />
                  Total Setoran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalDeposits)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-center">
                  <TrendingDown className="mr-2 text-red-500" />
                  Total Tunggakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(finalBalance < 0 ? Math.abs(finalBalance) : 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-center">
                  <Wallet className="mr-2 text-blue-500" />
                  Saldo Akhir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${balanceStatus.color}`}>
                  {formatCurrency(finalBalance)}
                </p>
                <div
                  className={`flex items-center justify-center text-sm font-semibold ${balanceStatus.color}`}
                >
                  {balanceStatus.icon}
                  <span>{balanceStatus.text}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {finalBalance < 0 && !isLoading && (
          <div className="text-center mt-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Lihat Rincian Tunggakan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rincian Tunggakan - {member.name}</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periode</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arrearsDetails.map((item, index) =>
                        !item.isPaid ? (
                          <TableRow key={index}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-red-600">
                                Belum Lunas
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : null
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    