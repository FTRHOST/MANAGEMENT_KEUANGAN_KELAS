"use client";

import { useState, useEffect, useMemo } from 'react';
import { getSettings, getPeriodicDues } from '@/lib/actions';
import type { Member, Transaction, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DuesDetailDialog from '@/components/public/DuesDetailDialog';
import { getWeeks, getMonths } from '@/lib/date-utils';

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

export function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [totalDues, setTotalDues] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [arrearsDetails, setArrearsDetails] = useState<Array<{ label: string; paid: boolean }>>([]);


  useEffect(() => {
    async function fetchSettingsAndDues() {
      try {
        setIsLoading(true);
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);

        if (fetchedSettings.startDate && fetchedSettings.duesAmount) {
          const duesResult = await getPeriodicDues(
            fetchedSettings.startDate,
            fetchedSettings.duesAmount,
            fetchedSettings.duesFrequency || 'weekly'
          );
          setTotalDues(duesResult.totalDues);
        }
      } catch (error) {
        console.error("Failed to fetch settings or dues", error);
        setTotalDues(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettingsAndDues();
  }, [member.id]);

  const { deposits, finalBalance, arrears } = useMemo(() => {
    const memberDeposits = transactions
      .filter((t) => t.memberId === member.id && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const memberExpenses = transactions
      .filter((t) => t.memberId === member.id && t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    const calculatedArrears = Math.max(0, totalDues - memberDeposits + memberExpenses);
    const calculatedFinalBalance = memberDeposits - totalDues - memberExpenses;

    return {
      deposits: memberDeposits,
      finalBalance: calculatedFinalBalance,
      arrears: calculatedArrears,
    };
  }, [transactions, member.id, totalDues]);

  const balanceStatus = useMemo(() => {
    if (finalBalance > 0) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Lunas & ada kelebihan',
      };
    } else if (finalBalance === 0 && arrears === 0) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Lunas',
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Ada tunggakan',
      };
    }
  }, [finalBalance, arrears]);

  const handleShowDetails = () => {
    if (!settings || !settings.startDate || !settings.duesAmount) return;

    const periods = settings.duesFrequency === 'weekly'
      ? getWeeks(settings.startDate)
      : getMonths(settings.startDate);

    const memberPayments = transactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan');

    const details = periods.map(period => {
      const paymentForPeriod = memberPayments.find(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= period.start && paymentDate <= period.end;
      });
      return {
        label: period.label,
        paid: !!paymentForPeriod,
      };
    });

    setArrearsDetails(details.filter(d => !d.paid));
    setDetailOpen(true);
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>
            Ini adalah ringkasan keuangan pribadimu di kelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(deposits)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Tunggakan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${arrears > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(arrears)}
                  </div>
                  {arrears > 0 && (
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleShowDetails}>
                        Lihat Rincian
                    </Button>
                   )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${balanceStatus.color}`}>
                    {formatCurrency(finalBalance)}
                  </div>
                  <p className={`text-xs text-muted-foreground`}>
                    Status: {balanceStatus.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          {!settings?.startDate && !isLoading && (
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4 !text-blue-800" />
                <AlertTitle>Informasi</AlertTitle>
                <AlertDescription>
                    Total tunggakan akan dihitung setelah admin mengatur tanggal mulai kas pada halaman pengaturan.
                </AlertDescription>
            </Alert>
          )}
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Catatan</AlertTitle>
            <AlertDescription>
              Total tunggakan dihitung berdasarkan iuran rutin yang ditetapkan oleh admin.
              Jika ada kesalahan, silakan hubungi bendahara.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      <DuesDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
        arrearsDetails={arrearsDetails}
        duesAmount={settings?.duesAmount || 0}
        duesFrequency={settings?.duesFrequency || 'weekly'}
      />
    </>
  );
}
