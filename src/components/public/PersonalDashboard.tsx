"use client";

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DuesDetailDialog from '@/components/public/DuesDetailDialog';
import ExpenseDetailDialog from '@/components/public/ExpenseDetailDialog';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount).replace('Rp', 'Rp ');
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const [isDuesDetailOpen, setDuesDetailOpen] = useState(false);
  const [isExpenseDetailOpen, setExpenseDetailOpen] = useState(false);

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
    unpaidDues,
    totalClassIncome,
    totalClassExpenses,
    classFinalBalance,
  } = useMemo(() => {
    const totalClassIncome = allTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalClassExpenses = allTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const classFinalBalance = totalClassIncome - totalClassExpenses;

    const totalPaid = allTransactions
      .filter(t => t.memberId === member.id && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);

    const paymentTransactions = allTransactions.filter(
        (t) => t.memberId === member.id && t.type === 'Pemasukan'
    );
    
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

    const totalDuesLiability = cashierDays.reduce((sum, day) => sum + (day.duesAmount || duesPerMeeting), 0);
    
    const unpaidDuesAmount = Math.max(0, totalDuesLiability - totalPaid);

    const personalExpenses = allTransactions.filter(
      t => t.memberId === member.id && t.type === 'Pengeluaran'
    );
    const personalExpensesTotal = personalExpenses.reduce((sum, t) => sum + t.amount, 0);

    const rawSharedTransactions = allTransactions.filter(t => t.type === 'Pengeluaran' && !t.memberId);
    const sharedExpensesTotal = rawSharedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const sharedExpensePerMember = totalMembers > 0 ? sharedExpensesTotal / totalMembers : 0;

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

    const totalExpenses = Math.abs(personalExpensesTotal) + sharedExpensePerMember;

    const withdrawableBalance = Math.max(0, totalPaid - totalExpenses);

    return {
      totalPaid,
      totalExpenses,
      unpaidDuesAmount,
      withdrawableBalance,
      personalExpenses,
      sharedTransactions,
      sharedExpensePerMember,
      paidDues: paidDues.reverse(),
      unpaidDues,
      totalClassIncome,
      totalClassExpenses,
      classFinalBalance,
    };
  }, [member.id, allTransactions, cashierDays, totalMembers, duesPerMeeting]);


  return (
    <>
      <div className="flex flex-wrap justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-text-primary text-3xl font-bold leading-tight tracking-tight">Halo, {member.name}!</p>
          <p className="text-text-secondary text-base font-normal leading-normal">Berikut adalah ringkasan status keuangan pribadi Anda di dalam kelas.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-6">
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-border-color bg-card shadow-md">
          <h3 className="text-text-primary text-xl font-semibold">Class Financial Summary</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 rounded-lg p-4 border border-border-color">
              <p className="text-text-secondary text-sm font-medium leading-normal">Total Pemasukan Kelas</p>
              <p className="text-text-primary tracking-tight text-2xl font-bold leading-tight">{formatCurrency(totalClassIncome)}</p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 border border-border-color">
              <p className="text-text-secondary text-sm font-medium leading-normal">Total Pengeluaran Kelas</p>
              <p className="text-text-primary tracking-tight text-2xl font-bold leading-tight">{formatCurrency(totalClassExpenses)}</p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 border border-border-color bg-gray-50">
              <p className="text-text-secondary text-sm font-medium leading-normal">Saldo Kas Kelas</p>
              <p className="text-text-primary tracking-tight text-2xl font-bold leading-tight">{formatCurrency(classFinalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-border-color bg-card shadow-md">
          <h3 className="text-text-primary text-xl font-semibold">Personal Financial Summary</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 rounded-lg p-4 border border-border-color">
              <p className="text-text-secondary text-sm font-medium leading-normal">Total Tunggakan Iuran</p>
              <p className="text-danger tracking-tight text-2xl font-bold leading-tight">{formatCurrency(unpaidDuesAmount)}</p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 border border-border-color">
              <p className="text-text-secondary text-sm font-medium leading-normal">Total Beban Pengeluaran</p>
              <p className="text-text-primary tracking-tight text-2xl font-bold leading-tight">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 border border-border-color bg-gray-50">
              <p className="text-text-secondary text-sm font-medium leading-normal">Sisa Kas / Dapat Ditarik</p>
              <p className="text-success tracking-tight text-2xl font-bold leading-tight">{formatCurrency(withdrawableBalance)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-stretch">
        <div className="flex flex-1 gap-4 flex-wrap px-4 md:px-6 py-3 justify-start">
          <button onClick={() => setDuesDetailOpen(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-white text-text-secondary text-sm font-semibold leading-normal border border-border-color hover:bg-gray-50 hover:text-text-primary transition-colors duration-200 shadow-sm">
            <span className="truncate">Rincian Iuran Wajib</span>
          </button>
          <button onClick={() => setExpenseDetailOpen(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-white text-text-secondary text-sm font-semibold leading-normal border border-border-color hover:bg-gray-50 hover:text-text-primary transition-colors duration-200 shadow-sm">
            <span className="truncate">Rincian Beban Pengeluaran</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 md:px-6">
        <h3 className="text-text-primary text-xl font-semibold">Riwayat Transaksi Pribadi</h3>
        <div className="overflow-x-auto rounded-xl border border-border-color bg-card shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider" scope="col">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider" scope="col">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider" scope="col">Deskripsi</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider" scope="col">Jumlah</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions
                .filter(t => t.memberId === member.id)
                .map((t, index) => (
                  <TableRow key={t.id} className={index % 2 === 1 ? 'bg-gray-50/50' : ''}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(t.date)}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'Pemasukan' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                        {t.type === 'Pemasukan' ? 'Iuran' : 'Pengeluaran'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">{t.description}</TableCell>
                    <TableCell className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${t.type === 'Pemasukan' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <DuesDetailDialog
        isOpen={isDuesDetailOpen}
        onOpenChange={setDuesDetailOpen}
        paidDues={paidDues}
        unpaidDues={unpaidDues}
        duesAmount={duesPerMeeting}
      />
      <ExpenseDetailDialog
        isOpen={isExpenseDetailOpen}
        onOpenChange={setExpenseDetailOpen}
        personalExpenses={personalExpenses}
        sharedTransactions={sharedTransactions}
        sharedExpensePerMember={sharedExpensePerMember}
        totalMembers={totalMembers}
      />
    </>
  );
}
