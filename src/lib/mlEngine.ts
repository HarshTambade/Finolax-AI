import { Transaction } from '@/types';

export interface Prediction {
  value: number;
  confidence: number; // 0-1
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Pattern {
  category: string;
  averageAmount: number;
  frequency: number; // transactions per week
  dayOfWeek?: number; // 0-6, most common day
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class MLEngine {
  /**
   * Predict income for the next period using exponential smoothing
   */
  static predictIncome(transactions: Transaction[], daysAhead: number = 7): Prediction {
    const incomeTransactions = transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (incomeTransactions.length < 3) {
      return { value: 0, confidence: 0, trend: 'stable' };
    }

    // Calculate daily income for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIncome = incomeTransactions.filter(
      t => new Date(t.date) >= thirtyDaysAgo
    );

    const totalIncome = recentIncome.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyIncome = totalIncome / 30;

    // Exponential smoothing for prediction
    const alpha = 0.3; // smoothing factor
    let smoothedValue = avgDailyIncome;

    // Calculate trend
    const firstHalfIncome = recentIncome
      .slice(0, Math.floor(recentIncome.length / 2))
      .reduce((sum, t) => sum + t.amount, 0);
    const secondHalfIncome = recentIncome
      .slice(Math.floor(recentIncome.length / 2))
      .reduce((sum, t) => sum + t.amount, 0);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfIncome > firstHalfIncome * 1.1) trend = 'increasing';
    else if (secondHalfIncome < firstHalfIncome * 0.9) trend = 'decreasing';

    // Apply trend adjustment
    const trendMultiplier = trend === 'increasing' ? 1.05 : trend === 'decreasing' ? 0.95 : 1;
    smoothedValue *= trendMultiplier;

    const predictedIncome = smoothedValue * daysAhead;
    const confidence = Math.min(recentIncome.length / 10, 1); // More data = higher confidence

    return {
      value: predictedIncome,
      confidence,
      trend
    };
  }

  /**
   * Predict expenses for a category
   */
  static predictCategoryExpense(
    transactions: Transaction[],
    category: string,
    daysAhead: number = 7
  ): Prediction {
    const categoryTransactions = transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (categoryTransactions.length < 2) {
      return { value: 0, confidence: 0, trend: 'stable' };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = categoryTransactions.filter(
      t => new Date(t.date) >= thirtyDaysAgo
    );

    const totalExpense = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyExpense = totalExpense / 30;

    // Detect trend
    const firstHalf = recentExpenses
      .slice(0, Math.floor(recentExpenses.length / 2))
      .reduce((sum, t) => sum + t.amount, 0);
    const secondHalf = recentExpenses
      .slice(Math.floor(recentExpenses.length / 2))
      .reduce((sum, t) => sum + t.amount, 0);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalf > firstHalf * 1.15) trend = 'increasing';
    else if (secondHalf < firstHalf * 0.85) trend = 'decreasing';

    const trendMultiplier = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1;
    const predictedExpense = avgDailyExpense * daysAhead * trendMultiplier;
    const confidence = Math.min(recentExpenses.length / 8, 1);

    return {
      value: predictedExpense,
      confidence,
      trend
    };
  }

  /**
   * Detect spending patterns by category
   */
  static detectPatterns(transactions: Transaction[]): Pattern[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = transactions.filter(
      t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo
    );

    const categoryData: { [key: string]: { amounts: number[]; days: number[] } } = {};

    recentExpenses.forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = { amounts: [], days: [] };
      }
      categoryData[t.category].amounts.push(t.amount);
      categoryData[t.category].days.push(new Date(t.date).getDay());
    });

    const patterns: Pattern[] = [];

    Object.entries(categoryData).forEach(([category, data]) => {
      const averageAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
      const frequency = data.amounts.length / 4; // per week

      // Find most common day
      const dayCounts: { [key: number]: number } = {};
      data.days.forEach(day => {
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const mostCommonDay = parseInt(
        Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '0'
      );

      // Detect trend in amounts
      const firstHalf = data.amounts.slice(0, Math.floor(data.amounts.length / 2));
      const secondHalf = data.amounts.slice(Math.floor(data.amounts.length / 2));
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (avgSecond > avgFirst * 1.2) trend = 'increasing';
      else if (avgSecond < avgFirst * 0.8) trend = 'decreasing';

      patterns.push({
        category,
        averageAmount,
        frequency,
        dayOfWeek: mostCommonDay,
        trend
      });
    });

    return patterns.sort((a, b) => b.averageAmount * b.frequency - a.averageAmount * a.frequency);
  }

  /**
   * Detect anomalies in spending
   */
  static detectAnomalies(transactions: Transaction[]): Transaction[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = transactions.filter(
      t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo
    );

    if (recentExpenses.length < 5) return [];

    // Calculate mean and standard deviation
    const amounts = recentExpenses.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Anomalies are transactions > 2 standard deviations from mean
    const threshold = mean + 2 * stdDev;

    return recentExpenses.filter(t => t.amount > threshold);
  }

  /**
   * Calculate optimal savings rate based on income and expenses
   */
  static calculateOptimalSavingsRate(
    monthlyIncome: number,
    fixedExpenses: number,
    variableExpenses: number
  ): number {
    const totalExpenses = fixedExpenses + variableExpenses;
    const disposableIncome = monthlyIncome - totalExpenses;

    if (disposableIncome <= 0) return 0;

    // Recommend 20-30% of disposable income for savings
    const optimalRate = Math.min(disposableIncome * 0.25, monthlyIncome * 0.3);
    return Math.max(0, optimalRate);
  }

  /**
   * Predict when user will run out of money (if applicable)
   */
  static predictCashRunout(
    currentBalance: number,
    transactions: Transaction[]
  ): { daysUntilRunout: number; confidence: number } | null {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentExpenses = transactions.filter(
      t => t.type === 'expense' && new Date(t.date) >= sevenDaysAgo
    );

    if (recentExpenses.length < 3 || currentBalance <= 0) {
      return null;
    }

    const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyExpense = totalExpenses / 7;

    if (avgDailyExpense <= 0) return null;

    const daysUntilRunout = Math.floor(currentBalance / avgDailyExpense);
    const confidence = Math.min(recentExpenses.length / 10, 0.9);

    return daysUntilRunout < 30 ? { daysUntilRunout, confidence } : null;
  }
}