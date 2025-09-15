import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '@/services/database/storage';
import { Transaction, AppSettings } from '@/services/database/models';
import { fadeIn, scaleIn } from '@/utils/animations';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const loadDashboardData = async () => {
    try {
      await databaseService.initialize();
      const s = await databaseService.getSettings();
      setAppSettings(s);
      
      // Get balance
      const currentBalance = await databaseService.getBalance();
      setBalance(currentBalance);

      // Get recent transactions (last 5)
      const allTransactions = await databaseService.getTransactions();
      const recent = allTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentTransactions(recent);

      // Get monthly data
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const monthlyTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });

      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      // Start animations
      Animated.parallel([
        fadeIn(fadeAnim, 800),
        scaleIn(scaleAnim, 800)
      ]).start();
    }, [])
  );

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
    return new Date(date).toLocaleDateString();
  };

  const getBalanceColor = () => {
    if (balance > 0) return Colors[colorScheme ?? 'light'].tint;
    if (balance < 0) return '#dc2626';
    return Colors[colorScheme ?? 'light'].text;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">MoneyNote</ThemedText>
        <ThemedText style={styles.subtitle}>Your Financial Dashboard</ThemedText>
      </ThemedView>

      {/* Balance Card */}
      <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['#1f2937', '#374151', '#4b5563'] 
            : ['#ffffff', '#f9fafb', '#f3f4f6']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
          <ThemedText style={[styles.balanceAmount, { color: getBalanceColor() }]}>
            {balance >= 0 ? '+' : '-'}{formatCurrency(balance)}
          </ThemedText>
          
          <ThemedView style={styles.monthlyStats}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>This Month</ThemedText>
              <ThemedText style={[styles.statAmount, { color: Colors[colorScheme ?? 'light'].success }]}>
                +{formatCurrency(monthlyIncome)}
              </ThemedText>
              <ThemedText style={styles.statType}>Income</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>This Month</ThemedText>
              <ThemedText style={[styles.statAmount, { color: Colors[colorScheme ?? 'light'].error }]}>
                -{formatCurrency(monthlyExpenses)}
              </ThemedText>
              <ThemedText style={styles.statType}>Expenses</ThemedText>
            </ThemedView>
          </ThemedView>
        </LinearGradient>
      </Animated.View>

      {/* Quick Actions */}
      <ThemedView style={styles.quickActions}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        
        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#16a34a' }]}
            onPress={() => router.push('/add-transaction?type=income')}
          >
            <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Add Income</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#dc2626' }]}
            onPress={() => router.push('/add-transaction?type=expense')}
          >
            <IconSymbol name="minus.circle.fill" size={24} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Add Expense</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Recent Transactions */}
      <ThemedView style={styles.recentTransactions}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Transactions</ThemedText>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              View All
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {recentTransactions.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="list.bullet" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyStateText}>No transactions yet</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Add your first transaction to get started
            </ThemedText>
          </ThemedView>
        ) : (
          recentTransactions.map((transaction) => (
            <ThemedView key={transaction.id} style={[styles.transactionItem, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
              <ThemedView style={[styles.transactionLeft, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <IconSymbol 
                  name={transaction.type === 'income' ? 'arrow.up.circle.fill' : 'arrow.down.circle.fill'} 
                  size={20} 
                  color={transaction.type === 'income' ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].error} 
                />
                <ThemedView style={[styles.transactionDetails, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <ThemedText style={styles.transactionDescription}>
                    {transaction.description || transaction.category}
                  </ThemedText>
                  <ThemedText style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              
              <ThemedText style={[
                styles.transactionAmount,
                { color: transaction.type === 'income' ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].error }
              ]}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  monthlyStats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 40,
    padding: 15,
    borderRadius: 15,
    
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  statType: {
    fontSize: 12,
    opacity: 0.6,
  },
  quickActions: {
    margin: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  recentTransactions: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'transparent', 
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
