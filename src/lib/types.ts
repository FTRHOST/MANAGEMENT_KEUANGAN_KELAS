
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
  memberId?: string;
  memberName?: string;
  treasurer?: 'Bendahara 1' | 'Bendahara 2';
};

export type TransactionData = Omit<Transaction, 'id' | 'date'> & {
  date: string;
};

export type Settings = {
  duesAmount?: number;
  startDate?: string | null; // Can be string (ISO date) or null
  duesFrequency?: 'weekly' | 'monthly';
};

export type CashierDay = {
  id: string;
  date: string;
  description: string;
};

