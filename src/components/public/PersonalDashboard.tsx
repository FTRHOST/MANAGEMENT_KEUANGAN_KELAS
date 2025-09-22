
'use client';

import { useMemo, useState } from 'react';
import type { Member, Transaction, Settings, CashierDay } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, Loader2, Scale, Wallet, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DuesDetailDialog } from '@/components/public/DuesDetailDialog';

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
  totalMembers
}: PersonalDashboardProps) {
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);

  const {
    totalPaid,
    totalDues,
    arrearsAmount,
    personalBalance,
    arrearsDetails,
    paymentStatus,
    classBalance
  } = useMemo(() => {
    const duesPerMeeting = settings.duesAmount || 0;
    const totalDues = cashierDays.length * duesPerMeeting;

    const memberPayments = allTransactions.filter(
      (t) => t.type === 'Pemasukan' && t.memberId === member.id
    );
    const totalPaid = memberPayments.reduce((sum, t) => sum + t.amount, 0);
    
    // Shared expenses are those with no memberId
    const sharedExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    const totalSharedExpense = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const memberShareOfExpense = totalMembers > 0 ? totalSharedExpense / totalMembers : 0;
    
    // Personal expenses are those assigned to the member
    const personalExpenses = allTransactions.filter(t => t.type === 'Pengeluaran' && t.memberId === member.id);
    const totalPersonalExpense = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

    const personalBalance = totalPaid - totalDues - memberShareOfExpense - totalPersonalExpense;

    const paidDuesCount = Math.floor(totalPaid / duesPerMeeting);
    const arrearsCount = cashierDays.length - paidDuesCount;
    const arrearsAmount = arrearsCount > 0 ? arrearsCount * duesPerMeeting : 0;

    const arrearsDetails =
      arrearsCount > 0
        ? cashierDays
            .slice(0, arrearsCount)
            .map((day) => ({ label: day.description }))
        : [];

    const paymentStatus: {
      text: string;
      variant: 'default' | 'destructive' | 'secondary';
      className: string;
    } =
      personalBalance >= 0
        ? { text: 'Lunas', variant: 'default', className: 'bg-green-100 text-green-800' }
        : { text: `Tunggakan ${formatCurrency(Math.abs(personalBalance))}`, variant: 'destructive', className: '' };
        
    // Calculate total class balance
    const totalIncome = allTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTransactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    const classBalance = totalIncome - totalExpenses;

    return { totalPaid, totalDues, arrearsAmount, personalBalance, arrearsDetails, paymentStatus, classBalance };
  }, [member.id, allTransactions, cashierDays, settings.duesAmount, totalMembers]);
  
  const memberTransactions = allTransactions.filter(t => t.memberId === member.id && t.type === 'Pemasukan');

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={paymentStatus.variant} className={paymentStatus.className}>
                {paymentStatus.text}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Iuran Seharusnya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDues)}</div>
             <p className="text-xs text-muted-foreground">
              Dari {cashierDays.length} pertemuan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Telah Dibayar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Personal Anda</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${personalBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(personalBalance)}
            </div>
             <p className="text-xs text-muted-foreground">
              (Total Bayar - Total Iuran - Bagian Pengeluaran)
            </p>
          </CardContent>
           {personalBalance < 0 && (
             <CardFooter>
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setDetailDialogOpen(true)}>
                    Lihat rincian tunggakan
                </Button>
            </CardFooter>
           )}
        </Card>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Halo, {member.name}!</CardTitle>
              <CardDescription>
                  Berikut adalah ringkasan dan riwayat pembayaran iuran kas kelas Anda.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {memberTransactions.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Deskripsi</TableHead>
                              <TableHead>Penerima</TableHead>
                              <TableHead className="text-right">Jumlah</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {memberTransactions.map((t) => (
                              <TableRow key={t.id}>
                                  <TableCell>{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                                  <TableCell>{t.description}</TableCell>
                                  <TableCell>{t.treasurer}</TableCell>
                                  <TableCell className="text-right font-medium text-green-600">{formatCurrency(t.amount)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <Alert>
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Belum Ada Riwayat</AlertTitle>
                      <AlertDescription>
                          Anda belum pernah melakukan pembayaran iuran kas.
                      </AlertDescription>
                  </Alert>
              )}
          </CardContent>
      </Card>
      
       <DuesDetailDialog 
        isOpen={isDetailDialogOpen} 
        onOpenChange={setDetailDialogOpen}
        arrearsDetails={arrearsDetails}
        duesPerMeeting={duesPerMeeting}
      />
    </>
  );
}
