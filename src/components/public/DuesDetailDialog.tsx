import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CashierDay } from '@/lib/types';
import { CheckCircle2, XCircle } from 'lucide-react';

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
  paidDues: CashierDay[];
  unpaidDues: CashierDay[];
  duesAmount: number;
};

export default function DuesDetailDialog({ isOpen, onOpenChange, paidDues, unpaidDues, duesAmount }: DuesDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rincian Iuran Wajib</DialogTitle>
          <DialogDescription>
            Status pembayaran iuran rutin Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {unpaidDues.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Iuran Belum Dibayar ({formatCurrency(unpaidDues.length * duesAmount)})</h4>
              <ul className="space-y-2">
                {unpaidDues.map(day => (
                  <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-red-50 dark:bg-destructive/10">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span>{day.description}</span>
                    </div>
                    <span className="text-sm font-medium text-destructive">({formatCurrency(day.duesAmount || duesAmount)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {paidDues.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Iuran Lunas</h4>
              <ul className="space-y-2">
                {paidDues.map(day => (
                  <li key={day.id} className="flex justify-between items-center p-2 rounded-md bg-green-50 dark:bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{day.description}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({formatCurrency(day.duesAmount || duesAmount)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
