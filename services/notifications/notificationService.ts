// Notification Service for MoneyNote App
import * as Notifications from 'expo-notifications';
import { databaseService } from '../database/storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule budget alert notification
  async scheduleBudgetAlert(categoryName: string, currentSpent: number, budgetLimit: number): Promise<void> {
    try {
      const settings = await databaseService.getSettings();
      if (!settings?.notificationsEnabled || !settings?.budgetAlerts) {
        return;
      }

      const percentage = (currentSpent / budgetLimit) * 100;
      let title = '';
      let body = '';

      if (percentage >= 100) {
        title = '🚨 Budget Exceeded!';
        body = `You've exceeded your ${categoryName} budget by $${(currentSpent - budgetLimit).toFixed(2)}`;
      } else if (percentage >= 80) {
        title = '⚠️ Budget Warning';
        body = `You've used ${percentage.toFixed(0)}% of your ${categoryName} budget ($${currentSpent.toFixed(2)}/$${budgetLimit.toFixed(2)})`;
      }

      if (title && body) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { type: 'budget_alert', category: categoryName },
          },
          trigger: null, // Show immediately
        });
      }
    } catch (error) {
      console.error('Error scheduling budget alert:', error);
    }
  }

  // Schedule daily summary notification
  async scheduleDailySummary(): Promise<void> {
    try {
      const settings = await databaseService.getSettings();
      if (!settings?.notificationsEnabled || !settings?.dailySummary) {
        return;
      }

      // Cancel existing daily summary notifications
      await this.cancelNotificationsByType('daily_summary');

      // Schedule for 9 PM daily
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Daily Summary',
          body: 'Check out your spending summary for today',
          data: { type: 'daily_summary' },
        },
        trigger: {
          hour: 21,
          minute: 0,
          repeats: true,
        } as any,
      });
    } catch (error) {
      console.error('Error scheduling daily summary:', error);
    }
  }

  // Schedule bill reminder
  async scheduleBillReminder(title: string, amount: number, dueDate: Date): Promise<void> {
    try {
      const settings = await databaseService.getSettings();
      if (!settings?.notificationsEnabled) {
        return;
      }

      // Schedule 3 days before due date
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💳 Bill Reminder',
            body: `${title} ($${amount.toFixed(2)}) is due in 3 days`,
            data: { type: 'bill_reminder', title, amount, dueDate: dueDate.toISOString() },
          },
          trigger: reminderDate as any,
        });
      }
    } catch (error) {
      console.error('Error scheduling bill reminder:', error);
    }
  }

  // Schedule saving goal notification
  async scheduleSavingGoalUpdate(goalName: string, currentAmount: number, targetAmount: number): Promise<void> {
    try {
      const settings = await databaseService.getSettings();
      if (!settings?.notificationsEnabled) {
        return;
      }

      const percentage = (currentAmount / targetAmount) * 100;
      
      if (percentage >= 100) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎉 Goal Achieved!',
            body: `Congratulations! You've reached your ${goalName} goal of $${targetAmount.toFixed(2)}`,
            data: { type: 'goal_achieved', goalName, amount: targetAmount },
          },
          trigger: null,
        });
      } else if (percentage >= 75) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Almost There!',
            body: `You're ${percentage.toFixed(0)}% towards your ${goalName} goal. Keep it up!`,
            data: { type: 'goal_progress', goalName, percentage },
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error scheduling saving goal update:', error);
    }
  }

  // Cancel notifications by type
  async cancelNotificationsByType(type: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationsToCancel = scheduledNotifications
        .filter(notification => notification.content.data?.type === type)
        .map(notification => notification.identifier);
      
      for (const identifier of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Check and trigger budget alerts for recent transactions
  async checkBudgetAlerts(): Promise<void> {
    try {
      const [transactions, categories, budgets] = await Promise.all([
        databaseService.getTransactions(),
        databaseService.getCategories(),
        databaseService.getBudgets()
      ]);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Check each category with a budget
      for (const category of categories) {
        if (category.budgetLimit > 0) {
          const monthlySpent = transactions
            .filter(t => {
              const transactionDate = new Date(t.date);
              return t.type === 'expense' &&
                     t.category === category.name &&
                     transactionDate.getMonth() === currentMonth &&
                     transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

          if (monthlySpent >= category.budgetLimit * 0.8) {
            await this.scheduleBudgetAlert(category.name, monthlySpent, category.budgetLimit);
          }
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
