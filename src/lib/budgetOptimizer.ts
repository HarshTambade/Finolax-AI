import { Transaction, Jar } from '@/types';
import { FinancialAnalytics } from './analytics';
import { MLEngine } from './mlEngine';

export interface OptimizationSuggestion {
  type: 'jar_allocation' | 'spending_reduction' | 'savings_increase' | 'emergency_fund';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // Expected monthly savings in ₹
  actionable: boolean;
}

export class BudgetOptimizer {
  /**
   * Generate comprehensive budget optimization suggestions
   */
  static generateOptimizations(
    transactions: Transaction[],
    jars: Jar[],
    monthlyIncome: number,
    fixedExpenses: number
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 1. Analyze jar allocations
    const jarSuggestions = this.optimizeJarAllocations(jars, monthlyIncome, fixedExpenses);
    suggestions.push(...jarSuggestions);

    // 2. Identify spending reduction opportunities
    const spendingSuggestions = this.identifySpendingReductions(transactions);
    suggestions.push(...spendingSuggestions);

    // 3. Emergency fund recommendations
    const emergencySuggestion = this.calculateEmergencyFund(monthlyIncome, fixedExpenses, jars);
    if (emergencySuggestion) suggestions.push(emergencySuggestion);

    // 4. Savings optimization
    const savingsSuggestion = this.optimizeSavings(transactions, monthlyIncome, fixedExpenses);
    if (savingsSuggestion) suggestions.push(savingsSuggestion);

    // Sort by priority and impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.impact - a.impact;
    });
  }

  /**
   * Optimize jar allocations based on actual spending patterns
   */
  private static optimizeJarAllocations(
    jars: Jar[],
    monthlyIncome: number,
    fixedExpenses: number
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check if jar targets are realistic
    const totalJarTargets = jars.reduce((sum, jar) => sum + jar.target, 0);
    const disposableIncome = monthlyIncome - fixedExpenses;

    if (totalJarTargets > disposableIncome * 0.8) {
      suggestions.push({
        type: 'jar_allocation',
        priority: 'high',
        title: 'Jar Targets Too Ambitious',
        description: `Your jar targets (₹${totalJarTargets.toFixed(0)}) exceed 80% of your disposable income (₹${disposableIncome.toFixed(0)}). Consider reducing targets by 20% to make them more achievable.`,
        impact: (totalJarTargets - disposableIncome * 0.6) * 0.2,
        actionable: true
      });
    }

    // Check emergency fund adequacy
    const emergencyJar = jars.find(j => j.name === 'Emergency');
    const idealEmergency = fixedExpenses * 3; // 3 months of fixed expenses
    
    if (emergencyJar && emergencyJar.target < idealEmergency) {
      suggestions.push({
        type: 'emergency_fund',
        priority: 'medium',
        title: 'Increase Emergency Fund Target',
        description: `Your emergency fund target (₹${emergencyJar.target.toFixed(0)}) should cover 3 months of fixed expenses (₹${idealEmergency.toFixed(0)}). Consider increasing it by ₹${(idealEmergency - emergencyJar.target).toFixed(0)}.`,
        impact: 0,
        actionable: true
      });
    }

    return suggestions;
  }

  /**
   * Identify categories where spending can be reduced
   */
  private static identifySpendingReductions(transactions: Transaction[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const patterns = FinancialAnalytics.detectSpendingPatterns(transactions);

    // Analyze each category
    for (const pattern of patterns) {
      // High percentage spending in discretionary categories
      if (
        pattern.percentage > 25 &&
        ['Entertainment', 'Shopping', 'Food'].includes(pattern.category)
      ) {
        const potentialSavings = pattern.amount * 0.3; // 30% reduction
        suggestions.push({
          type: 'spending_reduction',
          priority: pattern.percentage > 35 ? 'high' : 'medium',
          title: `Reduce ${pattern.category} Spending`,
          description: `You're spending ${pattern.percentage.toFixed(0)}% (₹${pattern.amount.toFixed(0)}) on ${pattern.category}. Reducing by 30% could save ₹${potentialSavings.toFixed(0)} weekly.`,
          impact: potentialSavings * 4, // Monthly impact
          actionable: true
        });
      }
    }

    // Check for frequent small transactions (death by a thousand cuts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSmallExpenses = transactions.filter(
      t => t.type === 'expense' && 
      new Date(t.date) >= sevenDaysAgo && 
      t.amount < 200
    );

    if (recentSmallExpenses.length > 15) {
      const totalSmall = recentSmallExpenses.reduce((sum, t) => sum + t.amount, 0);
      suggestions.push({
        type: 'spending_reduction',
        priority: 'medium',
        title: 'Reduce Frequent Small Purchases',
        description: `You made ${recentSmallExpenses.length} small purchases (₹${totalSmall.toFixed(0)}) this week. Reducing these by 40% could save ₹${(totalSmall * 0.4).toFixed(0)} weekly.`,
        impact: totalSmall * 0.4 * 4,
        actionable: true
      });
    }

    return suggestions;
  }

  /**
   * Calculate ideal emergency fund
   */
  private static calculateEmergencyFund(
    monthlyIncome: number,
    fixedExpenses: number,
    jars: Jar[]
  ): OptimizationSuggestion | null {
    const emergencyJar = jars.find(j => j.name === 'Emergency');
    if (!emergencyJar) return null;

    const idealAmount = fixedExpenses * 3; // 3 months
    const currentAmount = emergencyJar.current;
    const shortfall = idealAmount - currentAmount;

    if (shortfall > 1000) {
      const monthsToGoal = Math.ceil(shortfall / (monthlyIncome * 0.1));
      return {
        type: 'emergency_fund',
        priority: currentAmount < fixedExpenses ? 'high' : 'medium',
        title: 'Build Emergency Fund',
        description: `Your emergency fund has ₹${currentAmount.toFixed(0)} but should have ₹${idealAmount.toFixed(0)} (3 months of expenses). Save ₹${(shortfall / monthsToGoal).toFixed(0)}/month to reach this in ${monthsToGoal} months.`,
        impact: 0,
        actionable: true
      };
    }

    return null;
  }

  /**
   * Optimize savings strategy
   */
  private static optimizeSavings(
    transactions: Transaction[],
    monthlyIncome: number,
    fixedExpenses: number
  ): OptimizationSuggestion | null {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = transactions.filter(
      t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo
    );

    const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const disposableIncome = monthlyIncome - totalExpenses;

    if (disposableIncome > 0) {
      const optimalSavings = MLEngine.calculateOptimalSavingsRate(
        monthlyIncome,
        fixedExpenses,
        totalExpenses - fixedExpenses
      );

      if (optimalSavings > 500) {
        return {
          type: 'savings_increase',
          priority: 'medium',
          title: 'Increase Monthly Savings',
          description: `Based on your income and expenses, you can comfortably save ₹${optimalSavings.toFixed(0)}/month. This is ${((optimalSavings / monthlyIncome) * 100).toFixed(0)}% of your income.`,
          impact: optimalSavings,
          actionable: true
        };
      }
    }

    return null;
  }

  /**
   * Calculate optimal daily spending limit
   */
  static calculateDailySpendingLimit(
    balance: number,
    jars: Jar[],
    predictedIncome: number,
    predictedExpenses: number,
    daysUntilNextIncome: number = 7
  ): { dailyLimit: number; reasoning: string } {
    // Reserve money for unfunded jars
    const jarShortfall = jars.reduce((sum, jar) => sum + Math.max(0, jar.target - jar.current), 0);
    
    // Calculate available for spending
    const availableBalance = balance - jarShortfall;
    
    // Factor in predicted income and expenses
    const netPrediction = predictedIncome - predictedExpenses;
    const adjustedBalance = availableBalance + netPrediction;
    
    // Calculate daily limit with 20% buffer
    const dailyLimit = Math.max(0, (adjustedBalance * 0.8) / daysUntilNextIncome);

    let reasoning = '';
    if (dailyLimit < 200) {
      reasoning = 'Very tight budget. Focus on essentials only.';
    } else if (dailyLimit < 500) {
      reasoning = 'Moderate budget. Be mindful of discretionary spending.';
    } else if (dailyLimit < 1000) {
      reasoning = 'Comfortable budget. You have room for some treats.';
    } else {
      reasoning = 'Healthy budget. Consider increasing savings.';
    }

    return { dailyLimit, reasoning };
  }

  /**
   * Generate weekly spending plan
   */
  static generateWeeklyPlan(
    balance: number,
    jars: Jar[],
    transactions: Transaction[],
    monthlyIncome: number
  ): {
    totalBudget: number;
    categories: { [key: string]: number };
    recommendations: string[];
  } {
    const patterns = FinancialAnalytics.detectSpendingPatterns(transactions);
    const weeklyIncome = monthlyIncome / 4;
    
    // Calculate available weekly budget
    const jarShortfall = jars.reduce((sum, jar) => sum + Math.max(0, jar.target - jar.current), 0);
    const weeklyBudget = Math.max(0, (balance - jarShortfall) * 0.7 / 4);

    // Allocate budget by category based on patterns
    const categories: { [key: string]: number } = {};
    const essentialCategories = ['Food', 'Transport', 'Bills'];
    const discretionaryCategories = ['Entertainment', 'Shopping'];

    let essentialTotal = 0;
    let discretionaryTotal = 0;

    patterns.forEach(pattern => {
      if (essentialCategories.includes(pattern.category)) {
        essentialTotal += pattern.amount;
      } else if (discretionaryCategories.includes(pattern.category)) {
        discretionaryTotal += pattern.amount;
      }
    });

    // Allocate 70% to essentials, 30% to discretionary
    const essentialBudget = weeklyBudget * 0.7;
    const discretionaryBudget = weeklyBudget * 0.3;

    essentialCategories.forEach(cat => {
      const pattern = patterns.find(p => p.category === cat);
      if (pattern) {
        categories[cat] = (pattern.amount / essentialTotal) * essentialBudget;
      }
    });

    discretionaryCategories.forEach(cat => {
      const pattern = patterns.find(p => p.category === cat);
      if (pattern) {
        categories[cat] = (pattern.amount / discretionaryTotal) * discretionaryBudget;
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (weeklyBudget < weeklyIncome * 0.3) {
      recommendations.push('Your weekly budget is tight. Focus on essential expenses only.');
    }
    if (categories['Food'] > weeklyBudget * 0.4) {
      recommendations.push('Consider meal planning to reduce food costs.');
    }
    if (categories['Entertainment'] > weeklyBudget * 0.2) {
      recommendations.push('Look for free or low-cost entertainment options.');
    }

    return {
      totalBudget: weeklyBudget,
      categories,
      recommendations
    };
  }
}