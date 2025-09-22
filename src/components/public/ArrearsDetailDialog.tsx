
"use client";

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import type { Settings, Transaction, Member } from '@/lib/types';
import { getWeeks, getMonths } from '@/lib/date-utils';

type ArrearsDetailDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  transactions: Transaction[];
  member: Member;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ArrearsDetailDialog({
  isOpen,
  onOpenChange,
  settings,
  transactions,
  member,
}: ArrearsDetailDialogProps) {
  const arrearsDetails = useMemo(() => {
    if (!settings.startDate || !settings.duesAmount || !settings.duesFrequency) {
      return { periods: [], totalArrears: 0 };
    }

    const memberPayments = transactions.filter(
      (t) => t.type === 'Pemasukan' && t.memberId === member.id
    );

    const periods = settings.duesFrequency === 'weekly'
      ? getWeeks(settings.startDate)
      : getMonths(settings.startDate);
    
    let totalPaid = memberPayments.reduce((sum, t) => sum + t.amount, 0);

    const detailedPeriods = periods.map(period => {
      const isPaid = totalPaid >= settings.duesAmount!;
      if (isPaid) {
        totalPaid -= settings.duesAmount!;
      }
      return {
        ...period,
        status: isPaid ? 'Lunas' : 'Belum Lunas',
        amount: settings.duesAmount!,
      };
    });

    const unpaidPeriods = detailedPeriods.filter(p => p.status === 'Belum Lunas');
    const totalArrears = unpaidPeriods.reduce((sum, p) => sum + p.amount, 0);

    return { periods: unpaidPeriods, totalArrears };
  }, [settings, transactions, member]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rincian Tunggakan Iuran</DialogTitle>
          <DialogDescription>
            Berikut adalah rincian iuran yang belum kamu bayarkan.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrearsDetails.periods.length > 0 ? (
                arrearsDetails.periods.map((period) => (
                  <TableRow key={period.label}>
                    <TableCell className="font-medium">{period.label}</TableCell>
                    <TableCell>{formatCurrency(period.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{period.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Tidak ada tunggakan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="sm:justify-between items-center">
            <div className="text-lg font-bold">
                Total Tunggakan: {formatCurrency(arrearsDetails.totalArrears)}
            </div>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
