"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSettings, getPeriodicDues } from '@/lib/actions';
import type { Member, Transaction, Settings } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DuesDetailDialog from './DuesDetailDialog';
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

export default function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [totalDues, setTotalDues] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettingsAndDues() {
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
        console.error("Failed to fetch settings or dues:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettingsAndDues();
  }, []);

  const { deposits, dues, finalBalance, balanceStatus, balanceDescription } = useMemo(() => {
    const memberDeposits = transactions
      .filter((t) => t.memberId === member.id && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const memberDues = transactions
      .filter((t) => t.memberId === member.id && t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalMemberDues = memberDues + totalDues;

    const balance = memberDeposits - totalMemberDues;

    let status = 'Lunas';
    let description = 'Anda tidak memiliki tunggakan.';
    let color = 'text-green-600';

    if (balance < 0) {
      status = 'Tunggakan';
      description = `Anda memiliki tunggakan sebesar ${formatCurrency(Math.abs(balance))}.`;
      color = 'text-red-600';
    } else if (balance > 0) {
      status = 'Lebih Bayar';
      description = `Anda memiliki kelebihan pembayaran sebesar ${formatCurrency(balance)}.`;
      color = 'text-blue-600';
    }

    return {
      deposits: memberDeposits,
      dues: totalMemberDues,
      finalBalance: balance,
      balanceStatus: { label: status, color: color },
      balanceDescription: description,
    };
  }, [member.id, transactions, totalDues]);
  
  const paymentPeriods = useMemo(() => {
    if (!settings?.startDate || !settings?.duesFrequency) return [];
    if (settings.duesFrequency === 'weekly') {
      return getWeeks(settings.startDate);
    }
    return getMonths(settings.startDate);
  }, [settings]);

  const unpaidPeriods = useMemo(() => {
    const memberPayments = transactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan');
    
    return paymentPeriods.filter(period => {
        const hasPaid = memberPayments.some(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= period.start && paymentDate <= period.end;
        });
        return !hasPaid;
    });
  }, [paymentPeriods, transactions, member.id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memuat Dashboard...</CardTitle>
          <CardDescription>Menghitung data keuangan Anda.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>
            Ini adalah ringkasan keuangan pribadimu di kelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Total Setoran</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(deposits)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Total Iuran/Tunggakan</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(dues)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Saldo Akhir</h3>
              <p className={`text-2xl font-bold ${balanceStatus.color}`}>{formatCurrency(finalBalance)}</p>
            </div>
          </div>
          <Alert className={`${balanceStatus.color.replace('text-', 'border-').replace('-600', '-200')} ${balanceStatus.color.replace('text-', 'bg-').replace('-600', '-50')}`}>
            <Info className={`h-4 w-4 ${balanceStatus.color}`} />
            <AlertTitle className={balanceStatus.color}>{balanceStatus.label}</AlertTitle>
            <AlertDescription>
              {balanceDescription}
              {finalBalance < 0 && (
                <DuesDetailDialog 
                  unpaidPeriods={unpaidPeriods} 
                  duesAmount={settings?.duesAmount ?? 0}
                />
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </>
  );
}
