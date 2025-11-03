import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Transaction } from '@/lib/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

type ExpenseDetailDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  personalExpenses: Transaction[];
  sharedTransactions: (Transaction & { displayAmount?: number })[];
  sharedExpensePerMember: number;
  totalMembers: number;
};

export default function ExpenseDetailDialog({ isOpen, onOpenChange, personalExpenses, sharedTransactions, sharedExpensePerMember, totalMembers }: ExpenseDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rincian Beban Pengeluaran</DialogTitle>
          <DialogDescription>
            Pengeluaran pribadi dan bersama yang ditanggung.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {personalExpenses.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Pengeluaran Pribadi</h4>
              <ul className="divide-y divide-border">
                {personalExpenses.map(tx => (
                  <li key={tx.id} className="flex justify-between items-center py-2">
                    <span>{tx.description}</span>
                    <span className="font-medium">{formatCurrency(tx.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Beban Pengeluaran Bersama</h4>
              <span className="font-semibold">{formatCurrency(sharedExpensePerMember)}</span>
            </div>
            {sharedTransactions && sharedTransactions.length > 0 ? (
              <ul className="divide-y divide-border text-sm mt-1">
                {sharedTransactions.map(tx => (
                  <li key={tx.id} className="flex justify-between items-center py-2">
                    <div className="text-muted-foreground">
                      <span>{tx.description}</span>
                      {totalMembers > 0 && <span className="text-xs block opacity-80">({formatCurrency(tx.displayAmount || tx.amount)} / {totalMembers} orang)</span>}
                    </div>
                    <span className="font-medium text-muted-foreground">{totalMembers > 0 ? formatCurrency((tx.displayAmount || tx.amount) / totalMembers) : formatCurrency(0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">Tidak ada pengeluaran bersama.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
