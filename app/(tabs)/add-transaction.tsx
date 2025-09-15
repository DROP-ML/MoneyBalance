import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '@/services/database/storage';
import { Category, AppSettings } from '@/services/database/models';

export default function AddTransactionScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    ((Array.isArray(params.type) ? params.type[0] : params.type) as 'income' | 'expense') || 'expense'
  );
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    loadCategories();
  }, [transactionType]);

  // Keep transaction type in sync with route param so Quick Actions open the correct type
  useEffect(() => {
    const paramType = Array.isArray(params.type) ? params.type[0] : params.type;
    if (paramType === 'income' || paramType === 'expense') {
      setTransactionType(paramType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.type]);

  // Always refresh app settings when this screen gains focus so currency updates apply automatically
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        const s = await databaseService.getSettings();
        if (isActive) setAppSettings(s);
      })();
      return () => { isActive = false; };
    }, [])
  );

  const loadCategories = async () => {
    try {
      const allCategories = await databaseService.getCategories();
      const filteredCategories = allCategories.filter(cat => cat.type === transactionType);
      setCategories(filteredCategories);
      
      // Auto-select first category if none selected
      if (filteredCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(filteredCategories[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanedText.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleanedText);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setNotes('');
    setTags([]);
    setDate(new Date());
    if (categories.length > 0) setSelectedCategory(categories[0].id);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a category');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please enter a description');
      return;
    }

    setLoading(true);

    try {
      const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);
      
      await databaseService.saveTransaction({
        type: transactionType,
        amount: parseFloat(amount),
        category: selectedCategoryObj?.name || '',
        description: description.trim(),
        notes: notes.trim(),
        photos: [], // TODO: Implement photo capture
        date: date,
        tags: tags,
      });

      // Reset fields immediately after successful save
      resetForm();

      Alert.alert(
        'Success',
        `${transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              resetForm();
            },
          },
          {
            text: 'Go to Dashboard',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (value: string) => {
    const currency = appSettings?.currency || 'USD';
    const numValue = parseFloat(value || '0');
    if (isNaN(numValue)) return `${getCurrencySymbol(currency)}0.00`;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numValue);
    } catch {
      // Fallback if Intl lacks the currency code
      return `${getCurrencySymbol(currency)}${numValue.toFixed(2)}`;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <ThemedText type="title">Add Transaction</ThemedText>
          <ThemedView style={styles.placeholder} />
        </ThemedView>

        {/* Transaction Type Toggle */}
        <ThemedView style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionType === 'income' && styles.activeIncomeButton,
            ]}
            onPress={() => setTransactionType('income')}
          >
            <IconSymbol 
              name="arrow.up.circle.fill" 
              size={20} 
              color={transactionType === 'income' ? '#fff' : '#16a34a'} 
            />
            <ThemedText style={[
              styles.typeButtonText,
              transactionType === 'income' && styles.activeButtonText,
            ]}>
              Income
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionType === 'expense' && styles.activeExpenseButton,
            ]}
            onPress={() => setTransactionType('expense')}
          >
            <IconSymbol 
              name="arrow.down.circle.fill" 
              size={20} 
              color={transactionType === 'expense' ? '#fff' : '#dc2626'} 
            />
            <ThemedText style={[
              styles.typeButtonText,
              transactionType === 'expense' && styles.activeButtonText,
            ]}>
              Expense
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Amount Input */}
        <ThemedView style={styles.amountSection}>
          <LinearGradient
            colors={colorScheme === 'dark' 
              ? ['#1f2937', '#374151', '#4b5563'] 
              : ['#ffffff', '#f9fafb', '#f3f4f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.amountCard}
          >
            <ThemedText style={styles.sectionLabel}>Amount</ThemedText>
            <ThemedView style={styles.amountInputContainer}>
              <ThemedText style={styles.currencySymbol}>{getCurrencySymbol(appSettings?.currency)}</ThemedText>
              <TextInput
                style={[styles.amountInput, { 
                  color: Colors[colorScheme ?? 'light'].text,
                  fontSize: 32,
                  fontWeight: 'bold'
                }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="decimal-pad"
              />
            </ThemedView>
            <ThemedText style={styles.amountPreview}>
              {formatCurrency(amount)}
            </ThemedText>
          </LinearGradient>
        </ThemedView>

        {/* Category Selection */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Category</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && [
                    styles.selectedCategory,
                    { backgroundColor: category.color }
                  ],
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconSymbol 
                  name={category.icon as any} 
                  size={20} 
                  color={selectedCategory === category.id ? '#fff' : category.color} 
                />
                <ThemedText style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText,
                ]}>
                  {category.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Description */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Description</ThemedText>
          <TextInput
            style={[styles.textInput, { 
              color: Colors[colorScheme ?? 'light'].text,
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            multiline={false}
          />
        </ThemedView>

        {/* Notes */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Notes (Optional)</ThemedText>
          <TextInput
            style={[styles.textInput, styles.notesInput, { 
              color: Colors[colorScheme ?? 'light'].text,
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
            }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add additional notes..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            multiline={true}
            numberOfLines={3}
          />
        </ThemedView>

        {/* Tags */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Tags</ThemedText>
          <ThemedView style={styles.tagInputContainer}>
            <TextInput
              style={[styles.tagInput, { 
                color: Colors[colorScheme ?? 'light'].text,
                backgroundColor: Colors[colorScheme ?? 'light'].surface,
                borderColor: Colors[colorScheme ?? 'light'].border,
              }]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              onSubmitEditing={addTag}
            />
            {newTag.trim().length > 0 && (
              <TouchableOpacity style={[styles.addTagButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]} onPress={addTag}>
                <IconSymbol name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </ThemedView>
          
          {tags.length > 0 && (
            <ThemedView style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <ThemedView key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{tag}</ThemedText>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <IconSymbol name="xmark" size={12} color="#666" />
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {/* Save Button */}
        <ThemedView style={styles.saveSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: transactionType === 'income' ? '#16a34a' : '#dc2626' },
              loading && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <IconSymbol 
              name={loading ? "hourglass" : "checkmark.circle.fill"} 
              size={20} 
              color="#fff" 
            />
            <ThemedText style={styles.saveButtonText}>
              {loading ? 'Saving...' : `Save ${transactionType === 'income' ? 'Income' : 'Expense'}`}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  typeToggle: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeIncomeButton: {
    backgroundColor: '#16a34a',
  },
  activeExpenseButton: {
    backgroundColor: '#dc2626',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#fff',
  },
  amountSection: {
    alignItems: 'center',
    padding: 20,
  },
  amountCard: {
    width: '100%',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    padding:5,
    borderRadius:11
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 100,
  },
  amountPreview: {
    fontSize: 18,
    opacity: 0.6,
  },
  section: {
    margin: 20,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  selectedCategory: {
    backgroundColor: '#2563eb',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginTop: 8,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveSection: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
