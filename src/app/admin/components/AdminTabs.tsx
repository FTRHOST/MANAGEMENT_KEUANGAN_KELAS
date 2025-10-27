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
  isReadOnly: boolean;
};

/**
 * A component that renders the tabs for the admin dashboard.
 * @param {object} props - The props for the component.
 * @param {Member[]} props.members - The list of members.
 * @param {Transaction[]} props.transactions - The list of transactions.
 * @param {CashierDay[]} props.cashierDays - The list of cashier days.
 * @param {Settings} props.settings - The application settings.
 * @param {boolean} props.isReadOnly - Whether the user is in read-only mode.
 * @returns {JSX.Element} The admin tabs component.
 */
export default function AdminTabs({ members, transactions, cashierDays, settings, isReadOnly }: AdminTabsProps) {
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
        <TransactionManager initialTransactions={transactions} members={members} isReadOnly={isReadOnly} />
      </TabsContent>
      <TabsContent value="members">
        <MemberManager initialMembers={members} transactions={transactions} cashierDays={cashierDays} settings={settings} isReadOnly={isReadOnly}/>
      </TabsContent>
      <TabsContent value="cashier-days">
        <CashierDayManager initialCashierDays={cashierDays} isReadOnly={isReadOnly} />
      </TabsContent>
    </Tabs>
  );
}
