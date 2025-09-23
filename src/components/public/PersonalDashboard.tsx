
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { ArrowUpCircle, ArrowDownCircle, Scale, PiggyBank, ReceiptText, Wallet } from 'lucide-react';


function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('id-ID', {
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

export function PersonalDashboard({ member, allTransactions, cashierDays, settings, totalMembers }: PersonalDashboardProps) {
  const financialSummary = useMemo(() => {
    const memberTransactions = allTransactions.filter(t => t.memberId === member.id);
    const sharedExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    
    const totalPaid = memberTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDues = (cashierDays.length || 0) * (settings.duesAmount || 0);
    
    const personalExpenses = memberTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalSharedExpenses = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = totalMembers > 0 ? totalSharedExpenses / totalMembers : 0;
    
    const totalExpenses = personalExpenses + sharedExpensePerMember;
    const totalObligations = totalDues + totalExpenses;
    const finalBalance = totalPaid - totalObligations;

    const paymentDetails = cashierDays.map(day => {
        const payment = memberTransactions.find(t => 
            t.type === 'Pemasukan' && 
            new Date(t.date).toDateString() === new Date(day.date).toDateString() &&
            t.description.toLowerCase().includes(day.description.toLowerCase().substring(0, 10)) // Simple match
        );
        return {
            description: day.description,
            date: day.date,
            amount: settings.duesAmount,
            paid: !!payment,
            paidAmount: payment?.amount || 0
        };
    });

    return {
      totalPaid,
      totalDues,
      totalExpenses,
      personalExpenses,
      sharedExpensePerMember,
      totalObligations,
      finalBalance,
      paymentDetails,
      personalExpenseDetails: memberTransactions.filter(t => t.type === 'Pengeluaran'),
      sharedExpenseDetails: sharedExpenses
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const {
    totalPaid,
    totalDues,
    totalExpenses,
    totalObligations,
    finalBalance,
    paymentDetails,
    personalExpenseDetails,
    sharedExpenseDetails,
    sharedExpensePerMember,
  } = financialSummary;

  return (
    <div className="space-y-6">
       <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight font-headline">Halo, {member.name.split(" ")[0]}!</h1>
            <p className="text-muted-foreground text-lg">
                Ini adalah rincian status keuanganmu di kas kelas.
            </p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
                <PiggyBank className="mr-2 h-4 w-4"/> Total Kas Masuk
            </CardTitle>
            <CardDescription>Jumlah total uang yang telah Anda setorkan ke kas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
                <ReceiptText className="mr-2 h-4 w-4"/> Total Kewajiban
            </CardTitle>
            <CardDescription>Total iuran wajib ditambah semua beban pengeluaran.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
                {formatCurrency(totalObligations)}
            </div>
             <p className="text-xs text-muted-foreground mt-1">
                Iuran Wajib: {formatCurrency(totalDues)} + Beban: {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                    <Wallet className="mr-2 h-4 w-4"/> Sisa Kas Personal
                </CardTitle>
                <CardDescription>
                    {finalBalance >= 0 
                        ? "Sisa dana Anda yang dapat ditarik setelah semua kewajiban terpenuhi."
                        : "Total tunggakan yang perlu Anda lunasi."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                className={cn(
                    'text-3xl font-bold',
                    finalBalance >= 0 ? 'text-green-600' : 'text-destructive'
                )}
                >
                {formatCurrency(finalBalance)}
                </div>
            </CardContent>
        </Card>
      </div>

       <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold">Rincian Pembayaran Iuran ({formatCurrency(totalPaid)} / {formatCurrency(totalDues)})</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-2">
                        {paymentDetails.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-card border">
                                <div>
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(item.date)}</p>
                                </div>
                                <Badge variant={item.paid ? 'default' : 'destructive'} className={item.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                   {item.paid ? `Lunas (${formatCurrency(item.paidAmount)})` : `Belum Lunas (${formatCurrency(item.amount)})`}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger className="text-xl font-semibold">Rincian Beban Pengeluaran ({formatCurrency(totalExpenses)})</AccordionTrigger>
                 <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <h3 className="font-semibold">Beban Pribadi</h3>
                             {personalExpenseDetails.length > 0 ? personalExpenseDetails.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-card border">
                                    <p>{item.description}</p>
                                    <p className="font-mono text-destructive">-{formatCurrency(item.amount)}</p>
                                </div>
                             )) : <p className="text-sm text-muted-foreground p-3 rounded-lg bg-card border">Tidak ada pengeluaran pribadi.</p>}
                        </div>
                         <div className="space-y-2">
                             <h3 className="font-semibold">Beban Bersama (Dibagi {totalMembers} Anggota)</h3>
                             {sharedExpenseDetails.length > 0 ? sharedExpenseDetails.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-card border">
                                    <p>{item.description}</p>
                                    <p className="font-mono text-destructive">-{formatCurrency(sharedExpensePerMember)}</p>
                                </div>
                             )) : <p className="text-sm text-muted-foreground p-3 rounded-lg bg-card border">Tidak ada pengeluaran bersama.</p>}
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}

    