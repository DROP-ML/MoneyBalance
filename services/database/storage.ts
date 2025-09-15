// Database Storage Service using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Note, Budget, AppSettings, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './models';

const STORAGE_KEYS = {
  TRANSACTIONS: '@moneyNote_transactions',
  CATEGORIES: '@moneyNote_categories',
  NOTES: '@moneyNote_notes',
  BUDGETS: '@moneyNote_budgets',
  SETTINGS: '@moneyNote_settings',
  INITIALIZED: '@moneyNote_initialized',
};

class DatabaseService {
  // Initialize database with default data
  async initialize(): Promise<void> {
    try {
      const isInitialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!isInitialized) {
        // Set up default categories
        const defaultCategories: Category[] = [
          ...DEFAULT_INCOME_CATEGORIES.map(cat => ({ ...cat, id: this.generateId() })),
          ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ ...cat, id: this.generateId() })),
        ];
        await this.saveCategories(defaultCategories);

        // Set up default settings
        const defaultSettings: AppSettings = {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          theme: 'system',
          notificationsEnabled: true,
          budgetAlerts: true,
          dailySummary: true,
        };
        await this.saveSettings(defaultSettings);
        await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  // Clear all persisted data (transactions, categories, notes, budgets, settings, initialized flag)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.NOTES,
        STORAGE_KEYS.BUDGETS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.INITIALIZED,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const transactions = await this.getTransactions();
      const newTransaction: Transaction = {
        ...transaction,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      transactions.push(newTransaction);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return newTransaction;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date() };
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async saveCategories(categories: Category[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const categories = await this.getCategories();
      const newCategory: Category = { ...category, id: this.generateId() };
      categories.push(newCategory);
      await this.saveCategories(categories);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  async saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const newNote: Note = {
        ...note,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      notes.push(newNote);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      return newNote;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    try {
      const notes = await this.getNotes();
      const index = notes.findIndex(n => n.id === id);
      
      if (index !== -1) {
        notes[index] = { ...notes[index], ...updates, updatedAt: new Date() };
        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const filtered = notes.filter(n => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting budgets:', error);
      return [];
    }
  }

  async saveBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    try {
      const budgets = await this.getBudgets();
      const newBudget: Budget = { ...budget, id: this.generateId() };
      budgets.push(newBudget);
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      return newBudget;
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  }

  // Settings
  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Analytics helpers
  async getBalance(): Promise<number> {
    try {
      const transactions = await this.getTransactions();
      return transactions.reduce((balance, transaction) => {
        return transaction.type === 'income' 
          ? balance + transaction.amount 
          : balance - transaction.amount;
      }, 0);
    } catch (error) {
      console.error('Error calculating balance:', error);
      return 0;
    }
  }

  async getMonthlySpending(month: number, year: number): Promise<number> {
    try {
      const transactions = await this.getTransactions();
      return transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && 
                 date.getMonth() === month && 
                 date.getFullYear() === year;
        })
        .reduce((total, t) => total + t.amount, 0);
    } catch (error) {
      console.error('Error calculating monthly spending:', error);
      return 0;
    }
  }

  async getCategorySpending(categoryId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const transactions = await this.getTransactions();
      return transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.category === categoryId && 
                 t.type === 'expense' &&
                 date >= startDate && 
                 date <= endDate;
        })
        .reduce((total, t) => total + t.amount, 0);
    } catch (error) {
      console.error('Error calculating category spending:', error);
      return 0;
    }
  }
}

export const databaseService = new DatabaseService();
