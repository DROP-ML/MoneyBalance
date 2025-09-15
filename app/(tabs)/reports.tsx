import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '@/services/database/storage';
import { Transaction, Category, AppSettings } from '@/services/database/models';

const { width } = Dimensions.get('window');

type PeriodType = 'week' | 'month' | 'year';

interface CategoryData {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  // Analytics data
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryData[]>([]);

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
      calculateAnalytics(allTransactions, allCategories);
    } catch (error) {
      console.error('Error loading reports data:', error);
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
    if (transactions.length > 0 && categories.length > 0) {
      calculateAnalytics(transactions, categories);
    }
  }, [period, transactions, categories]);

  const calculateAnalytics = (allTransactions: Transaction[], allCategories: Category[]) => {
    const now = new Date();
    let startDate: Date;

    // Determine date range based on period
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Filter transactions by period
    const periodTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= now;
    });

    // Calculate totals
    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalIncome(income);
    setTotalExpenses(expenses);

    // Calculate category breakdown for expenses
    const categoryBreakdown = new Map<string, number>();
    periodTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryBreakdown.get(t.category) || 0;
        categoryBreakdown.set(t.category, current + t.amount);
      });

    const categoryDataArray: CategoryData[] = Array.from(categoryBreakdown.entries())
      .map(([categoryName, amount]) => {
        const category = allCategories.find(c => c.name === categoryName);
        return {
          name: categoryName,
          amount,
          color: category?.color || '#666',
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    setCategoryData(categoryDataArray);
    setTopCategories(categoryDataArray.slice(0, 5));

    // Calculate monthly trend (last 6 months)
    const monthlyTrend: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
      });
    }

    setMonthlyData(monthlyTrend);
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

  const getPeriodButtonStyle = (periodType: PeriodType) => {
    const isActive = period === periodType;
    return [
      styles.periodButton,
      isActive && [styles.activePeriodButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }],
    ];
  };

  const renderPieChart = () => {
    if (categoryData.length === 0) return null;

    const radius = 80;
    const centerX = radius;
    const centerY = radius;
    let currentAngle = 0;

    return (
      <ThemedView style={styles.pieChartContainer}>
        <ThemedText style={styles.chartTitle}>Expense Breakdown</ThemedText>
        <ThemedView style={styles.pieChart}>
          {/* Simple pie chart representation using colored circles */}
          <ThemedView style={[styles.pieChartCircle, { width: radius * 2, height: radius * 2 }]}>
            {categoryData.slice(0, 6).map((category, index) => {
              const percentage = category.percentage;
              const angle = (percentage / 100) * 360;
              
              return (
                <ThemedView
                  key={category.name}
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: category.color,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      position: 'absolute',
                      left: centerX + Math.cos((currentAngle + angle / 2) * Math.PI / 180) * 40 - 10,
                      top: centerY + Math.sin((currentAngle + angle / 2) * Math.PI / 180) * 40 - 10,
                    }
                  ]}
                />
              );
            })}
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.legendContainer}>
          {categoryData.slice(0, 6).map((category) => (
            <ThemedView key={category.name} style={styles.legendItem}>
              <ThemedView style={[styles.legendColor, { backgroundColor: category.color }]} />
              <ThemedText style={styles.legendText}>
                {category.name} ({category.percentage.toFixed(1)}%)
              </ThemedText>
              <ThemedText style={styles.legendAmount}>
                {formatCurrency(category.amount)}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderBarChart = () => {
    if (monthlyData.length === 0) return null;

    const maxAmount = Math.max(
      ...monthlyData.map(d => Math.max(d.income, d.expenses))
    );

    return (
      <ThemedView style={styles.barChartContainer}>
        <ThemedText style={styles.chartTitle}>Monthly Trend</ThemedText>
        <ThemedView style={styles.barChart}>
          {monthlyData.map((data, index) => (
            <ThemedView key={index} style={styles.barGroup}>
              <ThemedView style={styles.bars}>
                <ThemedView
                  style={[
                    styles.bar,
                    styles.incomeBar,
                    { height: maxAmount > 0 ? (data.income / maxAmount) * 100 : 0 }
                  ]}
                />
                <ThemedView
                  style={[
                    styles.bar,
                    styles.expenseBar,
                    { height: maxAmount > 0 ? (data.expenses / maxAmount) * 100 : 0 }
                  ]}
                />
              </ThemedView>
              <ThemedText style={styles.barLabel}>{data.month}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
        
        <ThemedView style={styles.chartLegend}>
          <ThemedView style={styles.legendItem}>
            <ThemedView style={[styles.legendColor, { backgroundColor: '#16a34a' }]} />
            <ThemedText style={styles.legendText}>Income</ThemedText>
          </ThemedView>
          <ThemedView style={styles.legendItem}>
            <ThemedView style={[styles.legendColor, { backgroundColor: '#dc2626' }]} />
            <ThemedText style={styles.legendText}>Expenses</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Reports & Analytics</ThemedText>
      </ThemedView>

      {/* Period Selector */}
      <ThemedView style={styles.periodSelector}>
        <TouchableOpacity
          style={getPeriodButtonStyle('week')}
          onPress={() => setPeriod('week')}
        >
          <ThemedText style={[
            styles.periodButtonText,
            period === 'week' && styles.activePeriodButtonText,
          ]}>
            Week
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={getPeriodButtonStyle('month')}
          onPress={() => setPeriod('month')}
        >
          <ThemedText style={[
            styles.periodButtonText,
            period === 'month' && styles.activePeriodButtonText,
          ]}>
            Month
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={getPeriodButtonStyle('year')}
          onPress={() => setPeriod('year')}
        >
          <ThemedText style={[
            styles.periodButtonText,
            period === 'year' && styles.activePeriodButtonText,
          ]}>
            Year
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Summary Cards */}
      <ThemedView style={styles.summaryCards}>
        <ThemedView style={[styles.summaryCard, styles.incomeCard]}>
          <IconSymbol name="arrow.up.circle.fill" size={24} color="#16a34a" />
          <ThemedText style={styles.summaryLabel}>Total Income</ThemedText>
          <ThemedText style={[styles.summaryAmount, { color: '#16a34a' }]}>
            {formatCurrency(totalIncome)}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={[styles.summaryCard, styles.expenseCard]}>
          <IconSymbol name="arrow.down.circle.fill" size={24} color="#dc2626" />
          <ThemedText style={styles.summaryLabel}>Total Expenses</ThemedText>
          <ThemedText style={[styles.summaryAmount, { color: '#dc2626' }]}>
            {formatCurrency(totalExpenses)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={[styles.summaryCard, styles.netCard]}>
        <IconSymbol 
          name={totalIncome - totalExpenses >= 0 ? "plus.circle.fill" : "minus.circle.fill"} 
          size={24} 
          color={totalIncome - totalExpenses >= 0 ? '#16a34a' : '#dc2626'} 
        />
        <ThemedText style={styles.summaryLabel}>Net Income</ThemedText>
        <ThemedText style={[
          styles.summaryAmount,
          { color: totalIncome - totalExpenses >= 0 ? '#16a34a' : '#dc2626' }
        ]}>
          {formatCurrency(totalIncome - totalExpenses)}
        </ThemedText>
      </ThemedView>

      {/* Charts */}
      {renderPieChart()}
      {renderBarChart()}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <ThemedView style={styles.topCategoriesContainer}>
          <ThemedText style={styles.sectionTitle}>Top Spending Categories</ThemedText>
          {topCategories.map((category, index) => (
            <ThemedView key={category.name} style={styles.categoryItem}>
              <ThemedView style={styles.categoryLeft}>
                <ThemedText style={styles.categoryRank}>#{index + 1}</ThemedText>
                <ThemedView style={[styles.categoryColor, { backgroundColor: category.color }]} />
                <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.categoryRight}>
                <ThemedText style={styles.categoryAmount}>
                  {formatCurrency(category.amount)}
                </ThemedText>
                <ThemedText style={styles.categoryPercentage}>
                  {category.percentage.toFixed(1)}%
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <IconSymbol name="chart.bar" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          <ThemedText style={styles.emptyStateText}>No data to analyze</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>
            Add some transactions to see your financial reports
          </ThemedText>
        </ThemedView>
      )}
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
  periodSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: '#2563eb',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  summaryCards: {
    flexDirection: 'row',
    margin: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    gap: 8,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  netCard: {
    margin: 20,
    marginTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pieChartContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pieChart: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pieChartCircle: {
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  barChartContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  barGroup: {
    alignItems: 'center',
    gap: 8,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 12,
    minHeight: 4,
    borderRadius: 2,
  },
  incomeBar: {
    backgroundColor: '#16a34a',
  },
  expenseBar: {
    backgroundColor: '#dc2626',
  },
  barLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  topCategoriesContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryRank: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 20,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    margin: 20,
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
