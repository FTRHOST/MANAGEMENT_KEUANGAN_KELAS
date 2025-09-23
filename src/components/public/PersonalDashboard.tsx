
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowDown, ArrowUp, Banknote, Coins, FileWarning, PiggyBank, Scale, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

type DetailsListProps = {
  title: string;
  amount: number;
  items: { id: string; description: string; amount: number; date?: string; type: 'paid' | 'unpaid' | 'expense' }[];
};

function DetailsList({ title, amount, items }: DetailsListProps) {
    if (items.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold mb-2">{title} ({formatCurrency(amount)})</h4>
            <div className="rounded-md border max-h-60 overflow-y-auto">
                <Table>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <p className="font-medium">{item.description}</p>
                                    {item.date && (
                                         <p className="text-xs text-muted-foreground">
                                            {format(new Date(item.date), 'PPP', { locale: id })}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(item.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}


export function PersonalDashboard({
  member,
  allTransactions,
  cashierDays,
  settings,
  totalMembers,
}: {
  member: Member;
  allTransactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  totalMembers: number;
}) {

  const duesPerMeeting = settings.duesAmount || 0;

  const {
    totalPaid,
    totalDues,
    totalExpenses,
    finalBalance,
    totalBill,
    paidDuesDetails,
    unpaidDuesDetails,
    personalExpensesDetails,
    sharedExpensePerMember,
  } = useMemo(() => {
    // 1. Total Pembayaran
    const totalPaid = allTransactions
      .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Total Iuran Wajib
    const totalDues = cashierDays.length * duesPerMeeting;

    // 3. Total Beban Pengeluaran
    const personalExpenses = allTransactions
      .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const sharedExpensesTotal = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);

    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;
    const totalExpenses = personalExpenses + sharedExpensePerMember;

    // 4. Total Tagihan (dengan logika baru)
    let totalBill = 0;
    if (totalDues > totalExpenses) {
        totalBill = totalDues;
    } else {
        totalBill = totalDues + totalExpenses;
    }

    // 5. Saldo Akhir
    const finalBalance = totalPaid - totalBill;

    // --- Rincian untuk ditampilkan ---
    const memberPayments = allTransactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan');

    // Menentukan iuran mana yang sudah terbayar dan mana yang belum
    let paidDuesCount = Math.floor(totalPaid / duesPerMeeting);
    const paidDuesDetails = cashierDays
        .slice(0, paidDuesCount)
        .map(day => ({...day, type: 'paid' as const, amount: duesPerMeeting}));

    const unpaidDuesDetails = cashierDays
        .slice(paidDuesCount)
        .map(day => ({...day, type: 'unpaid' as const, amount: duesPerMeeting}));
    
    const personalExpensesDetails = allTransactions
      .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
      .map(t => ({ id: t.id, description: t.description, amount: t.amount, date: t.date, type: 'expense' as const }));

    return { totalPaid, totalDues, totalExpenses, finalBalance, totalBill, paidDuesDetails, unpaidDuesDetails, personalExpensesDetails, sharedExpensePerMember };
  }, [member.id, allTransactions, cashierDays, duesPerMeeting, totalMembers]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Laporan Kas, {member.name}</h1>
        <p className="text-muted-foreground">Berikut adalah rincian status keuangan Anda di kas kelas.</p>
      </div>
      
      {/* Kartu Ringkasan Utama */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kas Masuk (Pembayaran Anda)</CardTitle>
            <Banknote className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Total uang yang telah Anda setorkan.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <FileWarning className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBill)}</div>
            <p className="text-xs text-muted-foreground">Total iuran wajib ditambah beban pengeluaran.</p>
          </CardContent>
        </Card>
        <Card className={finalBalance >= 0 ? "border-green-500" : "border-destructive"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                {finalBalance >= 0 ? 'Sisa Saldo Anda' : 'Total Tunggakan'}
            </CardTitle>
            <Scale className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(finalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
                {finalBalance >= 0 ? 'Sisa kas setelah dikurangi semua tagihan.' : 'Kekurangan yang perlu dilunasi.'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Rincian Perhitungan */}
      <Card>
          <CardHeader>
              <CardTitle>Rincian Perhitungan</CardTitle>
              <CardDescription>Detail dari mana angka-angka di atas berasal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                {/* Rincian Tagihan */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-bold text-lg mb-2 flex items-center"><Coins className="mr-2 h-5 w-5 text-yellow-500"/> Rincian Tagihan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold">Total Iuran Wajib</p>
                            <p className="text-xl font-bold">{formatCurrency(totalDues)}</p>
                            <p className="text-xs text-muted-foreground">{cashierDays.length} pertemuan x {formatCurrency(duesPerMeeting)}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Total Beban Pengeluaran</p>
                            <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                            <p className="text-xs text-muted-foreground">Pribadi ({formatCurrency(personalExpensesDetails.reduce((a,b)=>a+b.amount, 0))}) + Bersama ({formatCurrency(sharedExpensePerMember)})</p>
                        </div>
                    </div>
                </div>

                {/* Rincian Pembayaran & Iuran */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailsList 
                        title="Iuran Wajib Sudah Dibayar"
                        amount={paidDuesDetails.length * duesPerMeeting}
                        items={paidDuesDetails}
                    />
                    <DetailsList 
                        title="Iuran Wajib Belum Dibayar"
                        amount={unpaidDuesDetails.length * duesPerMeeting}
                        items={unpaidDuesDetails}
                    />
                </div>
                 {/* Rincian Pengeluaran Pribadi */}
                <DetailsList
                    title="Rincian Beban Pengeluaran Pribadi"
                    amount={personalExpensesDetails.reduce((a, b) => a + b.amount, 0)}
                    items={personalExpensesDetails}
                />
          </CardContent>
      </Card>
    </div>
  );
}

    