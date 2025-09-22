import type { Timestamp } from 'firebase/firestore';

export type Member = {
  id: string;
  name: string;
};

export type Transaction = {
  id: string;
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
  date: Timestamp;
  description: string;
  memberId?: string;
  memberName?: string;
  treasurer?: 'Bendahara A' | 'Bendahara B';
};

export type TransactionData = Omit<Transaction, 'id' | 'date'> & {
  date: string;
};
