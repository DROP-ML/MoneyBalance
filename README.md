# MoneyNote - Complete Financial Management App 💰

MoneyNote is a comprehensive React Native financial management app that combines expense tracking, income recording, and note-taking in an intuitive, interactive interface with smart notification features.

## 🚀 Features

### Core Financial Management
- **Income & Expense Tracking**: Record all financial transactions with detailed categorization
- **Real-time Balance**: Live calculation of available funds
- **Transaction History**: Complete log with advanced filtering and search
- **Budget Planning**: Set monthly budgets with progress tracking and alerts
- **Visual Reports**: Charts and analytics for spending insights

### Interactive Note System
- **Transaction Notes**: Add detailed notes to each financial entry
- **Standalone Notes**: Create general financial notes and reminders
- **Tag System**: Organize notes with custom tags for easy retrieval
- **Rich Text Editor**: Full-featured note creation with formatting

### Smart Notifications
- **Budget Alerts**: Notifications when approaching budget limits (80% and 100%)
- **Daily Summary**: End-of-day spending summaries
- **Bill Reminders**: Scheduled alerts for recurring payments
- **Goal Tracking**: Progress updates on financial targets

### Enhanced User Experience
- **Gesture-Based Interface**: Swipe actions, pull-to-refresh, long press menus
- **Smooth Animations**: Micro-interactions and transitions
- **Dark/Light Theme**: System-aware theme switching
- **Haptic Feedback**: Tactile responses for better interaction

## 📱 Screenshots & Navigation

The app features a 6-tab navigation structure:
1. **Dashboard** - Balance overview, quick actions, recent transactions
2. **Add Transaction** - Input form with categories, notes, and tags
3. **History** - Filterable transaction list with search
4. **Notes** - Note management with rich text editor
5. **Reports** - Visual analytics and spending breakdowns
6. **Settings** - App preferences and category management

## 🛠 Technical Architecture

### Frontend (React Native + Expo)
```
├── app/(tabs)/
│   ├── index.tsx          # Dashboard screen
│   ├── add-transaction.tsx # Transaction input
│   ├── history.tsx        # Transaction history
│   ├── notes.tsx          # Notes management
│   ├── reports.tsx        # Analytics & charts
│   └── settings.tsx       # App settings
├── services/
│   ├── database/
│   │   ├── models.ts      # Data models
│   │   └── storage.ts     # AsyncStorage service
│   └── notifications/
│       └── notificationService.ts # Push notifications
├── utils/
│   └── animations.ts      # Animation utilities
└── components/            # Reusable UI components
```

### Data Models
- **Transaction**: Income/expense entries with categories, notes, tags
- **Category**: Customizable spending categories with budgets
- **Note**: Standalone or transaction-linked notes
- **Budget**: Monthly/weekly spending limits
- **Settings**: App preferences and configurations

### Key Technologies
- **React Native 0.81** with Expo SDK 54
- **TypeScript** for type safety
- **AsyncStorage** for local data persistence
- **Expo Router** for file-based navigation
- **React Native Reanimated** for smooth animations
- **Expo Notifications** for push notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone and install dependencies**
   ```bash
   cd MoneyBalance
   npm install
   ```

2. **Install additional required packages**
   ```bash
   npm install @react-native-async-storage/async-storage expo-notifications
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

### First Launch
The app will automatically initialize with:
- Default income/expense categories
- Sample data structure
- Default settings (USD currency, system theme)

## 📊 Usage Guide

### Adding Transactions
1. Tap the "Add" tab or quick action buttons on Dashboard
2. Select Income or Expense
3. Enter amount using the number pad
4. Choose from pre-defined or custom categories
5. Add description and optional notes
6. Tag transactions for better organization

### Managing Categories
1. Go to Settings → Categories
2. Add custom categories with icons and colors
3. Set monthly budget limits
4. Edit or delete existing categories

### Viewing Reports
1. Navigate to Reports tab
2. Switch between Week/Month/Year views
3. Analyze spending by category
4. Track monthly income vs expenses trends

### Setting Up Notifications
1. Go to Settings → Notifications
2. Enable budget alerts and daily summaries
3. Notifications will trigger automatically based on spending patterns

## 🔧 Customization

### Adding New Categories
The app comes with default categories, but you can easily add custom ones:
- Food & Dining, Transportation, Shopping, Entertainment
- Bills & Utilities, Healthcare, Education, Travel
- Custom categories with personalized icons and colors

### Themes & Preferences
- Currency selection (USD, EUR, GBP, etc.)
- Date format preferences
- Light/Dark/System theme modes
- Notification preferences

## 📈 Data Management

### Local Storage
- All data stored locally using AsyncStorage
- No external servers or accounts required
- Complete privacy and offline functionality

### Export/Backup
- Export functionality planned for future updates
- Data clearing option available in settings
- Automatic data initialization on first launch

## 🎯 Future Enhancements

- **Photo Attachments**: Camera integration for receipt capture
- **Cloud Sync**: Optional cloud backup and sync
- **Advanced Analytics**: More detailed financial insights
- **Recurring Transactions**: Automated transaction scheduling
- **Multi-Currency**: Support for multiple currencies
- **Data Export**: CSV/PDF report generation

## 🤝 Contributing

This is a complete financial management solution built with modern React Native practices. The codebase is well-structured and documented for easy maintenance and feature additions.

## 📄 License

This project is built as a comprehensive example of a modern React Native financial app with TypeScript, featuring best practices in:
- State management
- Local data persistence
- Navigation patterns
- UI/UX design
- Notification handling
- Animation implementation

---

**MoneyNote** - Your complete financial companion 📱💰
