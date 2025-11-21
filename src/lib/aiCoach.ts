import { Transaction, Jar, UserProfile } from '@/types';
import { FinancialAnalytics } from './analytics';

export class AICoach {
  static generateResponse(
    question: string,
    transactions: Transaction[],
    jars: Jar[],
    profile: UserProfile
  ): string {
    const lowerQuestion = question.toLowerCase();
    const balance = profile.balance;
    const safeToSpend = FinancialAnalytics.calculateSafeToSpend(balance, jars);
    const patterns = FinancialAnalytics.detectSpendingPatterns(transactions);
    
    // Can I afford questions
    if (lowerQuestion.includes('can i afford') || lowerQuestion.includes('can i buy')) {
      const amountMatch = question.match(/₹?(\d+)/);
      if (amountMatch) {
        const amount = parseInt(amountMatch[1]);
        if (amount <= safeToSpend * 7) {
          return `Yes, you can afford ₹${amount}. Your safe weekly spending limit is ₹${(safeToSpend * 7).toFixed(0)}. Just make sure your essential jars stay funded!`;
        } else {
          return `I'd advise against spending ₹${amount} right now. Your safe weekly limit is ₹${(safeToSpend * 7).toFixed(0)}. This purchase would put your rent/bills at risk.`;
        }
      }
      return `Based on your current balance (₹${balance.toFixed(0)}) and jar targets, you can safely spend ₹${(safeToSpend * 7).toFixed(0)} this week.`;
    }
    
    // How much can I spend questions
    if (lowerQuestion.includes('how much') && (lowerQuestion.includes('spend') || lowerQuestion.includes('safe'))) {
      if (lowerQuestion.includes('weekend') || lowerQuestion.includes('week')) {
        return `You can safely spend ₹${(safeToSpend * 7).toFixed(0)} this week (about ₹${safeToSpend.toFixed(0)} per day). This keeps your essential jars on track for rent, bills, and savings.`;
      }
      if (lowerQuestion.includes('today') || lowerQuestion.includes('day')) {
        return `Your safe daily spending limit is ₹${safeToSpend.toFixed(0)}. This ensures you'll have enough for your upcoming obligations.`;
      }
      return `Based on your pattern, you can safely spend ₹${safeToSpend.toFixed(0)} per day or ₹${(safeToSpend * 7).toFixed(0)} per week.`;
    }
    
    // Savings questions
    if (lowerQuestion.includes('save') || lowerQuestion.includes('saving')) {
      const savingsJar = jars.find(j => j.name === 'Savings');
      if (savingsJar) {
        const progress = (savingsJar.current / savingsJar.target) * 100;
        return `Your savings jar is ${progress.toFixed(0)}% funded (₹${savingsJar.current.toFixed(0)} of ₹${savingsJar.target.toFixed(0)}). Try adding ₹${((savingsJar.target - savingsJar.current) / 30).toFixed(0)} daily to reach your goal this month.`;
      }
    }
    
    // Spending pattern questions
    if (lowerQuestion.includes('spending') || lowerQuestion.includes('expense')) {
      if (patterns.length > 0) {
        const top = patterns[0];
        return `Your biggest expense category is ${top.category} at ₹${top.amount.toFixed(0)} (${top.percentage.toFixed(0)}% of recent spending). ${
          top.percentage > 40 ? 'This seems high - could you reduce it?' : 'This looks reasonable.'
        }`;
      }
      return `I need more transaction data to analyze your spending patterns. Add some expenses to get personalized insights!`;
    }
    
    // Balance questions
    if (lowerQuestion.includes('balance') || lowerQuestion.includes('money left')) {
      const totalJarNeeds = jars.reduce((sum, j) => sum + (j.target - j.current), 0);
      return `Your current balance is ₹${balance.toFixed(0)}. After setting aside ₹${totalJarNeeds.toFixed(0)} for your jars, you have ₹${(balance - totalJarNeeds).toFixed(0)} for flexible spending.`;
    }
    
    // Income questions
    if (lowerQuestion.includes('income') || lowerQuestion.includes('earn')) {
      return `Your monthly income is approximately ₹${profile.monthlyIncome.toFixed(0)}. ${
        profile.monthlyIncome > profile.fixedExpenses * 2 
          ? "You're in good shape!" 
          : "Consider increasing income or reducing fixed expenses."
      }`;
    }
    
    // Default helpful response
    return `I'm here to help with your finances! You can ask me:
• "Can I afford ₹X?"
• "How much can I spend this week?"
• "How are my savings doing?"
• "What's my biggest expense?"
• "What's my balance?"

Your current safe daily spending is ₹${safeToSpend.toFixed(0)}.`;
  }
}