import { useState, useEffect } from 'react';
import { Transaction, Jar, Alert, UserProfile } from '@/types';
import { FinancialAnalytics } from '@/lib/analytics';
import { CategoryDetector } from '@/lib/categoryDetector';
import Dashboard from '@/components/Dashboard';
import TransactionManager from '@/components/TransactionManager';
import ChatCoach from '@/components/ChatCoach';
import JarSystem from '@/components/JarSystem';
import Insights from '@/components/Insights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Receipt, MessageCircle, PiggyBank, Brain } from 'lucide-react';

const STORAGE_KEY = 'ai-money-coach-data';

export default function Index() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jars, setJars] = useState<Jar[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    balance: 0,
    monthlyIncome: 0,
    fixedExpenses: 0,
    lastUpdated: new Date().toISOString()
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setTransactions(data.transactions || []);
      setJars(data.jars || []);
      setProfile(data.profile || profile);
    } else {
      // Initialize with sample data
      initializeSampleData();
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (transactions.length > 0 || jars.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, jars, profile }));
    }
  }, [transactions, jars, profile]);

  // Recalculate profile and alerts when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const balance = FinancialAnalytics.calculateBalance(transactions);
      const monthlyIncome = FinancialAnalytics.getMonthlyIncome(transactions);
      const fixedExpenses = FinancialAnalytics.getFixedExpenses(transactions);
      
      const newProfile: UserProfile = {
        balance,
        monthlyIncome,
        fixedExpenses,
        lastUpdated: new Date().toISOString()
      };
      
      setProfile(newProfile);
      
      // Initialize jars if empty
      if (jars.length === 0 && monthlyIncome > 0) {
        const suggestedJars = FinancialAnalytics.suggestJarAllocations(monthlyIncome, fixedExpenses);
        setJars(suggestedJars);
      }
      
      // Generate alerts
      const newAlerts = FinancialAnalytics.generateAlerts(balance, transactions, jars, newProfile);
      setAlerts(newAlerts);
    }
  }, [transactions]);

  const initializeSampleData = () => {
    const sampleTransactions: Transaction[] = [
      {
        id: '1',
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 15000,
        type: 'income',
        category: 'Salary',
        description: 'Monthly salary'
      },
      {
        id: '2',
        date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 8000,
        type: 'expense',
        category: 'Rent',
        description: 'Monthly rent payment'
      },
      {
        id: '3',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 500,
        type: 'expense',
        category: 'Food',
        description: 'Groceries from supermarket'
      },
      {
        id: '4',
        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 200,
        type: 'expense',
        category: 'Transport',
        description: 'Uber rides'
      },
      {
        id: '5',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 1500,
        type: 'expense',
        category: 'Bills',
        description: 'Electricity and internet bill'
      },
      {
        id: '6',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 3000,
        type: 'income',
        category: 'Freelance',
        description: 'Freelance project payment'
      },
      {
        id: '7',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 800,
        type: 'expense',
        category: 'Food',
        description: 'Restaurant dinner and food delivery'
      },
      {
        id: '8',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 1200,
        type: 'expense',
        category: 'Shopping',
        description: 'Clothes from amazon'
      },
      {
        id: '9',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 400,
        type: 'expense',
        category: 'Entertainment',
        description: 'Movie tickets and netflix subscription'
      },
      {
        id: '10',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 600,
        type: 'expense',
        category: 'Food',
        description: 'Groceries and snacks'
      },
      {
        id: '11',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 2000,
        type: 'income',
        category: 'Freelance',
        description: 'Client payment received'
      }
    ];
    
    setTransactions(sampleTransactions);
  };

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    // Phase 2: Auto-categorize if category is not set or is 'Other'
    const finalTransaction = { ...transaction };
    
    if (!transaction.category || transaction.category === 'Other') {
      const detected = CategoryDetector.detectCategory(transaction.description);
      if (detected.confidence > 0.7) {
        finalTransaction.category = detected.category;
      }
    }
    
    // Learn from user's category choice
    CategoryDetector.learnFromUser(transaction.description, finalTransaction.category);
    
    const newTransaction: Transaction = {
      ...finalTransaction,
      id: Date.now().toString()
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleUpdateJar = (jarName: string, amount: number) => {
    if (amount > profile.balance) {
      alert("You don't have enough balance to add this amount!");
      return;
    }
    
    setJars(jars.map(jar => 
      jar.name === jarName 
        ? { ...jar, current: Math.min(jar.current + amount, jar.target) }
        : jar
    ));
    
    // Add a transaction for jar allocation
    handleAddTransaction({
      date: new Date().toISOString(),
      amount: amount,
      type: 'expense',
      category: 'Savings',
      description: `Added to ${jarName} jar`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="jars" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Jars
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Coach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard 
              transactions={transactions}
              jars={jars}
              profile={profile}
              alerts={alerts}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManager 
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />
          </TabsContent>

          <TabsContent value="jars">
            <JarSystem 
              jars={jars}
              onUpdateJar={handleUpdateJar}
            />
          </TabsContent>

          <TabsContent value="insights">
            <Insights 
              transactions={transactions}
              jars={jars}
              profile={profile}
            />
          </TabsContent>

          <TabsContent value="coach">
            <ChatCoach 
              transactions={transactions}
              jars={jars}
              profile={profile}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}