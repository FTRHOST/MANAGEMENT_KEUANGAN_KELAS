
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { updateSettings } from '@/lib/actions';
import type { Settings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const settingsSchema = z.object({
  appName: z.string().min(3, 'Nama aplikasi minimal 3 karakter.'),
  logoUrl: z.string().url('URL logo tidak valid.').or(z.literal('')),
  heroTitle: z.string().min(3, 'Judul minimal 3 karakter.'),
  heroDescription: z.string().min(10, 'Deskripsi minimal 10 karakter.'),
  duesAmount: z.coerce.number().min(0, 'Jumlah iuran tidak boleh negatif.'),
  startDate: z.date({ coerce: true }).nullable(),
  duesFrequency: z.enum(['weekly', 'monthly']),
});

type SettingsFormProps = {
  currentSettings: Settings;
};

export default function SettingsForm({ currentSettings }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: currentSettings.appName || 'Class Cashier',
      logoUrl: currentSettings.logoUrl || '',
      heroTitle: currentSettings.heroTitle || 'Bendahara Cerdas',
      heroDescription: currentSettings.heroDescription || 'Transparansi keuangan kelas di ujung jari Anda. Cari nama Anda untuk melihat status iuran.',
      duesAmount: currentSettings.duesAmount || 2000,
      startDate: currentSettings.startDate ? new Date(currentSettings.startDate.replace(/-/g, '/').replace(/T.+/, '')) : null,
      duesFrequency: currentSettings.duesFrequency || 'weekly',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    try {
      await updateSettings(values);
      toast({
        title: 'Pengaturan Disimpan',
        description: 'Pengaturan aplikasi berhasil diperbarui.',
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan pengaturan.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <FormField
          control={form.control}
          name="appName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Aplikasi</FormLabel>
              <FormControl>
                <Input placeholder="Class Cashier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Logo</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="heroTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Halaman Utama</FormLabel>
              <FormControl>
                <Input placeholder="Bendahara Cerdas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="heroDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Halaman Utama</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Transparansi keuangan kelas di ujung jari Anda..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duesAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah Iuran (Rp)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="2000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="duesFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frekuensi Iuran</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih frekuensi iuran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Mulai Kas</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pengaturan
        </Button>
      </form>
    </Form>
  );
}
