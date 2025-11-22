import { Transaction } from '@/types';

interface CategoryRule {
  keywords: string[];
  category: string;
  confidence: number;
}

export class CategoryDetector {
  private static rules: CategoryRule[] = [
    // Food & Dining
    { keywords: ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'swiggy', 'zomato', 'uber eats', 'grocery', 'supermarket'], category: 'Food', confidence: 0.9 },
    { keywords: ['breakfast', 'lunch', 'dinner', 'snack', 'meal'], category: 'Food', confidence: 0.85 },
    
    // Transport
    { keywords: ['uber', 'ola', 'taxi', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'gas'], category: 'Transport', confidence: 0.9 },
    { keywords: ['parking', 'toll', 'auto'], category: 'Transport', confidence: 0.85 },
    
    // Bills & Utilities
    { keywords: ['electricity', 'water', 'gas bill', 'internet', 'wifi', 'broadband', 'mobile bill', 'phone bill'], category: 'Bills', confidence: 0.95 },
    { keywords: ['utility', 'maintenance'], category: 'Bills', confidence: 0.8 },
    
    // Rent & Housing
    { keywords: ['rent', 'lease', 'housing'], category: 'Rent', confidence: 0.95 },
    
    // Entertainment
    { keywords: ['movie', 'cinema', 'netflix', 'prime', 'spotify', 'gaming', 'game', 'concert', 'show'], category: 'Entertainment', confidence: 0.9 },
    { keywords: ['subscription', 'membership'], category: 'Entertainment', confidence: 0.7 },
    
    // Shopping
    { keywords: ['amazon', 'flipkart', 'shopping', 'clothes', 'fashion', 'shoes', 'electronics'], category: 'Shopping', confidence: 0.85 },
    { keywords: ['purchase', 'bought'], category: 'Shopping', confidence: 0.6 },
    
    // Healthcare
    { keywords: ['doctor', 'hospital', 'clinic', 'medicine', 'pharmacy', 'medical', 'health'], category: 'Healthcare', confidence: 0.9 },
    
    // EMI & Loans
    { keywords: ['emi', 'loan', 'installment', 'credit card'], category: 'EMI', confidence: 0.95 },
    
    // Income
    { keywords: ['salary', 'wage', 'payment received', 'income', 'freelance', 'bonus'], category: 'Salary', confidence: 0.9 },
    { keywords: ['transfer in', 'received'], category: 'Other Income', confidence: 0.6 },
  ];

  private static userLearning: Map<string, string> = new Map();

  /**
   * Auto-detect category based on transaction description
   */
  static detectCategory(description: string): { category: string; confidence: number } {
    const lowerDesc = description.toLowerCase();

    // Check user learning first (highest priority)
    for (const [pattern, category] of this.userLearning.entries()) {
      if (lowerDesc.includes(pattern.toLowerCase())) {
        return { category, confidence: 1.0 };
      }
    }

    // Check predefined rules
    let bestMatch = { category: 'Other', confidence: 0.3 };

    for (const rule of this.rules) {
      for (const keyword of rule.keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          if (rule.confidence > bestMatch.confidence) {
            bestMatch = { category: rule.category, confidence: rule.confidence };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Learn from user's category choice
   */
  static learnFromUser(description: string, category: string): void {
    const key = description.toLowerCase().split(' ').slice(0, 3).join(' ');
    this.userLearning.set(key, category);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      const learned = Array.from(this.userLearning.entries());
      localStorage.setItem('category-learning', JSON.stringify(learned));
    }
  }

  /**
   * Load learned patterns from storage
   */
  static loadLearning(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('category-learning');
      if (stored) {
        const learned = JSON.parse(stored) as [string, string][];
        this.userLearning = new Map(learned);
      }
    }
  }

  /**
   * Suggest better category for a transaction
   */
  static suggestRecategorization(transactions: Transaction[]): Array<{
    transaction: Transaction;
    suggestedCategory: string;
    confidence: number;
  }> {
    const suggestions: Array<{
      transaction: Transaction;
      suggestedCategory: string;
      confidence: number;
    }> = [];

    for (const transaction of transactions) {
      const detected = this.detectCategory(transaction.description);
      
      // Suggest if confidence is high and different from current category
      if (detected.confidence > 0.8 && detected.category !== transaction.category) {
        suggestions.push({
          transaction,
          suggestedCategory: detected.category,
          confidence: detected.confidence
        });
      }
    }

    return suggestions;
  }

  /**
   * Auto-categorize a batch of transactions
   */
  static autoCategorizeTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.map(transaction => {
      if (transaction.category === 'Other' || !transaction.category) {
        const detected = this.detectCategory(transaction.description);
        if (detected.confidence > 0.7) {
          return { ...transaction, category: detected.category };
        }
      }
      return transaction;
    });
  }

  /**
   * Get categorization statistics
   */
  static getCategorizationStats(transactions: Transaction[]): {
    totalTransactions: number;
    autoCategorized: number;
    accuracy: number;
  } {
    let autoCategorized = 0;
    
    for (const transaction of transactions) {
      const detected = this.detectCategory(transaction.description);
      if (detected.category === transaction.category && detected.confidence > 0.7) {
        autoCategorized++;
      }
    }

    return {
      totalTransactions: transactions.length,
      autoCategorized,
      accuracy: transactions.length > 0 ? (autoCategorized / transactions.length) * 100 : 0
    };
  }
}

// Initialize learning on module load
CategoryDetector.loadLearning();