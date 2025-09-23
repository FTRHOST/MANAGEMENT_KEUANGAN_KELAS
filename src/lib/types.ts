
export type Member = {
  id: string;
  name: string;
};

export type Transaction = {
  id: string;
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
  date: string; // Changed from Timestamp to string
  description: string;
  memberId?: string | null; // Allow null for shared expenses
  memberName?: string | null; // Allow null for shared expenses
  treasurer?: 'Bendahara 1' | 'Bendahara 2';
  batchId?: string; // To group transactions
};

export type TransactionData = Omit<Transaction, 'id' | 'date'> & {
  date: string;
};

export type Settings = {
  appName: string;
  logoUrl: string;
  duesAmount: number;
  startDate: string | null; // Can be string (ISO date) or null
  duesFrequency: 'weekly' | 'monthly';
  heroTitle: string;
  heroDescription: string;
};

export type CashierDay = {
  id: string;
  date: string;
  description: string;
  duesAmount?: number;
};
