// Database Models for MoneyNote App

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  notes: string;
  photos: string[];
  date: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  budgetLimit: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  attachments: string[];
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly';
  startDate: Date;
  notifications: boolean;
}

export interface AppSettings {
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  budgetAlerts: boolean;
  dailySummary: boolean;
}

// Default categories
export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salary', type: 'income', color: '#16a34a', icon: 'briefcase', budgetLimit: 0 },
  { name: 'Freelance', type: 'income', color: '#059669', icon: 'laptop', budgetLimit: 0 },
  { name: 'Investment', type: 'income', color: '#0d9488', icon: 'trending-up', budgetLimit: 0 },
  { name: 'Gift', type: 'income', color: '#0891b2', icon: 'gift', budgetLimit: 0 },
  { name: 'Other', type: 'income', color: '#0284c7', icon: 'plus-circle', budgetLimit: 0 },
];

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining', type: 'expense', color: '#dc2626', icon: 'utensils', budgetLimit: 500 },
  { name: 'Transportation', type: 'expense', color: '#ea580c', icon: 'car', budgetLimit: 200 },
  { name: 'Shopping', type: 'expense', color: '#d97706', icon: 'shopping-bag', budgetLimit: 300 },
  { name: 'Entertainment', type: 'expense', color: '#ca8a04', icon: 'film', budgetLimit: 150 },
  { name: 'Bills & Utilities', type: 'expense', color: '#65a30d', icon: 'file-text', budgetLimit: 400 },
  { name: 'Healthcare', type: 'expense', color: '#16a34a', icon: 'heart', budgetLimit: 200 },
  { name: 'Education', type: 'expense', color: '#0891b2', icon: 'book', budgetLimit: 100 },
  { name: 'Travel', type: 'expense', color: '#0284c7', icon: 'map-pin', budgetLimit: 300 },
  { name: 'Other', type: 'expense', color: '#7c3aed', icon: 'more-horizontal', budgetLimit: 100 },
];
