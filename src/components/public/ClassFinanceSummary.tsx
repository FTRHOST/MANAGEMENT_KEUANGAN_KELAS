"use client";
import { useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function ClassFinanceSummary({ transactions }: { transactions: Transaction[] }) {
    const classStats = useMemo(() => {
        const totalIncome = transactions
            .filter((t) => t.type === 'Pemasukan')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter((t) => t.type === 'Pengeluaran')
            .reduce((sum, t) => sum + t.amount, 0);

        const finalBalance = totalIncome - totalExpenses;

        return { totalIncome, totalExpenses, finalBalance };
    }, [transactions]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ringkasan Keuangan Kelas</CardTitle>
                <CardDescription>Ini adalah kondisi keuangan kelas saat ini secara keseluruhan.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pemasukan Kelas</CardTitle>
                            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(classStats.totalIncome)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pengeluaran Kelas</CardTitle>
                            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(classStats.totalExpenses)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saldo Kas Kelas</CardTitle>
                            <Scale className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(classStats.finalBalance)}</div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
