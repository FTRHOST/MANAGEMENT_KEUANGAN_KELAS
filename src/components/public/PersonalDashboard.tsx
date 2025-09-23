
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return format(new Date(dateString), "d MMMM yyyy", { locale: id });
}


type TransactionListProps = {
  title: string;
  transactions: { description: string; amount: number; date: string }[];
  totalAmount: number;
  emptyText: string;
};

function TransactionList({ title, transactions, totalAmount, emptyText }: TransactionListProps) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title} ({formatCurrency(totalAmount)})</h4>
      {transactions.length > 0 ? (
        <ul className="space-y-2">
          {transactions.map((item, index) => (
            <li key={index} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
              <div>
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}


type PersonalDashboardProps = {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
};

export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: PersonalDashboardProps) {
  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalPaid,
    totalDues,
    paidDuesTransactions,
    unpaidDues,
    personalExpenses,
    sharedExpensePerMember,
    totalExpenses,
    finalBalance,
    totalBill
  } = useMemo(() => {
    const memberTransactions = allTransactions.filter(t => t.memberId === member.id);
    const paidDuesTransactions = memberTransactions.filter(t => t.type === 'Pemasukan');
    const totalPaid = paidDuesTransactions.reduce((sum, t) => sum + t.amount, 0);

    const personalExpenses = memberTransactions.filter(t => t.type === 'Pengeluaran');
    const personalExpensesTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

    const sharedExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    const sharedExpensesTotal = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const validTotalMembers = totalMembers > 0 ? totalMembers : 1;
    const sharedExpensePerMember = sharedExpensesTotal / validTotalMembers;
    
    const totalExpenses = personalExpensesTotal + sharedExpensePerMember;

    const totalDues = cashierDays.length * duesPerMeeting;

    // Logic for paid/unpaid cashier days
    const paidDates = new Set(paidDuesTransactions.map(t => format(new Date(t.date), 'yyyy-MM-dd')));
    const unpaidDues = cashierDays.filter(day => !paidDates.has(format(new Date(day.date), 'yyyy-MM-dd')));

    // Conditional total bill logic
    let totalBill;
    if (totalDues > totalExpenses) {
        totalBill = totalDues;
    } else {
        totalBill = totalDues + totalExpenses;
    }

    // New Final Balance Calculation
    const finalBalance = totalPaid - totalExpenses;

    return {
      totalPaid,
      totalDues,
      paidDuesTransactions,
      unpaidDues,
      personalExpenses,
      sharedExpensePerMember,
      totalExpenses,
      finalBalance,
      totalBill
    };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">{member.name}</h1>
        <p className="text-muted-foreground text-lg">Ringkasan Keuangan Personal</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Kas Masuk</CardTitle>
            <CardDescription>Total uang yang telah Anda setorkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tagihan</CardTitle>
            <CardDescription>Total iuran wajib & beban pengeluaran.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalBill)}</p>
             <p className="text-xs text-muted-foreground mt-1">
                Iuran: {formatCurrency(totalDues)} + Beban: {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sisa Saldo</CardTitle>
             <CardDescription>
              {finalBalance >= 0 ? "Sisa dana setelah dikurangi pengeluaran." : "Tunggakan yang perlu Anda lunasi."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${finalBalance >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
              {formatCurrency(finalBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Detail Transaksi</CardTitle>
          <CardDescription>Rincian lengkap dari semua transaksi dan kewajiban Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-4">
            
            {/* Paid Dues Section */}
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold bg-green-50 px-4 rounded-md">
                    Iuran Wajib Lunas ({formatCurrency(paidDuesTransactions.reduce((sum, t) => sum + t.amount, 0))})
                </AccordionTrigger>
                <AccordionContent>
                   <div className="p-4 border rounded-b-md">
                     <TransactionList 
                       title=""
                       transactions={paidDuesTransactions.map(t => ({ description: t.description, amount: t.amount, date: t.date }))}
                       totalAmount={0} // total is in the trigger
                       emptyText="Belum ada iuran yang dibayar."
                     />
                   </div>
                </AccordionContent>
            </AccordionItem>

            {/* Unpaid Dues Section */}
            <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold bg-red-50 px-4 rounded-md">
                    Tunggakan Iuran Wajib ({formatCurrency(unpaidDues.length * duesPerMeeting)})
                </AccordionTrigger>
                <AccordionContent>
                   <div className="p-4 border rounded-b-md">
                      {unpaidDues.length > 0 ? (
                         <ul className="space-y-2">
                           {unpaidDues.map(day => (
                             <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-red-50">
                               <div>
                                 <p className="text-sm font-medium">{day.description}</p>
                                 <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                               </div>
                               <span className="text-sm font-semibold text-destructive">{formatCurrency(duesPerMeeting)}</span>
                             </li>
                           ))}
                         </ul>
                       ) : (
                         <p className="text-sm text-muted-foreground">Tidak ada tunggakan iuran.</p>
                       )}
                   </div>
                </AccordionContent>
            </AccordionItem>

            {/* Expenses Section */}
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-semibold bg-orange-50 px-4 rounded-md">
                Beban Pengeluaran ({formatCurrency(totalExpenses)})
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 border rounded-b-md space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <p>Pengeluaran Pribadi:</p>
                    <span className="font-semibold">{formatCurrency(personalExpenses.reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p>Pengeluaran Bersama (Bagian Anda):</p>
                    <span className="font-semibold">{formatCurrency(sharedExpensePerMember)}</span>
                  </div>
                  <hr className="my-2"/>
                   <TransactionList 
                       title="Rincian Pengeluaran Pribadi"
                       transactions={personalExpenses.map(t => ({ description: t.description, amount: t.amount, date: t.date }))}
                       totalAmount={0}
                       emptyText="Tidak ada pengeluaran pribadi."
                     />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

    