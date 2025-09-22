
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

type DuesDetailDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  arrearsDetails: { description: string; amount: number; type: 'Dues' | 'Shared' | 'Personal' }[];
  duesAmount: number;
};

export function DuesDetailDialog({
  isOpen,
  onOpenChange,
  arrearsDetails,
  duesAmount,
}: DuesDetailDialogProps) {

  const totalArrears = arrearsDetails.reduce((sum, item) => sum + item.amount, 0);

  const getBadge = (type: 'Dues' | 'Shared' | 'Personal') => {
    switch (type) {
        case 'Dues':
            return <Badge variant="outline">Iuran Wajib</Badge>;
        case 'Shared':
            return <Badge variant="secondary">Beban Kelas</Badge>;
        case 'Personal':
            return <Badge variant="destructive">Beban Pribadi</Badge>;
        default:
            return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rincian Tagihan</DialogTitle>
          <DialogDescription>
            Berikut adalah rincian dari semua tagihan yang belum Anda selesaikan, termasuk iuran wajib, beban kelas, dan beban pribadi.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {arrearsDetails.length > 0 ? (
                    arrearsDetails.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{getBadge(item.type)}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                        {formatCurrency(item.amount)}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center">
                        Tidak ada tagihan.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
        <DialogFooter className="sm:justify-between border-t pt-4">
          <div className="text-lg font-bold">Total Tagihan</div>
          <div className="text-lg font-bold text-destructive">{formatCurrency(totalArrears)}</div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    