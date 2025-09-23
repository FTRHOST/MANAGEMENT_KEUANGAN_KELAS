
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowDown, ArrowUp, Banknote, Coins, Landmark, Scale, Minus, Plus } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type PersonalDashboardProps = {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
};

export function PersonalDashboard({
  member,
  allTransactions,
  cashierDays,
  settings,
  totalMembers,
}: PersonalDashboardProps) {
  const {
    totalPaid,
    totalDues,
    totalExpenses,
    personalExpenses,
    sharedExpensePerMember,
    finalBalance,
    paymentTransactions,
    personalExpenseTransactions,
    sharedExpenseTransactions,
    unpaidDues
  } = useMemo(() => {
    // 1. Total Pembayaran (Kas Masuk)
    const paymentTransactions = allTransactions.filter(
      (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    const totalPaid = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 2. Total Iuran Wajib
    const duesPerMeeting = settings.duesAmount || 0;
    const totalDues = cashierDays.length * duesPerMeeting;

    // 3. Beban Pengeluaran
    // Pengeluaran pribadi
    const personalExpenseTransactions = allTransactions.filter(
        (t) => t.type === 'Pengeluaran' && t.memberId === member.id
    );
    const personalExpenses = personalExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Pengeluaran bersama
    const sharedExpenseTransactions = allTransactions.filter((t) => t.type === 'Pengeluaran' && !t.memberId);
    const sharedExpensesTotal = sharedExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;
    
    // Total beban pengeluaran untuk anggota ini
    const totalExpenses = personalExpenses + sharedExpensePerMember;

    // 4. Saldo Akhir
    // Saldo = Total Kas Masuk - (Total Iuran Wajib + Total Beban Pengeluaran)
    const finalBalance = totalPaid - totalDues - totalExpenses;
    
    // 5. Rincian Iuran yang Belum Dibayar
    const paidDuesDescriptions = new Set(paymentTransactions.map(t => t.description.toLowerCase()));
    const unpaidDues = cashierDays
        .filter(day => !paidDuesDescriptions.has(day.description.toLowerCase()));


    return {
      totalPaid,
      totalDues,
      totalExpenses,
      personalExpenses,
      sharedExpensePerMember,
      finalBalance,
      paymentTransactions,
      personalExpenseTransactions,
      sharedExpenseTransactions,
      unpaidDues
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);
  
  const totalLiabilities = totalDues + totalExpenses;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">
            Dasbor Personal {member.name}
          </CardTitle>
          <CardDescription>
            Rangkuman status keuangan Anda di kas kelas.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas Masuk</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              Total uang yang telah Anda setorkan.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalLiabilities)}</div>
             <p className="text-xs text-muted-foreground">
              Iuran Wajib ({formatCurrency(totalDues)}) + Beban Pengeluaran ({formatCurrency(totalExpenses)})
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
              {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
                {finalBalance >= 0 ? 'Sisa saldo Anda di kas kelas.' : 'Total tunggakan yang perlu dilunasi.'}
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Rincian Keuangan</CardTitle>
                <CardDescription>Detail semua transaksi dan iuran wajib Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold">
                            <div className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-green-600" />
                                <span>Riwayat Kas Masuk ({formatCurrency(totalPaid)})</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                             <ul className="space-y-2 pt-2">
                                {paymentTransactions.length > 0 ? paymentTransactions.map(t => (
                                    <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-green-50">
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                                        </div>
                                        <Badge variant="outline" className="text-green-700 border-green-200">{formatCurrency(t.amount)}</Badge>
                                    </li>
                                )) : <p className="text-sm text-muted-foreground p-2">Belum ada pembayaran.</p>}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-semibold">
                           <div className="flex items-center gap-2">
                                <Minus className="h-5 w-5 text-red-600" />
                                <span>Total Tagihan ({formatCurrency(totalLiabilities)})</span>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div>
                                    <h4 className="font-semibold mb-2">Iuran Wajib Belum Dibayar ({formatCurrency(unpaidDues.length * duesPerMeeting)})</h4>
                                    <ul className="space-y-2">
                                        {unpaidDues.length > 0 ? unpaidDues.map(day => (
                                            <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-red-50">
                                                <div>
                                                    <p className="font-medium">{day.description}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                                                </div>
                                                 <Badge variant="outline" className="text-red-700 border-red-200">{formatCurrency(duesPerMeeting)}</Badge>
                                            </li>
                                        )) : <p className="text-sm text-muted-foreground p-2">Semua iuran wajib sudah lunas!</p>}
                                    </ul>
                                </div>
                                 <div>
                                    <h4 className="font-semibold mb-2">Beban Pengeluaran ({formatCurrency(totalExpenses)})</h4>
                                     <ul className="space-y-2">
                                        {personalExpenseTransactions.map(t => (
                                            <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-orange-50">
                                                 <div>
                                                    <p className="font-medium">{t.description} (Pribadi)</p>
                                                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                                                </div>
                                                <Badge variant="outline" className="text-orange-700 border-orange-200">{formatCurrency(t.amount)}</Badge>
                                            </li>
                                        ))}
                                        <li className="flex justify-between items-center p-2 rounded-md bg-orange-50">
                                            <div>
                                                <p className="font-medium">Bagian Anda dari Pengeluaran Bersama</p>
                                                <p className="text-xs text-muted-foreground">{sharedExpenseTransactions.length} item pengeluaran</p>
                                            </div>
                                            <Badge variant="outline" className="text-orange-700 border-orange-200">{formatCurrency(sharedExpensePerMember)}</Badge>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
    