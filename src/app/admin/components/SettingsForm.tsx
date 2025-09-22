"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { useToast } from '@/hooks/use-toast';
import { updateSettings } from '@/lib/actions';
import { cn } from '@/lib/utils';
import type { Settings } from '@/lib/types';
import { useRouter } from 'next/navigation';

const settingsSchema = z.object({
  startDate: z.date().optional(),
  duesAmount: z.coerce.number().min(0, 'Jumlah iuran tidak boleh negatif.'),
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
      startDate: currentSettings.startDate ? new Date(currentSettings.startDate) : undefined,
      duesAmount: currentSettings.duesAmount || 2000,
      duesFrequency: currentSettings.duesFrequency || 'weekly',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    try {
      const settingsToSave: Settings = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
      };
      await updateSettings(settingsToSave);
      toast({
        title: 'Pengaturan Disimpan',
        description: 'Pengaturan iuran kas berhasil diperbarui.',
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
                      {field.value ? format(field.value, 'PPP') : <span>Pilih tanggal</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
            <FormItem className="space-y-3">
              <FormLabel>Frekuensi Iuran</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="weekly" /></FormControl>
                    <FormLabel>Mingguan</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="monthly" /></FormControl>
                    <FormLabel>Bulanan</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
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
