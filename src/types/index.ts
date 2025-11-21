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