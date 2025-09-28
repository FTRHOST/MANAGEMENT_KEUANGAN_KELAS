"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Wallet, PiggyBank, MinusCircle, TrendingDown, ArrowRight, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

// Sub-component for Dues List
const DuesList = ({ paidDues, unpaidDues, duesAmount }: { paidDues: CashierDay[], unpaidDues: CashierDay[], duesAmount: number }) => (
    <AccordionItem value="dues">
        <AccordionTrigger>
            <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <div>
                    <h3 className="font-semibold">Rincian Iuran Wajib</h3>
                    <p className="text-sm text-muted-foreground">Status pembayaran iuran rutin Anda.</p>
                </div>
            </div>
        </AccordionTrigger>
        <AccordionContent>
            {paidDues.length === 0 && unpaidDues.length === 0 ? (
                 <p className="text-muted-foreground text-center py-4">Belum ada data hari kas yang ditambahkan oleh admin.</p>
            ) : (
                <div className="space-y-4 pt-2">
                    {unpaidDues.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Iuran Belum Dibayar ({formatCurrency(unpaidDues.length * duesAmount)})</h4>
                            <ul className="space-y-2">
                                {unpaidDues.map(day => (
                                    <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-red-50 dark:bg-destructive/10">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-destructive" />
                                            <span>{day.description}</span>
                                        </div>
                                        <span className="text-sm font-medium text-destructive">({formatCurrency(day.duesAmount || duesAmount)})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {paidDues.length > 0 && (
                       <div>
                            <h4 className="font-semibold mb-2">Iuran Lunas</h4>
                             <ul className="space-y-2">
                                {paidDues.map(day => (
                                     <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-green-50 dark:bg-green-500/10">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span>{day.description}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">({formatCurrency(day.duesAmount || duesAmount)})</span>
                                    </li>
                                ))}
                            </ul>
                       </div>
                    )}
                </div>
            )}
        </AccordionContent>
    </AccordionItem>
);

// Sub-component for Expenses List
const ExpensesList = ({ personalExpenses, sharedTransactions, sharedExpensePerMember, totalMembers }: { personalExpenses: Transaction[], sharedTransactions: (Transaction & { displayAmount?: number })[], sharedExpensePerMember: number, totalMembers: number }) => (
     <AccordionItem value="expenses">
        <AccordionTrigger>
             <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5" />
                <div>
                    <h3 className="font-semibold">Rincian Beban Pengeluaran</h3>
                    <p className="text-sm text-muted-foreground">Pengeluaran pribadi dan bersama yang ditanggung.</p>
                </div>
            </div>
        </AccordionTrigger>
        <AccordionContent>
             <div className="space-y-4 pt-2">
                {personalExpenses.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-1">Pengeluaran Pribadi</h4>
                        <ul className="divide-y divide-border">
                            {personalExpenses.map(tx => (
                                <li key={tx.id} className="flex justify-between items-center py-2">
                                    <span>{tx.description}</span>
                                    <span className="font-medium">{formatCurrency(tx.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                 <div>
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Beban Pengeluaran Bersama</h4>
                        <span className="font-semibold">{formatCurrency(sharedExpensePerMember)}</span>
                    </div>
                    {sharedTransactions && sharedTransactions.length > 0 ? (
                        <ul className="divide-y divide-border text-sm mt-1">
                            {sharedTransactions.map(tx => (
                                <li key={tx.id} className="flex justify-between items-center py-2">
                                    <div className="text-muted-foreground">
                                        <span>{tx.description}</span>
                                        {totalMembers > 0 && <span className="text-xs block opacity-80">({formatCurrency(tx.displayAmount || tx.amount)} / {totalMembers} orang)</span>}
                                    </div>
                                    <span className="font-medium text-muted-foreground">{totalMembers > 0 ? formatCurrency((tx.displayAmount || tx.amount) / totalMembers) : formatCurrency(0)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-3">Tidak ada pengeluaran bersama.</p>
                    )}
                </div>
            </div>
        </AccordionContent>
    </AccordionItem>
);

export function PersonalDashboard({
  member,
  allTransactions,
  cashierDays,
  settings,
  totalMembers
}: PersonalDashboardProps) {

  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalPaid,
    totalExpenses,
    unpaidDuesAmount,
    withdrawableBalance,
    personalExpenses,
    sharedTransactions,
    sharedExpensePerMember,
    paidDues,
    unpaidDues
  } = useMemo(() => {
    // Total uang yang sudah dibayar anggota
    const totalPaid = allTransactions
      .filter(t => t.memberId === member.id && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    // Semua transaksi pembayaran iuran oleh anggota
    const paymentTransactions = allTransactions.filter(
        (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    
    // Menandai hari kas mana yang sudah lunas
    let paidDuesCount = Math.floor(totalPaid / duesPerMeeting);
    const sortedCashierDays = [...cashierDays].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const paidDues: CashierDay[] = [];
    const unpaidDues: CashierDay[] = [];

    sortedCashierDays.forEach(day => {
        const dayDues = day.duesAmount || duesPerMeeting;
        if (paidDuesCount * duesPerMeeting >= dayDues) {
            paidDues.push(day);
            paidDuesCount = Math.floor((paidDuesCount * duesPerMeeting - dayDues) / duesPerMeeting);
        } else {
            unpaidDues.push(day);
        }
    });

    // Total iuran yang seharusnya dibayar
    const totalDuesLiability = cashierDays.reduce((sum, day) => sum + (day.duesAmount || duesPerMeeting), 0);
    
    // Tunggakan iuran wajib
    const unpaidDuesAmount = Math.max(0, totalDuesLiability - totalPaid);

    // Total pengeluaran pribadi
    const personalExpenses = allTransactions.filter(
      t => t.memberId === member.id && t.type === 'Pengeluaran'
    );
    const personalExpensesTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Total pengeluaran bersama dibagi rata
    const rawSharedTransactions = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    const sharedExpensesTotal = rawSharedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;

    // Group shared transactions for display in the accordion
    const sharedTransactionMap = new Map<string, Transaction & { displayAmount?: number }>();
    rawSharedTransactions.forEach(t => {
      const key = t.batchId || t.id;
      const existing = sharedTransactionMap.get(key);
      if (existing) {
        existing.displayAmount = (existing.displayAmount || existing.amount) + t.amount;
      } else {
        sharedTransactionMap.set(key, { ...t, displayAmount: t.amount });
      }
    });
    const sharedTransactions = Array.from(sharedTransactionMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Total semua beban pengeluaran
    const totalExpenses = Math.abs(personalExpensesTotal) + sharedExpensePerMember;

    // Sisa kas yang dapat ditarik
    const withdrawableBalance = Math.max(0, totalPaid - totalExpenses);

    return {
      totalPaid,
      totalExpenses,
      unpaidDuesAmount,
      withdrawableBalance,
      personalExpenses,
      sharedTransactions,
      sharedExpensePerMember,
      paidDues: paidDues.reverse(), // Show latest paid first
      unpaidDues
    };
  }, [member.id, allTransactions, cashierDays, totalMembers, duesPerMeeting]);


  return (
    <div className="space-y-6">
       <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">Halo, {member.name}!</h1>
            <p className="text-muted-foreground">Ini adalah ringkasan keuangan pribadimu di kelas.</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tunggakan Iuran</CardTitle>
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(unpaidDuesAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total iuran wajib yang belum dibayar.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
             <p className="text-xs text-muted-foreground">
              Pengeluaran pribadi & bagian pengeluaran bersama.
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
              Sisa uang setelah dikurangi semua beban pengeluaran.
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Rincian Keuangan</CardTitle>
                <CardDescription>Detail dari semua iuran, pengeluaran, dan pembayaran Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-muted/30">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-500/20">
                            <PiggyBank className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Kas Masuk</p>
                            <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-muted/30">
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Beban Pengeluaran</p>
                            <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                        </div>
                    </div>
                </div>
                 <Accordion type="multiple" className="w-full">
                   <DuesList paidDues={paidDues} unpaidDues={unpaidDues} duesAmount={duesPerMeeting} />
                   <ExpensesList personalExpenses={personalExpenses} sharedTransactions={sharedTransactions} sharedExpensePerMember={sharedExpensePerMember} totalMembers={totalMembers} />
                </Accordion>
            </CardContent>
        </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4 font-headline">Riwayat Transaksi Pribadi</h2>
        <div className="rounded-md border">
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
              {allTransactions
                .filter(t => t.memberId === member.id)
                .map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'Pemasukan' ? 'default' : 'destructive'}
                       className={`${t.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                      {t.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {allTransactions.filter(t => t.memberId === member.id).length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Belum ada riwayat transaksi.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}