"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateSettings } from '@/lib/actions';
import type { Settings } from '@/lib/types';
import { useRouter } from 'next/navigation';

const settingsSchema = z.object({
  duesAmount: z.coerce.number().min(0, 'Jumlah iuran tidak boleh negatif.'),
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
      duesAmount: currentSettings.duesAmount || 2000,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    try {
      const settingsToSave: Settings = {
        ...values,
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
          name="duesAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah Iuran per Pertemuan (Rp)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="2000" {...field} />
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
