
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { addCashierDay, deleteCashierDay } from '@/lib/actions';
import type { CashierDay } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Loader2, CalendarIcon, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToXLSX } from '@/lib/export';
import { Checkbox } from '@/components/ui/checkbox';


const cashierDaySchema = z.object({
  date: z.date({ required_error: 'Tanggal wajib diisi.' }),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
});

type CashierDayManagerProps = {
  initialCashierDays: CashierDay[];
};

export default function CashierDayManager({ initialCashierDays }: CashierDayManagerProps) {
  const { toast } = useToast();
  const [cashierDays, setCashierDays] = useState(initialCashierDays);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const form = useForm<z.infer<typeof cashierDaySchema>>({
    resolver: zodResolver(cashierDaySchema),
    defaultValues: { description: '', date: new Date() },
  });

  const onSubmit = async (values: z.infer<typeof cashierDaySchema>) => {
    setSubmitting(true);
    try {
      await addCashierDay(values.date, values.description);
      toast({ title: 'Sukses', description: 'Hari kas baru berhasil ditambahkan.' });
      setDialogOpen(false);
      form.reset({ description: '', date: new Date() });
      // Revalidation will update the list
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCashierDay(id);
      setCashierDays(cashierDays.filter(d => d.id !== id));
      toast({ title: 'Sukses', description: 'Hari kas berhasil dihapus.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleBulkDelete = async () => {
    try {
        await Promise.all(selectedDays.map(id => deleteCashierDay(id)));
        setCashierDays(cashierDays.filter(day => !selectedDays.includes(day.id)));
        toast({ title: 'Sukses', description: `${selectedDays.length} hari kas berhasil dihapus.` });
        setSelectedDays([]);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus hari kas yang dipilih.' });
    }
  };

  const toggleSelectDay = (id: string) => {
    setSelectedDays(prev => prev.includes(id) ? prev.filter(dayId => dayId !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedDays.length === cashierDays.length) {
        setSelectedDays([]);
    } else {
        setSelectedDays(cashierDays.map(d => d.id));
    }
  };


  const handleExport = () => {
    const dataToExport = cashierDays.map(day => ({
        Tanggal: format(new Date(day.date), 'PPP', { locale: id }),
        Deskripsi: day.description
    }));
    exportToXLSX(dataToExport, 'Daftar_Hari_Kas', 'Hari Kas');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Hari Kas</CardTitle>
        <CardDescription>Tambah atau hapus tanggal pengumpulan iuran kas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
           <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" /> Ekspor ke XLSX
          </Button>
          <div className="flex items-center gap-2">
             {selectedDays.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive">
                         <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedDays.length})
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Tindakan ini akan menghapus {selectedDays.length} hari kas yang dipilih secara permanen.
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
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Hari Kas
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                   <Checkbox
                        checked={selectedDays.length === cashierDays.length && cashierDays.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Pilih semua"
                    />
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashierDays.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                <TableRow key={day.id} data-state={isSelected ? "selected" : ""}>
                   <TableCell>
                         <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectDay(day.id)}
                            aria-label={`Pilih ${day.description}`}
                        />
                    </TableCell>
                  <TableCell>{format(new Date(day.date), 'PPP', { locale: id })}</TableCell>
                  <TableCell className="font-medium">{day.description}</TableCell>
                  <TableCell className="text-right">
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
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data hari kas secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(day.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Hari Kas Baru</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Tanggal</FormLabel>
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
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Batal</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tambah
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
