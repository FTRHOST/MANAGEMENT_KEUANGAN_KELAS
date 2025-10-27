/**
 * Represents a member of the class.
 */
export type Member = {
  /** The unique identifier for the member. */
  id: string;
  /** The name of the member. */
  name: string;
  /** The student ID number of the member (optional). */
  nim?: string;
};

/**
 * Represents a financial transaction.
 */
export type Transaction = {
  /** The unique identifier for the transaction. */
  id: string;
  /** The type of the transaction. */
  type: 'Pemasukan' | 'Pengeluaran';
  /** The amount of the transaction. */
  amount: number;
  /** The date of the transaction. */
  date: string; // Changed from Timestamp to string
  /** A description of the transaction. */
  description: string;
  /** The ID of the member associated with the transaction (optional). */
  memberId?: string | null; // Allow null for shared expenses
  /** The name of the member associated with the transaction (optional). */
  memberName?: string | null; // Allow null for shared expenses
  /** The treasurer who handled the transaction (optional). */
  treasurer?: 'Bendahara 1' | 'Bendahara 2';
  /** An ID to group related transactions (optional). */
  batchId?: string; // To group transactions
};

/**
 * Represents the data needed to create a new transaction.
 */
export type TransactionData = Omit<Transaction, 'id' | 'date'> & {
  /** The date of the transaction. */
  date: string;
};

/**
 * Represents the application settings.
 */
export type Settings = {
  /** The name of the application. */
  appName: string;
  /** The URL of the application logo. */
  logoUrl: string;
  /** The amount of the dues. */
  duesAmount: number;
  /** The start date for the dues. */
  startDate: string | null; // Can be string (ISO date) or null
  /** The frequency of the dues. */
  duesFrequency: 'weekly' | 'monthly';
  /** The title of the hero section on the homepage. */
  heroTitle: string;
  /** The description of the hero section on the homepage. */
  heroDescription: string;
};

/**
 * Represents a cashier day.
 */
export type CashierDay = {
  /** The unique identifier for the cashier day. */
  id: string;
  /** The date of the cashier day. */
  date: string;
  /** A description of the cashier day. */
  description: string;
  /** The dues amount for the cashier day (optional). */
  duesAmount?: number;
};
