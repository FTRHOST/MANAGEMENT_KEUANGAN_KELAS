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
  treasurer?: 'Bendahara A' | 'Bendahara B';
};

export type TransactionData = Omit<Transaction, 'id' | 'date'> & {
  date: string;
};
