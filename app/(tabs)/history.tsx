import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '@/services/database/storage';
import { Transaction, Category, AppSettings } from '@/services/database/models';

type FilterType = 'all' | 'income' | 'expense';
type SortType = 'date' | 'amount' | 'category';

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    try {
      const [allTransactions, allCategories, settings] = await Promise.all([
        databaseService.getTransactions(),
        databaseService.getCategories(),
        databaseService.getSettings(),
      ]);
      
      setTransactions(allTransactions);
      setCategories(allCategories);
      setAppSettings(settings);
    } catch (error) {
      console.error('Error loading history data:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    applyFiltersAndSort();
  }, [transactions, searchQuery, filterType, sortType]);

  const applyFiltersAndSort = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(query) ||
        transaction.notes.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query) ||
        transaction.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredTransactions(filtered);
  };

  const deleteTransaction = async (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteTransaction(transactionId);
              await loadData();
              Alert.alert('Success', 'Transaction deleted successfully');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const getCurrencySymbol = (code?: string) => {
    switch (code) {
      case 'USD': return '$';
      case 'LKR': return 'Rs.';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      case 'INR': return '₹';
      default: return '$';
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = appSettings?.currency || 'USD';
    const value = Math.abs(amount);
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    } catch {
      return `${getCurrencySymbol(currency)}${value.toFixed(2)}`;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || 'circle.fill';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || Colors[colorScheme ?? 'light'].tint;
  };

  const getFilterButtonStyle = (type: FilterType) => {
    const isActive = filterType === type;
    return [
      styles.filterButton,
      isActive && styles.activeFilterButton,
      isActive && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
    ];
  };

  const getSortButtonStyle = (type: SortType) => {
    const isActive = sortType === type;
    return [
      styles.sortButton,
      isActive && styles.activeSortButton,
      isActive && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
    ];
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Transaction History</ThemedText>
        <TouchableOpacity 
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggle}
        >
          <IconSymbol 
            name="slider.horizontal.3" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].text} 
          />
        </TouchableOpacity>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Filters */}
      {showFilters && (
        <ThemedView style={styles.filtersContainer}>
          <ThemedView style={styles.filterSection}>
            <ThemedText style={styles.filterLabel}>Type</ThemedText>
            <ThemedView style={styles.filterButtons}>
              <TouchableOpacity
                style={getFilterButtonStyle('all')}
                onPress={() => setFilterType('all')}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  filterType === 'all' && styles.activeFilterButtonText,
                ]}>
                  All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={getFilterButtonStyle('income')}
                onPress={() => setFilterType('income')}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  filterType === 'income' && styles.activeFilterButtonText,
                ]}>
                  Income
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={getFilterButtonStyle('expense')}
                onPress={() => setFilterType('expense')}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  filterType === 'expense' && styles.activeFilterButtonText,
                ]}>
                  Expenses
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.filterSection}>
            <ThemedText style={styles.filterLabel}>Sort by</ThemedText>
            <ThemedView style={styles.filterButtons}>
              <TouchableOpacity
                style={getSortButtonStyle('date')}
                onPress={() => setSortType('date')}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  sortType === 'date' && styles.activeFilterButtonText,
                ]}>
                  Date
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={getSortButtonStyle('amount')}
                onPress={() => setSortType('amount')}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  sortType === 'amount' && styles.activeFilterButtonText,
                ]}>
                  Amount
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={getSortButtonStyle('category')}
                onPress={() => setSortType('category')}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  sortType === 'category' && styles.activeFilterButtonText,
                ]}>
                  Category
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      {/* Results Summary */}
      <ThemedView style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </ThemedText>
      </ThemedView>

      {/* Transaction List */}
      <ScrollView
        style={styles.transactionsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="list.bullet" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyStateText}>
              {searchQuery ? 'No transactions found' : 'No transactions yet'}
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Add your first transaction to get started'
              }
            </ThemedText>
          </ThemedView>
        ) : (
          filteredTransactions.map((transaction) => (
            <ThemedView key={transaction.id} style={styles.transactionItem}>
              <ThemedView style={styles.transactionLeft}>
                <ThemedView style={[
                  styles.categoryIcon,
                  { backgroundColor: getCategoryColor(transaction.category) }
                ]}>
                  <IconSymbol 
                    name={getCategoryIcon(transaction.category) as any}
                    size={16} 
                    color="#fff" 
                  />
                </ThemedView>
                
                <ThemedView style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionDescription}>
                    {transaction.description}
                  </ThemedText>
                  <ThemedText style={styles.transactionCategory}>
                    {transaction.category}
                  </ThemedText>
                  <ThemedText style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </ThemedText>
                  
                  {transaction.tags.length > 0 && (
                    <ThemedView style={styles.tagsContainer}>
                      {transaction.tags.slice(0, 2).map((tag, index) => (
                        <ThemedView key={index} style={styles.tag}>
                          <ThemedText style={styles.tagText}>{tag}</ThemedText>
                        </ThemedView>
                      ))}
                      {transaction.tags.length > 2 && (
                        <ThemedText style={styles.moreTagsText}>
                          +{transaction.tags.length - 2}
                        </ThemedText>
                      )}
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.transactionRight}>
                <ThemedText style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? '#16a34a' : '#dc2626' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </ThemedText>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTransaction(transaction.id)}
                >
                  <IconSymbol name="trash" size={16} color="#dc2626" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  filterToggle: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activeSortButton: {
    backgroundColor: '#2563eb',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    opacity: 0.6,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    opacity: 0.6,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
});
