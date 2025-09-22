"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ArrearsDetail = {
  label: string;
};

type DuesDetailDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  arrearsDetails: ArrearsDetail[];
  memberName: string;
};

export function DuesDetailDialog({
  isOpen,
  onOpenChange,
  arrearsDetails,
  memberName,
}: DuesDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rincian Tunggakan - {memberName}</DialogTitle>
          <DialogDescription>
            Berikut adalah rincian periode iuran yang belum lunas.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-60 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode Iuran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrearsDetails && arrearsDetails.length > 0 ? (
                arrearsDetails.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.label}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>Tidak ada tunggakan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}