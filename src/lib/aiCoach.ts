import { Transaction, Jar, UserProfile } from '@/types';
import { FinancialAnalytics } from './analytics';
import { MLEngine } from './mlEngine';
import { BudgetOptimizer } from './budgetOptimizer';

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
    
    // Phase 2: Enhanced with ML predictions
    const incomePrediction = MLEngine.predictIncome(transactions, 7);
    const cashRunout = MLEngine.predictCashRunout(balance, transactions);
    const { dailyLimit, reasoning } = BudgetOptimizer.calculateDailySpendingLimit(
      balance,
      jars,
      incomePrediction.value,
      0,
      7
    );
    
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
        return `You can safely spend ₹${(safeToSpend * 7).toFixed(0)} this week (about ₹${safeToSpend.toFixed(0)} per day). This keeps your essential jars on track for rent, bills, and savings.\n\n📊 ML-optimized limit: ₹${dailyLimit.toFixed(0)}/day. ${reasoning}`;
      }
      if (lowerQuestion.includes('today') || lowerQuestion.includes('day')) {
        return `Your safe daily spending limit is ₹${safeToSpend.toFixed(0)}. However, based on ML analysis, I recommend ₹${dailyLimit.toFixed(0)}/day. ${reasoning}`;
      }
      return `Based on your pattern, you can safely spend ₹${safeToSpend.toFixed(0)} per day or ₹${(safeToSpend * 7).toFixed(0)} per week.\n\n🤖 AI suggests: ₹${dailyLimit.toFixed(0)}/day considering predicted income and expenses.`;
    }
    
    // Predictions and forecasting
    if (lowerQuestion.includes('predict') || lowerQuestion.includes('forecast') || lowerQuestion.includes('expect')) {
      if (lowerQuestion.includes('income')) {
        return `📈 Income Forecast:\n\nNext 7 days: ₹${incomePrediction.value.toFixed(0)} (${Math.round(incomePrediction.confidence * 100)}% confidence)\nTrend: ${incomePrediction.trend}\n\n${
          incomePrediction.trend === 'increasing' 
            ? 'Your income is trending upward! Great work!' 
            : incomePrediction.trend === 'decreasing'
            ? 'Income is declining. Consider diversifying income sources.'
            : 'Income is stable and predictable.'
        }`;
      }
      
      if (cashRunout) {
        return `⚠️ Cash Flow Warning:\n\nAt your current spending rate, you may run out of money in ${cashRunout.daysUntilRunout} days (${Math.round(cashRunout.confidence * 100)}% confidence).\n\nImmediate actions:\n1. Reduce non-essential spending\n2. Prioritize essential jars\n3. Look for quick income opportunities`;
      }
      
      return `Based on ML analysis:\n\n💰 Expected income (7 days): ₹${incomePrediction.value.toFixed(0)}\n📊 Confidence: ${Math.round(incomePrediction.confidence * 100)}%\n📈 Trend: ${incomePrediction.trend}\n\nYour finances are ${cashRunout ? 'at risk' : 'stable'}.`;
    }
    
    // Pattern analysis
    if (lowerQuestion.includes('pattern') || lowerQuestion.includes('habit') || lowerQuestion.includes('trend')) {
      const mlPatterns = MLEngine.detectPatterns(transactions);
      if (mlPatterns.length > 0) {
        const top = mlPatterns[0];
        return `🔍 Pattern Analysis:\n\nTop spending: ${top.category}\n• Average: ₹${top.averageAmount.toFixed(0)}\n• Frequency: ${top.frequency.toFixed(1)}x/week\n• Trend: ${top.trend}\n• Most common: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][top.dayOfWeek || 0]}\n\n${
          top.trend === 'increasing' 
            ? '⚠️ This category is growing. Consider setting limits.' 
            : top.trend === 'decreasing'
            ? '✅ Great! You\'re reducing spending here.'
            : 'Spending is consistent in this category.'
        }`;
      }
      return `I need more transaction data to detect meaningful patterns. Add at least 2 weeks of transactions for accurate analysis.`;
    }
    
    // Optimization suggestions
    if (lowerQuestion.includes('optimize') || lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
      const optimizations = BudgetOptimizer.generateOptimizations(
        transactions,
        jars,
        profile.monthlyIncome,
        profile.fixedExpenses
      );
      
      if (optimizations.length === 0) {
        return `🎉 Great job! Your budget is well-optimized. No major improvements needed right now. Keep up the good work!`;
      }
      
      const top3 = optimizations.slice(0, 3);
      let response = `💡 Top Budget Optimizations:\n\n`;
      top3.forEach((opt, idx) => {
        response += `${idx + 1}. ${opt.title}\n${opt.description}\n`;
        if (opt.impact > 0) {
          response += `💰 Potential savings: ₹${opt.impact.toFixed(0)}/month\n`;
        }
        response += `\n`;
      });
      
      return response;
    }
    
    // Savings questions
    if (lowerQuestion.includes('save') || lowerQuestion.includes('saving')) {
      const savingsJar = jars.find(j => j.name === 'Savings');
      if (savingsJar) {
        const progress = (savingsJar.current / savingsJar.target) * 100;
        const optimalSavings = MLEngine.calculateOptimalSavingsRate(
          profile.monthlyIncome,
          profile.fixedExpenses,
          profile.monthlyIncome - profile.fixedExpenses - savingsJar.current
        );
        
        return `💰 Savings Status:\n\nCurrent: ₹${savingsJar.current.toFixed(0)} / ₹${savingsJar.target.toFixed(0)} (${progress.toFixed(0)}%)\nDaily target: ₹${((savingsJar.target - savingsJar.current) / 30).toFixed(0)}\n\n🤖 AI Recommendation:\nOptimal savings rate: ₹${optimalSavings.toFixed(0)}/month (${((optimalSavings / profile.monthlyIncome) * 100).toFixed(0)}% of income)\n\n${
          savingsJar.current < savingsJar.target * 0.5
            ? 'You\'re behind on savings. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.'
            : 'Great progress! Keep it up!'
        }`;
      }
    }
    
    // Spending pattern questions
    if (lowerQuestion.includes('spending') || lowerQuestion.includes('expense')) {
      if (patterns.length > 0) {
        const top = patterns[0];
        const anomalies = MLEngine.detectAnomalies(transactions);
        
        let response = `📊 Spending Analysis:\n\nBiggest category: ${top.category}\n• Amount: ₹${top.amount.toFixed(0)} (${top.percentage.toFixed(0)}%)\n• ${top.percentage > 40 ? '⚠️ This seems high - could you reduce it?' : '✅ This looks reasonable.'}\n\n`;
        
        if (anomalies.length > 0) {
          response += `🔍 Unusual transactions detected:\n`;
          anomalies.slice(0, 2).forEach(a => {
            response += `• ₹${a.amount.toFixed(0)} on ${a.description}\n`;
          });
        }
        
        return response;
      }
      return `I need more transaction data to analyze your spending patterns. Add some expenses to get personalized insights!`;
    }
    
    // Balance questions
    if (lowerQuestion.includes('balance') || lowerQuestion.includes('money left')) {
      const totalJarNeeds = jars.reduce((sum, j) => sum + (j.target - j.current), 0);
      let response = `💵 Balance Overview:\n\nCurrent: ₹${balance.toFixed(0)}\nJar obligations: ₹${totalJarNeeds.toFixed(0)}\nFlexible: ₹${(balance - totalJarNeeds).toFixed(0)}\n\n`;
      
      if (cashRunout) {
        response += `⚠️ Warning: May run out in ${cashRunout.daysUntilRunout} days at current rate!\n\n`;
      }
      
      response += `🤖 AI suggests spending ₹${dailyLimit.toFixed(0)}/day to stay safe.`;
      return response;
    }
    
    // Income questions
    if (lowerQuestion.includes('income') || lowerQuestion.includes('earn')) {
      return `💰 Income Analysis:\n\nMonthly: ₹${profile.monthlyIncome.toFixed(0)}\nPredicted (7 days): ₹${incomePrediction.value.toFixed(0)}\nTrend: ${incomePrediction.trend}\n\n${
        profile.monthlyIncome > profile.fixedExpenses * 2 
          ? "✅ You're in good shape! Income covers expenses well." 
          : "⚠️ Consider increasing income or reducing fixed expenses."
      }\n\n${
        incomePrediction.trend === 'increasing'
          ? '📈 Great news! Your income is growing!'
          : incomePrediction.trend === 'decreasing'
          ? '📉 Income is declining. Time to explore new opportunities.'
          : '➡️ Income is stable.'
      }`;
    }
    
    // Default helpful response with ML insights
    return `I'm your AI-powered money coach! I can help with:\n\n💬 Questions:\n• "Can I afford ₹X?"\n• "How much can I spend this week?"\n• "Predict my income"\n• "What are my spending patterns?"\n• "How can I optimize my budget?"\n\n📊 Current Insights:\n• Safe daily spend: ₹${safeToSpend.toFixed(0)}\n• AI-optimized limit: ₹${dailyLimit.toFixed(0)}\n• Predicted income (7d): ₹${incomePrediction.value.toFixed(0)}\n\nAsk me anything about your finances!`;
  }
}