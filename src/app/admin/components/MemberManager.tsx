
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
import { Checkbox } from '@/components/ui/checkbox';

const memberSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
});

type MemberManagerProps = {
  initialMembers: Member[];
  transactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
  isReadOnly: boolean;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function MemberManager({ initialMembers, transactions, cashierDays, settings, isReadOnly }: MemberManagerProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '' },
  });

  const memberHasTransactions = (memberId: string) => {
    return transactions.some(t => t.memberId === memberId);
  }

  const handleDialogOpen = (member: Member | null) => {
    if (isReadOnly) return;
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

  const handleBulkDelete = async () => {
    const membersToDelete = selectedMembers.filter(id => !memberHasTransactions(id));
    const membersWithTransactions = selectedMembers.length - membersToDelete.length;

    if (membersToDelete.length === 0) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Semua anggota yang dipilih memiliki riwayat transaksi dan tidak dapat dihapus.' });
        return;
    }

    try {
        await Promise.all(membersToDelete.map(id => deleteMember(id)));
        setMembers(members.filter(m => !membersToDelete.includes(m.id)));
        setSelectedMembers([]);
        let description = `${membersToDelete.length} anggota berhasil dihapus.`;
        if (membersWithTransactions > 0) {
            description += ` ${membersWithTransactions} anggota tidak dapat dihapus karena memiliki transaksi.`
        }
        toast({ title: 'Sukses', description });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus anggota yang dipilih.' });
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === members.length) {
        setSelectedMembers([]);
    } else {
        setSelectedMembers(members.map(m => m.id));
    }
  };

  const memberBalances = useMemo(() => {
    const balances = new Map<string, { unpaidDues: number; withdrawableBalance: number }>();
    const totalMemberCount = members.length > 0 ? members.length : 1;
    
    const sharedExpensesTotal = transactions
      .filter((t) => t.type === 'Pengeluaran' && !t.memberId)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const sharedExpensePerMember = sharedExpensesTotal / totalMemberCount;

    members.forEach(member => {
      const totalPaid = transactions
        .filter(t => t.type === 'Pemasukan' && t.memberId === member.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalDuesLiability = cashierDays.reduce((sum, day) => sum + (day.duesAmount || settings.duesAmount || 0), 0);

      const personalExpensesTotal = transactions
        .filter(t => t.type === 'Pengeluaran' && t.memberId === member.id)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalExpenses = Math.abs(personalExpensesTotal) + sharedExpensePerMember;
      
      const unpaidDuesAmount = Math.max(0, totalDuesLiability - totalPaid);
      const withdrawableBalance = Math.max(0, totalPaid - totalExpenses);
      
      balances.set(member.id, { unpaidDues: unpaidDuesAmount, withdrawableBalance });
    });
    return balances;
  }, [members, transactions, cashierDays, settings]);

  const handleExport = () => {
    const dataToExport = members.map(member => {
        const balanceInfo = memberBalances.get(member.id);
        return {
            'Nama Anggota': member.name,
            'Total Tunggakan': formatCurrency(balanceInfo?.unpaidDues ?? 0),
            'Sisa Kas (Dapat Ditarik)': formatCurrency(balanceInfo?.withdrawableBalance ?? 0),
        };
    });
    exportToXLSX(dataToExport, 'Laporan_Anggota_Kelas', 'Anggota');
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Anggota</CardTitle>
        <CardDescription>
          Tambah, edit, atau hapus anggota. Lihat rincian tunggakan iuran dan sisa kas setiap anggota.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
           <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" /> Ekspor ke XLSX
          </Button>
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              {selectedMembers.length > 0 && (
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive">
                           <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedMembers.length})
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                          Tindakan ini akan menghapus {selectedMembers.length} anggota yang dipilih secara permanen. Anggota yang memiliki riwayat transaksi tidak akan dihapus.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete}>
                          Hapus
                          </AlertDialogAction>
                      </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              )}
              <Button onClick={() => handleDialogOpen(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Tambah Anggota
              </Button>
            </div>
          )}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead padding="checkbox" className="w-12">
                   <Checkbox
                        checked={selectedMembers.length === members.length && members.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Pilih semua"
                        disabled={isReadOnly}
                    />
                </TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Total Tunggakan</TableHead>
                <TableHead>Sisa Kas (Dapat Ditarik)</TableHead>
                {!isReadOnly && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const balanceInfo = memberBalances.get(member.id);
                const unpaidDues = balanceInfo?.unpaidDues ?? 0;
                const withdrawableBalance = balanceInfo?.withdrawableBalance ?? 0;
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <TableRow key={member.id} data-state={isSelected ? "selected" : ""}>
                    <TableCell>
                         <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectMember(member.id)}
                            aria-label={`Pilih ${member.name}`}
                            disabled={isReadOnly}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className={unpaidDues > 0 ? 'text-destructive font-semibold' : ''}>
                      {formatCurrency(unpaidDues)}
                    </TableCell>
                    <TableCell className={withdrawableBalance > 0 ? 'text-green-600 font-semibold' : ''}>
                      {formatCurrency(withdrawableBalance)}
                    </TableCell>
                    {!isReadOnly && (
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
                    )}
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
