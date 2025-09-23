
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowDown, ArrowUp, Banknote, Coins, FileText, Scale } from 'lucide-react';
import { Badge } from '../ui/badge';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('id-ID', {
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

// --- Sub-components for better structure ---

const DuesList = ({ title, dues, amountPerDue }: { title: string; dues: CashierDay[]; amountPerDue: number }) => (
    <div>
        <h4 className="font-semibold mb-2">{title} ({formatCurrency(dues.length * amountPerDue)})</h4>
        {dues.length > 0 ? (
            <ul className="space-y-2">
                {dues.map(day => (
                    <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 text-sm">
                        <span>{day.description} ({formatDate(day.date)})</span>
                        <span className="font-medium">{formatCurrency(amountPerDue)}</span>
                    </li>
                ))}
            </ul>
        ) : <p className="text-sm text-muted-foreground">Tidak ada.</p>}
    </div>
);

const ExpensesList = ({ title, expenses, isShared, membersCount }: { title: string; expenses: Transaction[]; isShared: boolean; membersCount: number; }) => (
    <div>
        <h4 className="font-semibold mb-2">{title}</h4>
        {expenses.length > 0 ? (
            <ul className="space-y-2">
                {expenses.map(t => (
                    <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 text-sm">
                        <span>{t.description} ({formatDate(t.date)})</span>
                        <span className="font-medium">
                           {isShared ? formatCurrency(t.amount / membersCount) : formatCurrency(t.amount)}
                        </span>
                    </li>
                ))}
            </ul>
        ) : <p className="text-sm text-muted-foreground">Tidak ada.</p>}
    </div>
);


export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: PersonalDashboardProps) {
  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalPaid,
    personalExpensesTotal,
    sharedExpensePerMember,
    totalDues,
    finalBalance,
    paidDues,
    unpaidDues,
    personalExpenses,
    sharedExpenses
  } = useMemo(() => {
    const memberTransactions = allTransactions.filter(t => t.memberId === member.id);
    const paid = memberTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const personalExp = memberTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const sharedExpTotal = allTransactions
      .filter(t => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const sharedExpPerMember = totalMembers > 0 ? sharedExpTotal / totalMembers : 0;

    const dues = cashierDays.length * duesPerMeeting;

    // Separate paid and unpaid dues
    const paidDescriptions = new Set(allTransactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan').map(t => t.description.toLowerCase()));
    const pDues = cashierDays.filter(day => paidDescriptions.has(day.description.toLowerCase()));
    const unDues = cashierDays.filter(day => !paidDescriptions.has(day.description.toLowerCase()));
    
    // Final balance calculation based on user feedback
    const balance = paid - (personalExp + sharedExpPerMember);

    const pExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && t.memberId === member.id);
    const sExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);


    return {
      totalPaid: paid,
      personalExpensesTotal: personalExp,
      sharedExpensePerMember: sharedExpPerMember,
      totalDues: dues,
      finalBalance: balance,
      paidDues: pDues,
      unpaidDues: unDues,
      personalExpenses: pExpenses,
      sharedExpenses: sExpenses
    };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  const totalExpenses = personalExpensesTotal + sharedExpensePerMember;
  const finalBalanceColor = finalBalance >= 0 ? 'text-green-600' : 'text-destructive';
  const finalBalanceDescription = finalBalance >= 0 ? "Sisa saldo Anda setelah dikurangi semua beban pengeluaran." : "Total tunggakan yang perlu Anda lunasi.";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">Halo, {member.name}!</h1>
        <p className="text-muted-foreground text-lg">Selamat datang di dasbor keuangan pribadimu.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Kas Masuk</CardTitle>
                  <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                  <p className="text-xs text-muted-foreground">Total uang yang telah Anda setorkan.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Iuran Wajib</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
                  <p className="text-xs text-muted-foreground">Total kewajiban iuran rutin Anda.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Beban Pengeluaran</CardTitle>
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                   <p className="text-xs text-muted-foreground">Pribadi {formatCurrency(personalExpensesTotal)} + Bersama {formatCurrency(sharedExpensePerMember)}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className={`text-2xl font-bold ${finalBalanceColor}`}>{formatCurrency(finalBalance)}</div>
                  <p className="text-xs text-muted-foreground">{finalBalanceDescription}</p>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>
                <div className="flex items-center gap-2">
                    <FileText /> Rincian Keuangan Anda
                </div>
            </CardTitle>
            <CardDescription>
                Detail semua transaksi dan iuran yang terkait dengan akun Anda untuk transparansi penuh.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" defaultValue={['unpaid-dues', 'personal-expenses']} className="w-full">
                <AccordionItem value="unpaid-dues">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            Iuran Wajib Belum Dibayar <Badge variant="destructive">{unpaidDues.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <DuesList title="" dues={unpaidDues} amountPerDue={duesPerMeeting} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="paid-dues">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                           Riwayat Pembayaran Iuran <Badge>{paidDues.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <DuesList title="" dues={paidDues} amountPerDue={duesPerMeeting} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="personal-expenses">
                     <AccordionTrigger>
                        <div className="flex items-center gap-2">
                           Beban Pengeluaran Pribadi <Badge variant="secondary">{personalExpenses.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ExpensesList title="" expenses={personalExpenses} isShared={false} membersCount={totalMembers} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shared-expenses">
                     <AccordionTrigger>
                        <div className="flex items-center gap-2">
                           Beban Pengeluaran Bersama <Badge variant="secondary">{sharedExpenses.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Setiap pengeluaran bersama dibagi rata untuk {totalMembers} anggota kelas.
                        </p>
                        <ExpensesList title="" expenses={sharedExpenses} isShared={true} membersCount={totalMembers} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

    