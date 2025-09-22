
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, updateTransaction, deleteTransaction } from '@/lib/actions';
import type { Member, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Loader2, CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
}
  
function formatDate(dateValue: string | Date) {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) {
    return 'Tanggal tidak valid';
  }
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const transactionSchema = z.object({
  type: z.enum(['Pemasukan', 'Pengeluaran']),
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
  date: z.date({ required_error: 'Tanggal wajib diisi.' }),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter.'),
  memberId: z.string().optional(),
  treasurer: z.enum(['Bendahara 1', 'Bendahara 2']).optional(),
}).refine(data => {
    // Member is mandatory for "Pemasukan"
    if (data.type === 'Pemasukan') {
        return !!data.memberId;
    }
    return true;
}, {
    message: 'Anggota wajib dipilih untuk pemasukan.',
    path: ['memberId'],
});

type TransactionManagerProps = {
  initialTransactions: Transaction[];
  members: Member[];
};

export default function TransactionManager({ initialTransactions, members }: TransactionManagerProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'Pemasukan', description: '' },
  });

  const transactionType = form.watch('type');

  const handleDialogOpen = (transaction: Transaction | null) => {
    setEditingTransaction(transaction);
    if (transaction) {
      form.reset({
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date),
      });
    } else {
      form.reset({ type: 'Pemasukan', amount: 0, description: '', date: new Date(), memberId: undefined, treasurer: undefined });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    setSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, values);
        toast({ title: 'Sukses', description: 'Transaksi berhasil diperbarui.' });
      } else {
        await addTransaction(values);
        toast({ title: 'Sukses', description: 'Transaksi baru berhasil ditambahkan.' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(transactions.filter(t => t.id !== id));
    toast({ title: 'Sukses', description: 'Transaksi berhasil dihapus.' });
  };
  
  return (
     <Card>
      <CardHeader>
        <CardTitle>Manajemen Transaksi</CardTitle>
        <CardDescription>Tambah, edit, atau hapus pemasukan dan pengeluaran kas kelas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-right mb-4">
          <Button onClick={() => handleDialogOpen(null)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Transaksi
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama/Deskripsi</TableHead>
                <TableHead>Bendahara</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'Pemasukan' ? 'default' : 'destructive'} className={`${transaction.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.memberName ? (
                        transaction.memberName
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-default">
                                    {transaction.description} <Users className="h-3 w-3 text-muted-foreground"/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Pengeluaran bersama</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell>{transaction.treasurer || '-'}</TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                    {transaction.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data transaksi secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipe Transaksi</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Pemasukan" /></FormControl>
                            <FormLabel>Pemasukan</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Pengeluaran" /></FormControl>
                            <FormLabel>Pengeluaran</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {transactionType === 'Pemasukan' && (
                  <>
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Anggota</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih anggota" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Deskripsi (e.g. Iuran Minggu 1)</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="treasurer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diterima oleh Bendahara</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih bendahara" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Bendahara 1">Bendahara 1</SelectItem>
                                <SelectItem value="Bendahara 2">Bendahara 2</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {transactionType === 'Pengeluaran' && (
                  <>
                   <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nama Pengeluaran (e.g. Beli Spidol)</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dibebankan ke (Opsional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih anggota jika pengeluaran pribadi" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                           <p className="text-xs text-muted-foreground">
                              Jika tidak dipilih, akan menjadi pengeluaran bersama.
                           </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="treasurer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dibayar oleh Bendahara (Opsional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih bendahara" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Bendahara 1">Bendahara 1</SelectItem>
                                <SelectItem value="Bendahara 2">Bendahara 2</SelectItem>
                            </SelectContent>
                          </Select>
                           <p className="text-xs text-muted-foreground">
                              Pilih bendahara yang melakukan pembayaran.
                           </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}


                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="2000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Transaksi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingTransaction ? 'Simpan Perubahan' : 'Tambah'}
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
