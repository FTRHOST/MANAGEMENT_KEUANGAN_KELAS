"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Member, Transaction, Settings, CashierDay } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSettings } from '@/lib/actions';
import { Terminal, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCashierDays } from '@/lib/actions';

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

type ArrearDetail = {
  label: string;
  amount: number;
};

export function PersonalDashboard({
  member,
  transactions,
}: PersonalDashboardProps) {
  const [totalDues, setTotalDues] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cashierDays, setCashierDays] = useState<CashierDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchSettingsAndData() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getSettings();
        const fetchedCashierDays = await getCashierDays();
        
        setSettings(fetchedSettings);
        setCashierDays(fetchedCashierDays);

        if (fetchedSettings.duesAmount && fetchedCashierDays.length > 0) {
            const calculatedDues = fetchedCashierDays.length * (fetchedSettings.duesAmount || 0);
            setTotalDues(calculatedDues);
        }

      } catch (error) {
        console.error("Failed to fetch settings or cashier days:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettingsAndData();
  }, []);
  
  const { paidAmount, arrears, paymentProgress, arrearsDetails } = useMemo(() => {
    const memberPayments = transactions.filter(
      (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    const paidAmount = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    const arrearsAmount = totalDues - paidAmount;
    const arrears = arrearsAmount > 0 ? arrearsAmount : 0;
    
    const paymentProgress = totalDues > 0 ? (paidAmount / totalDues) * 100 : 100;

    let details: ArrearDetail[] = [];
    if (arrears > 0 && cashierDays.length > 0 && settings?.duesAmount) {
        const duesPerMeeting = settings.duesAmount;
        let paidCounter = paidAmount;

        for (const day of cashierDays) {
            if (paidCounter >= duesPerMeeting) {
                paidCounter -= duesPerMeeting;
            } else {
                details.push({
                    label: day.description,
                    amount: duesPerMeeting,
                });
            }
        }
    }


    return { paidAmount, arrears, paymentProgress, arrearsDetails: details.reverse() };
  }, [member.id, transactions, totalDues, cashierDays, settings]);

  const memberExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'Pengeluaran' && t.memberId === member.id);
  }, [transactions, member.id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memuat Data...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>
            Ini adalah ringkasan keuangan kas Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status Iuran Wajib</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Iuran Seharusnya</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(totalDues)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Iuran Dibayar</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(paidAmount)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tunggakan</CardDescription>
                  <CardTitle className={`text-2xl ${arrears > 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(arrears)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
             {arrears > 0 && (
                <Button onClick={() => setDetailOpen(true)}>Lihat Rincian Tunggakan</Button>
            )}
          </div>

          <div className="space-y-2">
             <h3 className="text-lg font-medium">Progres Pembayaran</h3>
            <Progress value={paymentProgress} />
            <p className="text-sm text-muted-foreground">
              {Math.round(paymentProgress)}% iuran telah diselesaikan.
            </p>
          </div>
          
           {memberExpenses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tunggakan Pengeluaran Bersama</h3>
               <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Anda Memiliki Tanggungan</AlertTitle>
                  <AlertDescription>
                    Anda memiliki tanggungan iuran untuk pengeluaran bersama. Mohon segera lunasi kepada bendahara.
                    <ul className="mt-2 list-disc pl-5">
                      {memberExpenses.map(expense => (
                        <li key={expense.id}>
                          {expense.description}: <strong>{formatCurrency(expense.amount)}</strong>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
            </div>
           )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Riwayat Pembayaran Iuran</h3>
            <Card>
              <CardContent className="p-0">
                <div className="max-h-60 overflow-y-auto">
                    {transactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan').length > 0 ? (
                        <table className="w-full text-sm">
                            <tbody>
                                {transactions
                                    .filter(t => t.memberId === member.id && t.type === 'Pemasukan')
                                    .map(t => (
                                        <tr key={t.id} className="border-b">
                                            <td className="p-3">
                                                <p className="font-medium">{t.description}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                                            </td>
                                            <td className="p-3 text-right font-medium text-green-600">{formatCurrency(t.amount)}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    ) : (
                         <div className="p-6 text-center text-muted-foreground">
                            <Terminal className="mx-auto h-8 w-8" />
                            <p>Belum ada riwayat pembayaran.</p>
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {arrearsDetails.length > 0 && (
        <DuesDetailDialog
          isOpen={isDetailOpen}
          onClose={() => setDetailOpen(false)}
          arrearsDetails={arrearsDetails}
          duesAmount={settings?.duesAmount || 0}
        />
      )}
    </>
  );
}
