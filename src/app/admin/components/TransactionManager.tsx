
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
import { PlusCircle, Edit, Trash2, Loader2, CalendarIcon, Users, FileDown, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportToXLSX } from '@/lib/export';
import { Checkbox } from '@/components/ui/checkbox';


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
  applyToAll: z.boolean().optional(),
}).refine(data => {
    // Member is mandatory for "Pemasukan" unless applyToAll is true
    if (data.type === 'Pemasukan' && !data.applyToAll) {
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
  isReadOnly: boolean;
};

export default function TransactionManager({ initialTransactions, members, isReadOnly }: TransactionManagerProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'Pemasukan', description: '', applyToAll: false },
  });

  const transactionType = form.watch('type');
  const applyToAll = form.watch('applyToAll');

  const groupedTransactions = useMemo(() => {
    const transactionMap = new Map<string, Transaction & { memberCount?: number; totalAmount?: number }>();

    initialTransactions.forEach(t => {
      if (t.batchId) {
        const existing = transactionMap.get(t.batchId);
        if (existing) {
          existing.memberCount = (existing.memberCount || 1) + 1;
          existing.totalAmount = (existing.totalAmount || existing.amount) + t.amount;
        } else {
          // This is the first transaction of the batch we've seen
          transactionMap.set(t.batchId, { ...t, memberCount: 1, totalAmount: t.amount });
        }
      } else {
        // Individual transaction, use its own ID as the key
        transactionMap.set(t.id, t);
      }
    });

    return Array.from(transactionMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialTransactions]);

  const handleDialogOpen = (transaction: Transaction | null) => {
    if (isReadOnly || (transaction?.batchId && !editingTransaction)) return;
    setEditingTransaction(transaction);
    if (transaction) {
      form.reset({
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date),
        applyToAll: false, // Cannot edit bulk transactions this way
      });
    } else {
      form.reset({ type: 'Pemasukan', amount: 0, description: '', date: new Date(), memberId: undefined, treasurer: undefined, applyToAll: false });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    setSubmitting(true);
    try {
      if (editingTransaction) {
        // applyToAll is disabled for editing
        const updateValues = { ...values };
        delete updateValues.applyToAll;
        await updateTransaction(editingTransaction.id, updateValues);
        toast({ title: 'Sukses', description: 'Transaksi berhasil diperbarui.' });
      } else {
        await addTransaction(values);
        toast({ title: 'Sukses', description: 'Transaksi baru berhasil ditambahkan.' });
      }
      setDialogOpen(false);
      // Revalidation will refresh the list
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, batchId?: string) => {
    await deleteTransaction(id, batchId); // Pass batchId if it exists
    if(batchId) {
        setTransactions(transactions.filter(t => t.batchId !== batchId));
    } else {
        setTransactions(transactions.filter(t => t.id !== id));
    }
    toast({ title: 'Sukses', description: 'Transaksi berhasil dihapus.' });
  };
  
  const handleBulkDelete = async () => {
    try {
        const batchIdsToDelete = new Set<string>();
        const individualIdsToDelete: string[] = [];

        selectedTransactions.forEach(id => {
            const t = groupedTransactions.find(t => t.id === id);
            if (t?.batchId) {
                batchIdsToDelete.add(t.batchId);
            } else {
                individualIdsToDelete.push(id);
            }
        });

        const deletePromises: Promise<any>[] = [];
        batchIdsToDelete.forEach(batchId => deletePromises.push(deleteTransaction("", batchId)));
        individualIdsToDelete.forEach(id => deletePromises.push(deleteTransaction(id)));
        
        await Promise.all(deletePromises);

        toast({ title: 'Sukses', description: `${selectedTransactions.length} item transaksi berhasil dihapus.` });
        setSelectedTransactions([]);
        // Revalidation will refresh the data
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus transaksi yang dipilih.' });
    }
  };

  const toggleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === groupedTransactions.length) {
        setSelectedTransactions([]);
    } else {
        setSelectedTransactions(groupedTransactions.map(t => t.id));
    }
  };

  const handleExport = () => {
    const dataToExport = initialTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => ({
        Tanggal: formatDate(t.date),
        Tipe: t.type,
        'Nama/Deskripsi': t.memberName || t.description,
        Bendahara: t.treasurer || '-',
        Jumlah: t.amount,
        'Pengeluaran Bersama': t.memberId ? 'Tidak' : 'Ya'
    }));
    exportToXLSX(dataToExport, 'Laporan_Transaksi_Kelas', 'Transaksi');
  };

  return (
     <Card>
      <CardHeader>
        <CardTitle>Manajemen Transaksi</CardTitle>
        <CardDescription>Tambah, edit, atau hapus pemasukan dan pengeluaran kas kelas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" /> Ekspor ke XLSX
          </Button>
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              {selectedTransactions.length > 0 && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive">
                           <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedTransactions.length})
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                          Tindakan ini akan menghapus {selectedTransactions.length} item transaksi yang dipilih secara permanen. Transaksi massal akan dihapus untuk semua anggota.
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
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Transaksi
              </Button>
            </div>
          )}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                   <Checkbox
                        checked={selectedTransactions.length === groupedTransactions.length && groupedTransactions.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Pilih semua"
                        disabled={isReadOnly}
                    />
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama/Deskripsi</TableHead>
                <TableHead>Bendahara</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                {!isReadOnly && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedTransactions.map((transaction) => {
                const isSelected = selectedTransactions.includes(transaction.id);
                const isBulk = !!transaction.batchId;

                return (
                <TableRow key={transaction.id} data-state={isSelected ? "selected" : ""}>
                   <TableCell>
                         <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectTransaction(transaction.id)}
                            aria-label={`Pilih transaksi ${transaction.description}`}
                            disabled={isReadOnly}
                        />
                    </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'Pemasukan' ? 'default' : 'destructive'} className={`${transaction.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {isBulk ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-default">
                                    {transaction.description} <Users className="h-3 w-3 text-muted-foreground"/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Transaksi massal untuk {transaction.memberCount} anggota</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : transaction.memberName ? (
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
                    {transaction.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(isBulk ? transaction.totalAmount! : transaction.amount)}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="text-right">
                       <TooltipProvider>
                          {isBulk ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <Button variant="ghost" size="icon" disabled>
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Transaksi massal tidak dapat diedit.</p>
                                </TooltipContent>
                              </Tooltip>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(transaction)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TooltipProvider>
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
                              {isBulk 
                                ? `Ini akan menghapus ${transaction.memberCount} transaksi terkait dari semua anggota.`
                                : "Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data transaksi secara permanen."
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(transaction.id, transaction.batchId)}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              )})}
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
                        <RadioGroup onValueChange={(value) => {
                            field.onChange(value);
                            if (value === 'Pengeluaran') form.setValue('applyToAll', false);
                        }} defaultValue={field.value} className="flex space-x-4">
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
                
                {transactionType === 'Pemasukan' && !editingTransaction && (
                   <FormField
                      control={form.control}
                      name="applyToAll"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Terapkan ke Semua Anggota (Bagi Rata)</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Jika dicentang, jumlah pemasukan akan dibagi rata untuk setiap anggota.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                )}

                {transactionType === 'Pemasukan' && !applyToAll && (
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
                  </>
                )}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {transactionType === 'Pemasukan' 
                                ? 'Deskripsi Pemasukan (e.g. Iuran Minggu 1)'
                                : 'Nama Pengeluaran (e.g. Beli Spidol)'
                                }
                            </FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {(transactionType === 'Pemasukan' || transactionType === 'Pengeluaran') && (
                    <FormField
                      control={form.control}
                      name="treasurer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {transactionType === 'Pemasukan' ? 'Diterima oleh Bendahara' : 'Dibayar oleh Bendahara (Opsional)'}
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih bendahara" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Bendahara 1">Bendahara 1</SelectItem>
                                <SelectItem value="Bendahara 2">Bendahara 2</SelectItem>
                            </SelectContent>
                          </Select>
                           <p className="text-xs text-muted-foreground">
                              Pilih bendahara yang mengelola transaksi ini.
                           </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}

                {transactionType === 'Pengeluaran' && (
                  <>
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
                  </>
                )}


                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="70000" {...field} />
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
