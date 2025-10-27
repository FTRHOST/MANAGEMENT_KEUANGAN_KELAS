
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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
import { PlusCircle, Edit, Trash2, Loader2, CalendarIcon, Users, FileDown, Ban, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
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
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [date, setDate] = useState<DateRange | undefined>();
  const [treasurerFilter, setTreasurerFilter] = useState('Semua');
  
  // State for combined treasurer payment
  const [paymentSource, setPaymentSource] = useState('Bendahara 1');
  const [amount1, setAmount1] = useState(0);
  const [amount2, setAmount2] = useState(0);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { 
        type: 'Pemasukan', 
        description: '', 
        applyToAll: false,
        memberId: '',
        treasurer: 'Bendahara 1',
        amount: 0,
    },
  });

  const transactionType = form.watch('type');
  const totalAmount = form.watch('amount') || 0;

  const { balanceBendahara1, balanceBendahara2 } = useMemo(() => {
    const treasurer1Income = initialTransactions
      .filter((t) => t.type === 'Pemasukan' && t.treasurer === 'Bendahara 1')
      .reduce((sum, t) => sum + t.amount, 0);
    const treasurer1Expenses = initialTransactions
      .filter((t) => t.type === 'Pengeluaran' && t.treasurer === 'Bendahara 1')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balanceBendahara1 = treasurer1Income - treasurer1Expenses;

    const treasurer2Income = initialTransactions
      .filter((t) => t.type === 'Pemasukan' && t.treasurer === 'Bendahara 2')
      .reduce((sum, t) => sum + t.amount, 0);
    const treasurer2Expenses = initialTransactions
        .filter((t) => t.type === 'Pengeluaran' && t.treasurer === 'Bendahara 2')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balanceBendahara2 = treasurer2Income - treasurer2Expenses;

    return { balanceBendahara1, balanceBendahara2 };
  }, [initialTransactions]);

  useEffect(() => {
    // Smartly pre-fill split amounts for new expense transactions
    if (transactionType === 'Pengeluaran' && !editingTransaction) {
        if (paymentSource === 'Bendahara 1') {
            setAmount1(totalAmount);
            setAmount2(0);
        } else if (paymentSource === 'Bendahara 2') {
            setAmount1(0);
            setAmount2(totalAmount);
        } else if (paymentSource === 'Manual') {
            // Auto-split suggestion: take all from B1, then remainder from B2
            const fromB1 = Math.min(totalAmount, balanceBendahara1);
            const fromB2 = totalAmount - fromB1;
            setAmount1(fromB1);
            setAmount2(fromB2);
        }
    } else {
        setAmount1(0);
        setAmount2(0);
    }
  }, [totalAmount, paymentSource, transactionType, balanceBendahara1, editingTransaction]);

  const groupedTransactions = useMemo(() => {
    const transactionMap = new Map<string, Transaction & { memberCount?: number; totalAmount?: number, subTransactions?: Transaction[] }>();

    initialTransactions.forEach(t => {
      if (t.batchId) {
        const existing = transactionMap.get(t.batchId);
        if (existing) {
          existing.memberCount = (existing.memberCount || 1) + 1;
          existing.totalAmount = (existing.totalAmount || 0) + t.amount;
          if(existing.subTransactions) existing.subTransactions.push(t);
        } else {
          transactionMap.set(t.batchId, { ...t, memberCount: 1, totalAmount: t.amount, subTransactions: [t] });
        }
      } else {
        transactionMap.set(t.id, t);
      }
    });

    return Array.from(transactionMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialTransactions]);

  const { filteredTransactions, totalIncome, totalExpenses } = useMemo(() => {
    const filtered = groupedTransactions.filter(t => {
      // Date filter
      let dateMatch = true;
      if (date?.from || date?.to) {
        const transactionDate = new Date(t.date);
        let from = date?.from;
        let to = date?.to;
        if (from) from = new Date(from.setHours(0, 0, 0, 0));
        if (to) to = new Date(to.setHours(23, 59, 59, 999));
        
        if (from && to) dateMatch = transactionDate >= from && transactionDate <= to;
        else if (from) dateMatch = transactionDate >= from;
        else if (to) dateMatch = transactionDate <= to;
      }
      
      // Treasurer filter
      let treasurerMatch = true;
      if (treasurerFilter !== 'Semua') {
          if (t.batchId && t.type === 'Pengeluaran') { // Combined Expense
              treasurerMatch = t.subTransactions?.some(st => st.treasurer === treasurerFilter) ?? false;
          } else {
              treasurerMatch = t.treasurer === treasurerFilter;
          }
      }

      return dateMatch && treasurerMatch;
    });

    const getFlattened = (arr: (Transaction & { memberCount?: number; totalAmount?: number, subTransactions?: Transaction[] })[]) => {
      const flattened: Transaction[] = [];
      arr.forEach(t => {
        if(t.subTransactions && t.subTransactions.length > 0) {
          flattened.push(...t.subTransactions);
        } else {
          flattened.push(t);
        }
      });
      return flattened;
    }

    const flatFiltered = getFlattened(filtered);

    const income = flatFiltered
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = flatFiltered
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { filteredTransactions: filtered, totalIncome: income, totalExpenses: expenses };
  }, [date, groupedTransactions, treasurerFilter]);

  const handleDialogOpen = (transaction: Transaction | null) => {
    if (isReadOnly || (transaction?.batchId && !transaction.subTransactions)) return;
    setEditingTransaction(transaction);
    if (transaction) {
      form.reset({
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date),
        applyToAll: false, 
        memberId: transaction.memberId || '',
        treasurer: transaction.treasurer || 'Bendahara 1'
      });
      setPaymentSource(transaction.treasurer || 'Bendahara 1');
    } else {
      form.reset({ 
          type: 'Pemasukan', 
          amount: 0, 
          description: '', 
          date: new Date(), 
          memberId: '', 
          treasurer: 'Bendahara 1', 
          applyToAll: false 
      });
      setPaymentSource('Bendahara 1');
    }
    setDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    setSubmitting(true);
    try {
      if (editingTransaction) {
        const updateValues = { ...values, amount: values.type === 'Pengeluaran' ? -values.amount : values.amount };
        delete updateValues.applyToAll;
        await updateTransaction(editingTransaction.id, updateValues);
        toast({ title: 'Sukses', description: 'Transaksi berhasil diperbarui.' });
      } else {
        if (values.type === 'Pengeluaran') {
            if (paymentSource === 'Manual') {
                if (amount1 + amount2 !== totalAmount) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Jumlah split tidak sesuai dengan total pengeluaran.' });
                    setSubmitting(false);
                    return;
                }
                if (amount1 > balanceBendahara1 || amount2 > balanceBendahara2) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Saldo bendahara tidak mencukupi.' });
                    setSubmitting(false);
                    return;
                }
                const batchId = uuidv4();
                const promises = [];
                if (amount1 > 0) {
                    promises.push(addTransaction({ ...values, amount: -amount1, treasurer: 'Bendahara 1', batchId }));
                }
                if (amount2 > 0) {
                    promises.push(addTransaction({ ...values, amount: -amount2, treasurer: 'Bendahara 2', batchId }));
                }
                await Promise.all(promises);
                toast({ title: 'Sukses', description: 'Transaksi pengeluaran gabungan berhasil ditambahkan.' });
            } else { // Single treasurer
                const balance = paymentSource === 'Bendahara 1' ? balanceBendahara1 : balanceBendahara2;
                if (totalAmount > balance) {
                    toast({ variant: 'destructive', title: 'Error', description: `Saldo ${paymentSource} tidak mencukupi.` });
                    setSubmitting(false);
                    return;
                }
                await addTransaction({ ...values, amount: -values.amount, treasurer: paymentSource });
                toast({ title: 'Sukses', description: 'Transaksi baru berhasil ditambahkan.' });
            }
        } else { // Pemasukan
            await addTransaction({ ...values, treasurer: values.treasurer || 'Bendahara 1' });
            toast({ title: 'Sukses', description: 'Transaksi baru berhasil ditambahkan.' });
        }
      }
      setDialogOpen(false);
    } catch (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, batchId?: string) => {
    await deleteTransaction(id, batchId);
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
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus transaksi yang dipilih.' });
    }
  };

  const toggleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
        setSelectedTransactions([]);
    } else {
        setSelectedTransactions(filteredTransactions.map(t => t.id));
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

  const handleAmount1Change = (newAmount: number) => {
    if (!isNaN(newAmount) && totalAmount >= newAmount) {
        setAmount1(newAmount);
        setAmount2(totalAmount - newAmount);
    } else if (totalAmount < newAmount) {
        setAmount1(totalAmount);
        setAmount2(0);
    } else {
        setAmount1(0);
        setAmount2(totalAmount);
    }
  }

  const handleAmount2Change = (newAmount: number) => {
    if (!isNaN(newAmount) && totalAmount >= newAmount) {
        setAmount2(newAmount);
        setAmount1(totalAmount - newAmount);
    } else if (totalAmount < newAmount) {
        setAmount2(totalAmount);
        setAmount1(0);
    } else {
        setAmount2(0);
        setAmount1(totalAmount);
    }
  }
  
  const resetFilters = () => {
    setDate(undefined);
    setTreasurerFilter('Semua');
  };

  const isManualSplitInvalid = paymentSource === 'Manual' && (amount1 + amount2 !== totalAmount || amount1 > balanceBendahara1 || amount2 > balanceBendahara2 || amount1 < 0 || amount2 < 0);
  
  const memberOptions = members.map(member => ({
    value: member.id,
    label: `${member.name} ${member.nim ? `(${member.nim})` : ''}`,
  }));


  return (
     <Card>
      <CardHeader>
        <CardTitle>Manajemen Transaksi</CardTitle>
        <CardDescription>Tambah, edit, atau hapus pemasukan dan pengeluaran kas kelas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-auto lg:min-w-[250px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y", { locale: id })} -{" "}
                          {format(date.to, "LLL dd, y", { locale: id })}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y", { locale: id })
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
               <Select value={treasurerFilter} onValueChange={setTreasurerFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter Bendahara" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua Bendahara</SelectItem>
                    <SelectItem value="Bendahara 1">Bendahara 1</SelectItem>
                    <SelectItem value="Bendahara 2">Bendahara 2</SelectItem>
                  </SelectContent>
                </Select>
                 <Button onClick={resetFilters} variant="ghost">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tampilkan Semua
                </Button>
            </div>

            <div className="flex justify-between items-center">
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
        </div>

        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                   <Checkbox
                        checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
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
              {filteredTransactions.map((transaction) => {
                const isSelected = selectedTransactions.includes(transaction.id);
                const isBulk = !!transaction.batchId;
                const isCombinedExpense = isBulk && transaction.type === 'Pengeluaran';

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
                     {isCombinedExpense ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-default">
                                    {transaction.description} <Users className="h-3 w-3 text-muted-foreground"/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Pengeluaran gabungan:</p>
                                    <ul className="list-disc pl-4">
                                        {transaction.subTransactions?.map(st => <li key={st.id}>{st.treasurer}: {formatCurrency(st.amount)}</li>)}
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : isBulk ? (
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
                  <TableCell>{isCombinedExpense ? 'Gabungan' : transaction.treasurer || '-'}</TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'Pemasukan' ? 'text-green-600' : 'text-destructive'}`}>
                    {transaction.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(Math.abs(isBulk ? transaction.totalAmount! : transaction.amount))}
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
                                  <p>Transaksi massal/gabungan tidak dapat diedit.</p>
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
                                ? `Ini akan menghapus semua transaksi terkait (${transaction.memberCount || transaction.subTransactions?.length}) dari operasi ini.`
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
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={5} className="font-bold text-right">Total Periode Ini:</TableCell>
                    <TableCell className="text-right">
                        <div className="font-semibold text-green-600">+{formatCurrency(totalIncome)}</div>
                        <div className="font-semibold text-destructive">-{formatCurrency(totalExpenses)}</div>
                    </TableCell>
                    {!isReadOnly && <TableCell></TableCell>}
                </TableRow>
            </TableFooter>
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

                {transactionType === 'Pemasukan' && !form.watch('applyToAll') && (
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Anggota</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!editingTransaction}>
                              <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Pilih anggota" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {members.map(member => (
                                      <SelectItem key={member.id} value={member.id}>
                                          {member.name} {member.nim ? `(${member.nim})` : ''}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="70000" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {transactionType === 'Pemasukan' && (
                    <FormField
                      control={form.control}
                      name="treasurer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diterima oleh Bendahara</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                )}

                {transactionType === 'Pengeluaran' && !editingTransaction && (
                    <div className="space-y-4 rounded-md border p-4">
                        <FormLabel>Sumber Dana Pengeluaran</FormLabel>
                        <RadioGroup onValueChange={setPaymentSource} defaultValue={paymentSource} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="Bendahara 1" /></FormControl>
                                <FormLabel>Bendahara 1 <span className={cn('text-xs', totalAmount > balanceBendahara1 ? 'text-destructive' : 'text-muted-foreground')}>({formatCurrency(balanceBendahara1)})</span></FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="Bendahara 2" /></FormControl>
                                <FormLabel>Bendahara 2 <span className={cn('text-xs', totalAmount > balanceBendahara2 ? 'text-destructive' : 'text-muted-foreground')}>({formatCurrency(balanceBendahara2)})</span></FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="Manual" /></FormControl>
                                <FormLabel>Kombinasi</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        {paymentSource === 'Manual' && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <FormItem>
                                    <FormLabel>Dari Bendahara 1</FormLabel>
                                    <FormControl>
                                        <Input type="number" value={amount1} onChange={e => handleAmount1Change(e.target.valueAsNumber || 0)} max={balanceBendahara1} />
                                    </FormControl>
                                    {amount1 > balanceBendahara1 && <p className="text-xs text-destructive pt-1">Saldo tidak cukup.</p>}
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Dari Bendahara 2</FormLabel>
                                    <FormControl>
                                        <Input type="number" value={amount2} onChange={e => handleAmount2Change(e.target.valueAsNumber || 0)} max={balanceBendahara2} />
                                    </FormControl>
                                    {amount2 > balanceBendahara2 && <p className="text-xs text-destructive pt-1">Saldo tidak cukup.</p>}
                                </FormItem>
                                {totalAmount > 0 && amount1 + amount2 !== totalAmount && <p className="col-span-2 text-xs text-destructive pt-1">Total split ({formatCurrency(amount1+amount2)}) tidak sama dengan jumlah pengeluaran ({formatCurrency(totalAmount)}).</p>}
                            </div>
                        )}
                    </div>
                )}

                {transactionType === 'Pengeluaran' && (
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dibebankan ke (Opsional)</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value} disabled={!!editingTransaction}>
                               <FormControl>
                                   <SelectTrigger>
                                       <SelectValue placeholder="Pilih anggota (opsional)" />
                                   </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                   <SelectItem value="">Pengeluaran Bersama</SelectItem>
                                   {members.map(member => (
                                       <SelectItem key={member.id} value={member.id}>
                                           {member.name} {member.nim ? `(${member.nim})` : ''}
                                       </SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                           <p className="text-xs text-muted-foreground">
                              Jika tidak dipilih, akan menjadi pengeluaran bersama.
                           </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}
                
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
                              {field.value ? format(field.value, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
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
                    <Button type="submit" disabled={isSubmitting || (transactionType === 'Pengeluaran' && !editingTransaction && isManualSplitInvalid)}>
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

    