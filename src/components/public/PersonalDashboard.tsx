
"use client";

import { useMemo } from 'react';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, MinusCircle, PlusCircle, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';


function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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
    personalTransactions,
    totalPaid,
    totalDues,
    personalExpenses,
    sharedExpensePerMember,
    finalBalance
  } = useMemo(() => {
    const personalTxs = allTransactions.filter(
      (t) => t.memberId === member.id
    );

    const paid = personalTxs
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const pExpenses = personalTxs
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    const dues = (settings.duesAmount || 0) * cashierDays.length;

    const sharedExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expensePerMember = totalMembers > 0 ? sharedExpenses / totalMembers : 0;
    
    const balance = paid - dues - pExpenses - expensePerMember;

    return {
      personalTransactions: personalTxs,
      totalPaid: paid,
      totalDues: dues,
      personalExpenses: pExpenses,
      sharedExpensePerMember: expensePerMember,
      finalBalance: balance
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const paymentStatus = useMemo(() => {
    return cashierDays.map(day => {
        const payment = allTransactions.find(t =>
            t.memberId === member.id &&
            t.type === 'Pemasukan' &&
            new Date(t.date).toDateString() === new Date(day.date).toDateString()
        );
        return {
            ...day,
            paid: !!payment,
            amount: payment?.amount
        };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashierDays, allTransactions, member.id]);

  return (
    <div className="space-y-6">
       <Card className="shadow-lg">
        <CardHeader>
            <div className='flex items-center gap-4'>
                 <div className={`p-3 rounded-full ${finalBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Scale className={`h-8 w-8 ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`} />
                </div>
                <div>
                    <CardTitle className="text-3xl font-bold font-headline">{member.name}</CardTitle>
                    <CardDescription>Ringkasan Keuangan Personal Anda</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className={`p-4 rounded-lg ${finalBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-sm font-medium text-muted-foreground">Saldo Akhir</div>
                <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(finalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                    {finalBalance >= 0 ? "Sisa saldo Anda" : "Total tunggakan Anda"}
                </p>
            </div>
             <div className="p-4 rounded-lg bg-blue-50">
                <div className="text-sm font-medium text-muted-foreground">Total Iuran Wajib</div>
                <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalDues)}</div>
                <p className="text-xs text-muted-foreground">
                    {cashierDays.length} pertemuan x {formatCurrency(settings.duesAmount)}
                </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50">
                <div className="text-sm font-medium text-muted-foreground">Total Pembayaran</div>
                <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</div>
                 <p className="text-xs text-muted-foreground">
                    Total yang sudah Anda bayarkan
                </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50">
                <div className="text-sm font-medium text-muted-foreground">Beban Pengeluaran</div>
                <div className="text-2xl font-bold text-orange-700">{formatCurrency(personalExpenses + sharedExpensePerMember)}</div>
                 <p className="text-xs text-muted-foreground">
                    Pribadi {formatCurrency(personalExpenses)} + Bersama {formatCurrency(sharedExpensePerMember)}
                </p>
            </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Status Iuran</CardTitle>
                <CardDescription>Status pembayaran iuran wajib Anda per pertemuan.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentStatus.map(status => (
                            <TableRow key={status.id}>
                                <TableCell>{format(new Date(status.date), 'd MMM yyyy', {locale: id})}</TableCell>
                                <TableCell>{status.description}</TableCell>
                                <TableCell className="text-right">
                                     <Badge variant={status.paid ? 'default' : 'destructive'} className={`flex items-center justify-center gap-1 w-24 ${status.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {status.paid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                        {status.paid ? 'Lunas' : 'Belum'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Riwayat Transaksi Personal</CardTitle>
                 <CardDescription>Semua pemasukan dan pengeluaran yang tercatat atas nama Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {personalTransactions.length > 0 ? personalTransactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.date), 'd MMM yyyy', {locale: id})}</TableCell>
                                <TableCell className="flex items-center gap-2">
                                     {tx.type === 'Pemasukan' ? <PlusCircle className="h-4 w-4 text-green-500"/> : <MinusCircle className="h-4 w-4 text-red-500" />}
                                    {tx.description}
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${tx.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                                    {tx.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(tx.amount)}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    Tidak ada transaksi personal.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
