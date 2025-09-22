"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "./Dashboard";
import TransactionManager from "./TransactionManager";
import MemberManager from "./MemberManager";
import CashierDayManager from "./CashierDayManager";
import type { Member, Transaction, CashierDay, Settings } from "@/lib/types";

type AdminTabsProps = {
  members: Member[];
  transactions: Transaction[];
  cashierDays: CashierDay[];
  settings: Settings;
};

export default function AdminTabs({ members, transactions, cashierDays, settings }: AdminTabsProps) {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="dashboard">Ringkasan</TabsTrigger>
        <TabsTrigger value="transactions">Transaksi</TabsTrigger>
        <TabsTrigger value="members">Anggota</TabsTrigger>
        <TabsTrigger value="cashier-days">Hari Kas</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <Dashboard members={members} transactions={transactions} />
      </TabsContent>
      <TabsContent value="transactions">
        <TransactionManager initialTransactions={transactions} members={members} />
      </TabsContent>
      <TabsContent value="members">
        <MemberManager initialMembers={members} transactions={transactions} cashierDays={cashierDays} settings={settings}/>
      </TabsContent>
      <TabsContent value="cashier-days">
        <CashierDayManager initialCashierDays={cashierDays} />
      </TabsContent>
    </Tabs>
  );
}
