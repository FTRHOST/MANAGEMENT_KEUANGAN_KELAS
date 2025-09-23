
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addMember, updateMember, deleteMember } from '@/lib/actions';
import type { Member, Transaction, CashierDay, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Loader2, Ban, FileDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportToXLSX } from '@/lib/export';

const memberSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
});

type MemberManagerProps = {
  initialMembers: Member[];
  transactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function MemberManager({ initialMembers, transactions, cashierDays, settings }: MemberManagerProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '' },
  });

  const memberHasTransactions = (memberId: string) => {
    return transactions.some(t => t.memberId === memberId);
  }

  const handleDialogOpen = (member: Member | null) => {
    setEditingMember(member);
    form.reset({ name: member ? member.name : '' });
    setDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    setSubmitting(true);
    try {
      if (editingMember) {
        await updateMember(editingMember.id, values.name);
        setMembers(members.map(m => m.id === editingMember.id ? { ...m, name: values.name } : m));
        toast({ title: 'Sukses', description: 'Nama anggota berhasil diperbarui.' });
      } else {
        await addMember(values.name);
        // We don't get the new member list here, revalidation will handle it
        toast({ title: 'Sukses', description: 'Anggota baru berhasil ditambahkan.' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteMember(id);
    if (result?.error) {
      toast({ variant: 'destructive', title: 'Gagal Menghapus', description: result.error });
    } else {
      setMembers(members.filter(m => m.id !== id));
      toast({ title: 'Sukses', description: 'Anggota berhasil dihapus.' });
    }
  };

  const memberBalances = useMemo(() => {
    const balances = new Map<string, number>();
    const totalMemberCount = members.length > 0 ? members.length : 1;

    // Hitung total pengeluaran bersama
    const sharedExpensesTotal = transactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + t.amount, 0);
    const sharedExpensePerMember = sharedExpensesTotal / totalMemberCount;

    members.forEach(member => {
      // Total Iuran Wajib
      const duesPerMeeting = settings.duesAmount || 0;
      const totalDues = cashierDays.length * duesPerMeeting;

      // Total Pembayaran
      const totalPaid = transactions
        .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
        .reduce((sum, t) => sum + t.amount, 0);

      // Total Pengeluaran Pribadi
      const personalExpenses = transactions
        .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
        .reduce((sum, t) => sum + t.amount, 0);

      // Hitung Saldo Akhir
      const balance = totalPaid - totalDues - personalExpenses - sharedExpensePerMember;
      balances.set(member.id, balance);
    });
    return balances;
  }, [members, transactions, cashierDays, settings]);

  const handleExport = () => {
    const dataToExport = members.map(member => {
        const balance = memberBalances.get(member.id) ?? 0;
        return {
            'Nama Anggota': member.name,
            'Saldo Personal': formatCurrency(balance),
            'Status': balance < 0 ? `Tunggakan ${formatCurrency(Math.abs(balance))}` : 'Lunas / Sisa Saldo'
        };
    });
    exportToXLSX(dataToExport, 'Laporan_Anggota_Kelas', 'Anggota');
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Anggota</CardTitle>
        <CardDescription>
          Tambah, edit, atau hapus anggota. Saldo personal menunjukkan sisa uang atau tunggakan (jika negatif) dari setiap anggota.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
           <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" /> Ekspor ke XLSX
          </Button>
          <Button onClick={() => handleDialogOpen(null)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Anggota
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Saldo Personal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const balance = memberBalances.get(member.id) ?? 0;
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className={balance >= 0 ? 'text-green-600' : 'text-destructive'}>
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {memberHasTransactions(member.id) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button variant="ghost" size="icon" disabled>
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Anggota tidak bisa dihapus karena memiliki riwayat transaksi.</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus anggota secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(member.id)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingMember ? 'Edit Anggota' : 'Tambah Anggota Baru'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Anggota</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Batal</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingMember ? 'Simpan Perubahan' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
