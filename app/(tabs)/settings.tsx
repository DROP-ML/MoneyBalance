import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '@/services/database/storage';
import { Category, AppSettings } from '@/services/database/models';

const CURRENCY_OPTIONS = ['LKR','USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];
const DATE_FORMAT_OPTIONS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

const CATEGORY_ICONS = [
  'briefcase', 'laptop', 'trending-up', 'gift', 'plus-circle',
  'utensils', 'car', 'shopping-bag', 'film', 'file-text',
  'heart', 'book', 'map-pin', 'more-horizontal', 'home',
  'phone', 'wifi', 'zap', 'droplet', 'shield'
];

const CATEGORY_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d',
  '#16a34a', '#059669', '#0d9488', '#0891b2', '#0284c7',
  '#2563eb', '#4f46e5', '#7c3aed', '#a21caf', '#be185d',
  '#e11d48', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  // Pickers
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDateFormatPicker, setShowDateFormatPicker] = useState(false);
  
  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryIcon, setNewCategoryIcon] = useState('circle.fill');
  const [newCategoryColor, setNewCategoryColor] = useState('#2563eb');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');

  const loadData = async () => {
    try {
      const [allCategories, appSettings] = await Promise.all([
        databaseService.getCategories(),
        databaseService.getSettings()
      ]);
      
      setCategories(allCategories);
      setSettings(appSettings);
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await databaseService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryType('expense');
    setNewCategoryIcon('circle.fill');
    setNewCategoryColor('#2563eb');
    setNewCategoryBudget('');
    setEditingCategory(null);
  };

  const openAddCategory = () => {
    resetCategoryForm();
    setShowAddCategory(true);
  };

  const openEditCategory = (category: Category) => {
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
    setNewCategoryIcon(category.icon);
    setNewCategoryColor(category.color);
    setNewCategoryBudget(category.budgetLimit.toString());
    setEditingCategory(category);
    setShowAddCategory(true);
  };

  const saveCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Name Required', 'Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                name: newCategoryName.trim(),
                type: newCategoryType,
                icon: newCategoryIcon,
                color: newCategoryColor,
                budgetLimit: parseFloat(newCategoryBudget) || 0,
              }
            : cat
        );
        await databaseService.saveCategories(updatedCategories);
        setCategories(updatedCategories);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        // Add new category
        const newCategory = await databaseService.addCategory({
          name: newCategoryName.trim(),
          type: newCategoryType,
          icon: newCategoryIcon,
          color: newCategoryColor,
          budgetLimit: parseFloat(newCategoryBudget) || 0,
        });
        setCategories([...categories, newCategory]);
        Alert.alert('Success', 'Category added successfully');
      }
      
      setShowAddCategory(false);
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedCategories = categories.filter(cat => cat.id !== categoryId);
              await databaseService.saveCategories(updatedCategories);
              setCategories(updatedCategories);
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  // Removed Export Data feature as requested

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your transactions, notes, and custom categories. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All your financial data will be lost forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Properly clear and reinitialize data
                      await databaseService.clearAll();
                      await databaseService.initialize();
                      await loadData();
                      Alert.alert('Success', 'All data has been cleared');
                    } catch (error) {
                      console.error('Error clearing data:', error);
                      Alert.alert('Error', 'Failed to clear data');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (!settings) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading settings...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>

        {/* App Preferences */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App Preferences</ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="dollarsign.circle" size={20} color={Colors[colorScheme ?? 'light'].text} />
              <ThemedText style={styles.settingLabel}>Currency</ThemedText>
            </ThemedView>
            <TouchableOpacity style={styles.settingValue} onPress={() => setShowCurrencyPicker(true)}>
              <ThemedText style={styles.settingValueText}>{settings.currency}</ThemedText>
              <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="calendar" size={20} color={Colors[colorScheme ?? 'light'].text} />
              <ThemedText style={styles.settingLabel}>Date Format</ThemedText>
            </ThemedView>
            <TouchableOpacity style={styles.settingValue} onPress={() => setShowDateFormatPicker(true)}>
              <ThemedText style={styles.settingValueText}>{settings.dateFormat}</ThemedText>
              <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            </TouchableOpacity>
          </ThemedView>

          {/* Theme changing removed as requested */}
        </ThemedView>

        {/* Notifications */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="bell" size={20} color={Colors[colorScheme ?? 'light'].text} />
              <ThemedText style={styles.settingLabel}>Enable Notifications</ThemedText>
            </ThemedView>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor={settings.notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="exclamationmark.triangle" size={20} color={Colors[colorScheme ?? 'light'].text} />
              <ThemedText style={styles.settingLabel}>Budget Alerts</ThemedText>
            </ThemedView>
            <Switch
              value={settings.budgetAlerts}
              onValueChange={(value) => updateSettings({ budgetAlerts: value })}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor={settings.budgetAlerts ? '#fff' : '#f4f3f4'}
              disabled={!settings.notificationsEnabled}
            />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="chart.bar" size={20} color={Colors[colorScheme ?? 'light'].text} />
              <ThemedText style={styles.settingLabel}>Daily Summary</ThemedText>
            </ThemedView>
            <Switch
              value={settings.dailySummary}
              onValueChange={(value) => updateSettings({ dailySummary: value })}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor={settings.dailySummary ? '#fff' : '#f4f3f4'}
              disabled={!settings.notificationsEnabled}
            />
          </ThemedView>
        </ThemedView>

        {/* Categories Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">Categories</ThemedText>
            <TouchableOpacity 
              onPress={openAddCategory}
              style={styles.addButton}
            >
              <IconSymbol name="plus" size={16} color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedView style={styles.categoriesList}>
            {categories.map((category) => (
              <ThemedView key={category.id} style={[styles.categoryItem, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <ThemedView style={[styles.categoryInfo, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <ThemedView style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <IconSymbol name={category.icon as any} size={16} color="#fff" />
                  </ThemedView>
                  <ThemedView style={[styles.categoryDetails, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                    <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                    <ThemedText style={styles.categoryType}>
                      {category.type} • Budget: ${category.budgetLimit}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedView style={styles.categoryActions}>
                  <TouchableOpacity 
                    onPress={() => openEditCategory(category)}
                    style={styles.editButton}
                  >
                    <IconSymbol name="pencil" size={14} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => deleteCategory(category.id)}
                    style={styles.deleteButton}
                  >
                    <IconSymbol name="trash" size={14} color="#dc2626" />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        {/* Data Management */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Data Management</ThemedText>
          
          <TouchableOpacity style={styles.actionItem} onPress={clearAllData}>
            <IconSymbol name="trash" size={20} color="#dc2626" />
            <ThemedText style={[styles.actionText, { color: '#dc2626' }]}>
              Clear All Data
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* App Info */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <ThemedView style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Version</ThemedText>
            <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Build</ThemedText>
            <ThemedText style={styles.infoValue}>2024.001</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Brand</ThemedText>
            <ThemedText style={styles.infoValue}>Sona Solutions (Black & Dark Blue)</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Credits</ThemedText>
            <ThemedText style={styles.infoValue}>Work by Isuru Sampath</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Add/Edit Category Modal */}
      <Modal
        visible={showAddCategory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddCategory(false)}>
              <ThemedText style={[styles.modalButton, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </ThemedText>
            <TouchableOpacity onPress={saveCategory}>
              <ThemedText style={[styles.modalButton, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Save
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.modalContent}>
            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Name</ThemedText>
              <TextInput
                style={[styles.textInput, { 
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                }]}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Category name..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </ThemedView>

            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Type</ThemedText>
              <ThemedView style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newCategoryType === 'income' && [styles.activeTypeButton, { backgroundColor: '#16a34a' }],
                  ]}
                  onPress={() => setNewCategoryType('income')}
                >
                  <ThemedText style={[
                    styles.typeButtonText,
                    newCategoryType === 'income' && styles.activeTypeButtonText,
                  ]}>
                    Income
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newCategoryType === 'expense' && [styles.activeTypeButton, { backgroundColor: '#dc2626' }],
                  ]}
                  onPress={() => setNewCategoryType('expense')}
                >
                  <ThemedText style={[
                    styles.typeButtonText,
                    newCategoryType === 'expense' && styles.activeTypeButtonText,
                  ]}>
                    Expense
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Icon</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                {CATEGORY_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newCategoryIcon === icon && [styles.selectedIcon, { backgroundColor: newCategoryColor }],
                    ]}
                    onPress={() => setNewCategoryIcon(icon)}
                  >
                    <IconSymbol 
                      name={icon as any} 
                      size={20} 
                      color={newCategoryIcon === icon ? '#fff' : Colors[colorScheme ?? 'light'].text} 
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>

            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Color</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                {CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </ScrollView>
            </ThemedView>

            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Monthly Budget (Optional)</ThemedText>
              <TextInput
                style={[styles.textInput, { 
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                }]}
                value={newCategoryBudget}
                onChangeText={setNewCategoryBudget}
                placeholder="0.00"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="decimal-pad"
              />
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </Modal>
      {/* Currency Picker */}
      <Modal visible={showCurrencyPicker} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
              <ThemedText style={[styles.modalButton, { color: Colors[colorScheme ?? 'light'].tint }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle">Select Currency</ThemedText>
            <ThemedView style={{ width: 60 }} />
          </ThemedView>
          <ScrollView style={styles.modalContent}>
            {CURRENCY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.actionItem}
                onPress={async () => {
                  await updateSettings({ currency: c });
                  setShowCurrencyPicker(false);
                }}
              >
                <ThemedText style={styles.settingLabel}>{c}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Date Format Picker */}
      <Modal visible={showDateFormatPicker} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDateFormatPicker(false)}>
              <ThemedText style={[styles.modalButton, { color: Colors[colorScheme ?? 'light'].tint }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle">Select Date Format</ThemedText>
            <ThemedView style={{ width: 60 }} />
          </ThemedView>
          <ScrollView style={styles.modalContent}>
            {DATE_FORMAT_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.actionItem}
                onPress={async () => {
                  await updateSettings({ dateFormat: f });
                  setShowDateFormatPicker(false);
                }}
              >
                <ThemedText style={styles.settingLabel}>{f}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Theme picker removed as requested */}
    </ThemedView>
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
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 14,
    opacity: 0.7,
  },
  categoriesList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryDetails: {
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryType: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  categoryActionButton: {
    padding: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTypeButton: {
    backgroundColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  iconScroll: {
    marginTop: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedIcon: {
    backgroundColor: '#2563eb',
  },
  colorScroll: {
    marginTop: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
