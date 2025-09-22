import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "./Dashboard";
import TransactionManager from "./TransactionManager";
import MemberManager from "./MemberManager";
import type { Member, Transaction } from "@/lib/types";

type AdminTabsProps = {
  members: Member[];
  transactions: Transaction[];
};

export default function AdminTabs({ members, transactions }: AdminTabsProps) {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">Ringkasan</TabsTrigger>
        <TabsTrigger value="transactions">Transaksi</TabsTrigger>
        <TabsTrigger value="members">Anggota</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <Dashboard members={members} transactions={transactions} />
      </TabsContent>
      <TabsContent value="transactions">
        <TransactionManager initialTransactions={transactions} members={members} />
      </TabsContent>
      <TabsContent value="members">
        <MemberManager initialMembers={members} transactions={transactions}/>
      </TabsContent>
    </Tabs>
  );
}
