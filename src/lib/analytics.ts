import { Transaction, Jar, Alert, UserProfile } from '@/types';

export class FinancialAnalytics {
  static calculateBalance(transactions: Transaction[]): number {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }

  static getMonthlyIncome(transactions: Transaction[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIncome = transactions.filter(
      t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo
    );
    
    return recentIncome.reduce((sum, t) => sum + t.amount, 0);
  }

  static getFixedExpenses(transactions: Transaction[]): number {
    const fixedCategories = ['rent', 'emi', 'bills', 'subscription'];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const fixedExpenses = transactions.filter(
      t => t.type === 'expense' && 
      fixedCategories.includes(t.category.toLowerCase()) &&
      new Date(t.date) >= thirtyDaysAgo
    );
    
    return fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
  }

  static calculateSafeToSpend(balance: number, jars: Jar[], daysUntilNextIncome: number = 7): number {
    const totalJarTargets = jars.reduce((sum, jar) => sum + (jar.target - jar.current), 0);
    const safeAmount = balance - totalJarTargets;
    const dailySafeSpend = safeAmount / daysUntilNextIncome;
    
    return Math.max(0, dailySafeSpend);
  }

  static detectSpendingPatterns(transactions: Transaction[]): { category: string; amount: number; percentage: number }[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentExpenses = transactions.filter(
      t => t.type === 'expense' && new Date(t.date) >= sevenDaysAgo
    );
    
    const categoryTotals: { [key: string]: number } = {};
    let totalExpenses = 0;
    
    recentExpenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      totalExpenses += t.amount;
    });
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  static generateAlerts(
    balance: number,
    transactions: Transaction[],
    jars: Jar[],
    profile: UserProfile
  ): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();
    
    // Low balance warning
    if (balance < 1000) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        type: 'warning',
        message: `Your balance is low (₹${balance.toFixed(0)}). Consider reducing non-essential spending.`,
        date: now
      });
    }
    
    // Jar target warnings
    const rentJar = jars.find(j => j.name === 'Rent');
    if (rentJar && rentJar.current < rentJar.target * 0.5) {
      const shortfall = rentJar.target - rentJar.current;
      alerts.push({
        id: `alert-${Date.now()}-2`,
        type: 'warning',
        message: `You need ₹${shortfall.toFixed(0)} more for rent. Try saving ₹${(shortfall / 7).toFixed(0)} per day.`,
        date: now
      });
    }
    
    // Spending pattern alert
    const patterns = this.detectSpendingPatterns(transactions);
    const topCategory = patterns[0];
    if (topCategory && topCategory.percentage > 40) {
      alerts.push({
        id: `alert-${Date.now()}-3`,
        type: 'info',
        message: `${topCategory.percentage.toFixed(0)}% of your recent spending is on ${topCategory.category}. Consider if this aligns with your goals.`,
        date: now
      });
    }
    
    // Positive reinforcement
    const allJarsFunded = jars.every(j => j.current >= j.target);
    if (allJarsFunded && balance > 5000) {
      alerts.push({
        id: `alert-${Date.now()}-4`,
        type: 'success',
        message: `Great job! All your jars are funded and you have ₹${balance.toFixed(0)} available.`,
        date: now
      });
    }
    
    return alerts;
  }

  static suggestJarAllocations(monthlyIncome: number, fixedExpenses: number): Jar[] {
    const rentAmount = fixedExpenses * 0.6; // Assume 60% of fixed expenses is rent
    const billsAmount = fixedExpenses * 0.4; // 40% for bills/EMIs
    const savingsAmount = monthlyIncome * 0.2; // 20% for savings
    const emergencyAmount = monthlyIncome * 0.1; // 10% for emergency
    
    return [
      { name: 'Rent', target: rentAmount, current: 0, priority: 1, color: 'bg-red-500' },
      { name: 'Bills', target: billsAmount, current: 0, priority: 2, color: 'bg-orange-500' },
      { name: 'Savings', target: savingsAmount, current: 0, priority: 3, color: 'bg-green-500' },
      { name: 'Emergency', target: emergencyAmount, current: 0, priority: 4, color: 'bg-blue-500' }
    ];
  }
}