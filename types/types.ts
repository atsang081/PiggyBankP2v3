export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'deposit' | 'deposit_matured';
  category: CategoryType;
  date: Date;
  depositId?: string; // Links to a specific deposit
};

export type FixedDeposit = {
  id: string;
  amount: number;
  interestRate: number; // Annual percentage
  termMonths: number; // Duration in months
  startDate: Date;
  maturityDate: Date;
  status: 'active' | 'matured' | 'withdrawn';
  totalReturn: number; // Amount + interest
};

export type CategoryType = 'Food' | 'Transport' | 'Entertainment' | 'Education' | 'Pocket Money' | 'Gift' | 'Other' | 'Deposit';

export type CategorySummary = {
  name: CategoryType;
  amount: number;
  percentage: number;
};

export type DailySpendingDataPoint = {
  day: string;
  amount: number;
};

export type MonthSummary = {
  monthlySpending: number;
  totalSpent: number;
  daysInMonth: number;
  dailyData: DailySpendingDataPoint[];
};

export type AppStyle = 'boys' | 'girls';

export type UserProfile = {
  parentName: string;
  childName: string;
  parentalPassword: string;
  notificationsEnabled: boolean;
  appStyle: AppStyle;
  interestRate: number; // Default interest rate for deposits
  termInterestRates: TermInterestRates; // Term-specific interest rates
  language: 'en' | 'zh-Hant'; // User's preferred language
};

export type TermInterestRates = {
  0.25: number;  // 1 week
  0.5: number;   // 2 weeks
  1: number;     // 1 month
  3: number;     // 3 months
};

export type AppSettings = {
  interestRate: number;
  parentPassword: string;
  currency: 'HKD';
  language: 'en';
};