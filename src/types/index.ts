export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

export interface Jar {
  name: string;
  target: number;
  current: number;
  priority: number;
  color: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  date: string;
}

export interface UserProfile {
  balance: number;
  monthlyIncome: number;
  fixedExpenses: number;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Phase 2: Enhanced Intelligence Types

export interface Prediction {
  value: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface IncomeForecast {
  weekly: Prediction;
  monthly: Prediction;
  peakDays: number[]; // Days of week (0-6)
}

export interface ExpenseForecast {
  [category: string]: Prediction;
}

export interface SpendingInsight {
  type: 'trend' | 'anomaly' | 'pattern' | 'opportunity';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  actionable: boolean;
}

export interface BudgetOptimization {
  type: 'jar_allocation' | 'spending_reduction' | 'savings_increase' | 'emergency_fund';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  actionable: boolean;
}

export interface CategorySuggestion {
  transaction: Transaction;
  suggestedCategory: string;
  confidence: number;
}

export interface FinancialHealth {
  score: number; // 0-100
  factors: {
    savingsRate: number;
    debtToIncome: number;
    emergencyFund: number;
    spendingControl: number;
  };
  recommendations: string[];
}