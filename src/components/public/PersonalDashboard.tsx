
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Coins, HandCoins, PiggyBank, ReceiptText, Wallet } from 'lucide-react';

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

  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalDues,
    totalPaid,
    personalExpenses,
    sharedExpensePerMember,
    unpaidDues,
  } = useMemo(() => {
    // 1. Total Iuran Wajib
    const totalDues = cashierDays.length * duesPerMeeting;

    // 2. Total Pembayaran
    const totalPaid = allTransactions
      .filter(t => t.memberId === member.id && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Pengeluaran Pribadi
    const personalExpenses = allTransactions.filter(
      (t) => t.type === 'Pengeluaran' && t.memberId === member.id
    );

    // 4. Pengeluaran Bersama
    const sharedExpensesTotal = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
    const validTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpensesTotal / validTotalMembers;

    // 5. Cari iuran yang belum dibayar
    const paidDuesDescriptions = new Set(
        allTransactions
            .filter(t => t.memberId === member.id && t.type === 'Pemasukan')
            .map(t => t.description.toLowerCase())
    );

    const unpaidDues = cashierDays.filter(day => 
        !paidDuesDescriptions.has(day.description.toLowerCase())
    );

    return { totalDues, totalPaid, personalExpenses, sharedExpensePerMember, unpaidDues };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  // Perhitungan Beban
  const personalExpensesTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = personalExpensesTotal + sharedExpensePerMember;
  
  // Perhitungan Tunggakan Iuran
  const dueArrears = Math.max(0, totalDues - totalPaid);

  // Perhitungan Sisa Kas yang Dapat Ditarik
  const finalBalance = totalPaid - totalDues - totalExpenses;
  const withdrawableBalance = Math.max(0, finalBalance);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Halo, {member.name}!</CardTitle>
          <CardDescription>
            Ini adalah ringkasan keuangan personal Anda di kas kelas.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tunggakan Iuran</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dueArrears > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(dueArrears)}
            </div>
            <p className="text-xs text-muted-foreground">
                Total iuran wajib yang belum Anda bayarkan.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban Pengeluaran</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalExpenses)}
            </div>
             <p className="text-xs text-muted-foreground">
                Total pengeluaran (pribadi + bersama) yang ditanggung.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Kas (Dapat Ditarik)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
                {formatCurrency(withdrawableBalance)}
            </div>
             <p className="text-xs text-muted-foreground">
                Sisa dana setelah semua kewajiban terpenuhi.
            </p>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="w-full">
         <AccordionItem value="dues-details">
            <AccordionTrigger className="text-lg font-semibold">
                <div className='flex items-center gap-2'>
                    <PiggyBank /> Rincian Iuran & Pembayaran
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="grid gap-4 md:grid-cols-2">
                     <div>
                        <h4 className="font-semibold mb-2">Iuran Wajib ({formatCurrency(totalDues)})</h4>
                        <ul className="space-y-2">
                            {cashierDays.map(day => (
                                <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                                    <span>{day.description}</span>
                                    <span className="font-mono">{formatCurrency(duesPerMeeting)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Pembayaran Masuk ({formatCurrency(totalPaid)})</h4>
                        <ul className="space-y-2">
                           {allTransactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan').map(t => (
                                <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-green-50">
                                    <span>{t.description} <span className='text-xs text-muted-foreground'>({formatDate(t.date)})</span></span>
                                    <span className="font-mono text-green-600">+{formatCurrency(t.amount)}</span>
                                </li>
                            ))}
                            {totalPaid === 0 && <p className='text-sm text-muted-foreground'>Belum ada pembayaran.</p>}
                        </ul>
                    </div>
                </div>
                {unpaidDues.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-semibold mb-2 text-destructive">Detail Tunggakan Iuran ({formatCurrency(unpaidDues.length * duesPerMeeting)})</h4>
                        <ul className="space-y-2">
                            {unpaidDues.map(day => (
                                <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-red-50">
                                    <span>{day.description}</span>
                                    <span className="font-mono text-destructive">{formatCurrency(duesPerMeeting)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="expense-details">
          <AccordionTrigger className="text-lg font-semibold">
                <div className='flex items-center gap-2'>
                    <Coins /> Rincian Beban Pengeluaran
                </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <h4 className="font-semibold mb-2">Pengeluaran Pribadi ({formatCurrency(personalExpensesTotal)})</h4>
                    <ul className="space-y-2">
                        {personalExpenses.map(t => (
                            <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-red-50">
                                <span>{t.description} <span className='text-xs text-muted-foreground'>({formatDate(t.date)})</span></span>
                                <span className="font-mono text-destructive">-{formatCurrency(t.amount)}</span>
                            </li>
                        ))}
                        {personalExpenses.length === 0 && <p className='text-sm text-muted-foreground'>Tidak ada pengeluaran pribadi.</p>}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Bagian Pengeluaran Bersama ({formatCurrency(sharedExpensePerMember)})</h4>
                    <p className='text-sm text-muted-foreground'>
                        Anda menanggung sebagian dari total pengeluaran bersama kelas.
                    </p>
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

const DuesList = ({ title, items, currency, isPositive }: { title: string; items: { id: string; description: string; amount: number; date?: string; }[]; currency: (amount: number) => string; isPositive?: boolean; }) => (
    <div>
        <h4 className="font-semibold mb-2">{title} ({currency(items.reduce((sum, item) => sum + item.amount, 0))})</h4>
        <ul className="space-y-2">
            {items.map(item => (
                <li key={item.id} className={`flex justify-between items-center p-2 rounded-md ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span>
                        {item.description}
                        {item.date && <span className='text-xs text-muted-foreground'> ({formatDate(item.date)})</span>}
                    </span>
                    <span className={`font-mono ${isPositive ? 'text-green-600' : 'text-destructive'}`}>
                        {isPositive ? '+' : '-'}
                        {currency(item.amount)}
                    </span>
                </li>
            ))}
            {items.length === 0 && <p className='text-sm text-muted-foreground'>Tidak ada data.</p>}
        </ul>
    </div>
);
