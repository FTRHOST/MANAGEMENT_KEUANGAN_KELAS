
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { ArrowDown, ArrowUp, Banknote, Landmark, Scale, Wallet } from 'lucide-react';

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
    totalPaid,
    totalDues,
    personalExpenses,
    sharedExpense,
    totalExpenses,
    finalBalance,
    paymentDetails,
    expenseDetails,
    unpaidDuesDetails
  } = useMemo(() => {
    const duesPerMeeting = settings.duesAmount || 0;
    
    // 1. Total Iuran Wajib (Kewajiban berdasarkan pertemuan)
    const totalDues = cashierDays.length * duesPerMeeting;

    // 2. Total Kas Masuk (Total yang sudah dibayar anggota)
    const memberPayments = allTransactions.filter(
      (t) => t.type === 'Pemasukan' && t.memberId === member.id
    );
    const totalPaid = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    // 3. Total Beban Pengeluaran
    const personalExpensesTx = allTransactions.filter(
      (t) => t.type === 'Pengeluaran' && t.memberId === member.id
    );
    const personalExpenses = personalExpensesTx.reduce((sum, t) => sum + t.amount, 0);
    
    const sharedExpensesTx = allTransactions.filter(
      (t) => t.type === 'Pengeluaran' && !t.memberId
    );
    const totalSharedExpenses = sharedExpensesTx.reduce((sum, t) => sum + t.amount, 0);
    const sharedExpense = totalMembers > 0 ? totalSharedExpenses / totalMembers : 0;
    
    const totalExpenses = personalExpenses + sharedExpense;
    
    // 4. Saldo Akhir
    const finalBalance = totalPaid - totalDues - totalExpenses;

    // 5. Rincian untuk tabel
    const paidDuesDescriptions = new Set(memberPayments.map(p => p.description.toLowerCase()));
    
    const unpaidDuesDetails = cashierDays
      .filter(day => !paidDuesDescriptions.has(day.description.toLowerCase()))
      .map(day => ({
        description: day.description,
        amount: duesPerMeeting,
        date: day.date,
      }));

    const expenseDetails = [
      ...personalExpensesTx.map(tx => ({ ...tx, type: 'Pribadi' })),
      ...sharedExpensesTx.map(tx => ({ ...tx, amount: sharedExpense, type: 'Bersama' }))
    ];

    return {
      totalPaid,
      totalDues,
      personalExpenses,
      sharedExpense,
      totalExpenses,
      finalBalance,
      paymentDetails: memberPayments,
      expenseDetails,
      unpaidDuesDetails
    };
  }, [member.id, allTransactions, cashierDays, settings, totalMembers]);

  const totalObligation = totalDues + totalExpenses;

  return (
    <div className="space-y-6">
       <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Halo, {member.name}!
        </h1>
        <p className="text-muted-foreground">
          Ini adalah ringkasan status keuangan kas kelas Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
              Total Kas Masuk (Tabungan)
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Total uang yang telah Anda setorkan.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Total Kewajiban
            </CardTitle>
            <Landmark className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(totalObligation)}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Iuran Wajib ({formatCurrency(totalDues)}) + Beban Pengeluaran ({formatCurrency(totalExpenses)})
            </p>
          </CardContent>
        </Card>
        
        <Card className={finalBalance >= 0 ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Akhir
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
              {formatCurrency(finalBalance)}
            </div>
             <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? 'Sisa saldo Anda.' : 'Total tunggakan Anda.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rincian Tunggakan Iuran</CardTitle>
            <CardDescription>Daftar iuran wajib yang belum Anda bayarkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidDuesDetails.length > 0 ? (
                  unpaidDuesDetails.map((due, index) => (
                    <TableRow key={index}>
                      <TableCell>{due.description}</TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {formatCurrency(due.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Tidak ada tunggakan. Semua iuran lunas!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rincian Beban Pengeluaran</CardTitle>
            <CardDescription>Daftar pengeluaran pribadi dan bagian Anda dari pengeluaran bersama.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseDetails.length > 0 ? (
                  expenseDetails.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.description}</TableCell>
                       <TableCell>
                        <Badge variant={tx.type === 'Pribadi' ? 'destructive' : 'secondary'}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Tidak ada beban pengeluaran.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran Iuran</CardTitle>
          <CardDescription>Semua iuran kas yang telah Anda bayarkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Bendahara</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentDetails.length > 0 ? (
                paymentDetails.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>{tx.treasurer || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(tx.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada riwayat pembayaran.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    