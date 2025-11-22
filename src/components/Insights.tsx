import { Transaction, Jar, UserProfile, SpendingInsight, BudgetOptimization } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MLEngine } from '@/lib/mlEngine';
import { BudgetOptimizer } from '@/lib/budgetOptimizer';
import { CategoryDetector } from '@/lib/categoryDetector';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Brain,
  Calendar,
  DollarSign
} from 'lucide-react';

interface InsightsProps {
  transactions: Transaction[];
  jars: Jar[];
  profile: UserProfile;
}

export default function Insights({ transactions, jars, profile }: InsightsProps) {
  // Generate predictions
  const incomePrediction = MLEngine.predictIncome(transactions, 7);
  const monthlyIncomePrediction = MLEngine.predictIncome(transactions, 30);
  
  // Detect patterns
  const patterns = MLEngine.detectPatterns(transactions);
  const anomalies = MLEngine.detectAnomalies(transactions);
  
  // Cash runout prediction
  const cashRunout = MLEngine.predictCashRunout(profile.balance, transactions);
  
  // Budget optimizations
  const optimizations = BudgetOptimizer.generateOptimizations(
    transactions,
    jars,
    profile.monthlyIncome,
    profile.fixedExpenses
  );
  
  // Category suggestions
  const categorySuggestions = CategoryDetector.suggestRecategorization(transactions);
  const categorizationStats = CategoryDetector.getCategorizationStats(transactions);
  
  // Weekly spending plan
  const weeklyPlan = BudgetOptimizer.generateWeeklyPlan(
    profile.balance,
    jars,
    transactions,
    profile.monthlyIncome
  );
  
  // Daily spending limit
  const { dailyLimit, reasoning } = BudgetOptimizer.calculateDailySpendingLimit(
    profile.balance,
    jars,
    incomePrediction.value,
    0,
    7
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">Powered by machine learning and pattern analysis</p>
        </div>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {/* Cash Runout Warning */}
          {cashRunout && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> At your current spending rate, you may run out of money in{' '}
                <strong>{cashRunout.daysUntilRunout} days</strong> (
                {Math.round(cashRunout.confidence * 100)}% confidence). Consider reducing expenses immediately.
              </AlertDescription>
            </Alert>
          )}

          {/* Income Predictions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Income Forecast
                  </span>
                  {getTrendIcon(incomePrediction.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">₹{incomePrediction.value.toFixed(0)}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{Math.round(incomePrediction.confidence * 100)}%</span>
                  </div>
                  <Progress value={incomePrediction.confidence * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {incomePrediction.trend === 'increasing' && 'Your income is trending upward! 📈'}
                    {incomePrediction.trend === 'decreasing' && 'Income is declining. Consider additional sources. 📉'}
                    {incomePrediction.trend === 'stable' && 'Income is stable and predictable. ✓'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly Income Forecast
                  </span>
                  {getTrendIcon(monthlyIncomePrediction.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">₹{monthlyIncomePrediction.value.toFixed(0)}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{Math.round(monthlyIncomePrediction.confidence * 100)}%</span>
                  </div>
                  <Progress value={monthlyIncomePrediction.confidence * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Expected income for the next 30 days based on your earning patterns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Spending Limit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Optimized Daily Spending Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-4xl font-bold text-green-600">₹{dailyLimit.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground">{reasoning}</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">This limit considers:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Your current balance and jar obligations</li>
                    <li>Predicted income for the next 7 days</li>
                    <li>20% safety buffer for unexpected expenses</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Spending Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Spending Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Weekly Budget</span>
                  <span className="text-2xl font-bold">₹{weeklyPlan.totalBudget.toFixed(0)}</span>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(weeklyPlan.categories).map(([category, amount]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">₹{amount.toFixed(0)}</span>
                      </div>
                      <Progress 
                        value={(amount / weeklyPlan.totalBudget) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>

                {weeklyPlan.recommendations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Recommendations:</p>
                    {weeklyPlan.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {/* Spending Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Spending Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Not enough data to detect patterns. Add more transactions!
                </p>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          {pattern.category}
                          {getTrendIcon(pattern.trend)}
                        </h3>
                        <Badge variant="outline">
                          {pattern.frequency.toFixed(1)}x/week
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Average Amount</span>
                          <p className="font-medium">₹{pattern.averageAmount.toFixed(0)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Most Common Day</span>
                          <p className="font-medium">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern.dayOfWeek || 0]}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {pattern.trend === 'increasing' && '⚠️ Spending is increasing in this category'}
                        {pattern.trend === 'decreasing' && '✓ Great! Spending is decreasing'}
                        {pattern.trend === 'stable' && 'Spending is consistent'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Unusual Transactions Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">₹{transaction.amount.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Unusually high</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          {optimizations.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Great job! No major optimizations needed right now. Keep up the good work! 🎉
                </p>
              </CardContent>
            </Card>
          ) : (
            optimizations.map((opt, idx) => (
              <Card key={idx} className="border-l-4" style={{
                borderLeftColor: opt.priority === 'high' ? '#ef4444' : opt.priority === 'medium' ? '#f59e0b' : '#10b981'
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opt.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {opt.impact > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          Save ₹{opt.impact.toFixed(0)}/mo
                        </Badge>
                      )}
                      <Badge variant={getPriorityColor(opt.priority)}>
                        {opt.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                  {opt.actionable && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                      <Lightbulb className="h-4 w-4" />
                      <span>Actionable recommendation</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {/* Categorization Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Categorization Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{categorizationStats.totalTransactions}</p>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{categorizationStats.autoCategorized}</p>
                    <p className="text-sm text-muted-foreground">Auto-Categorized</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{categorizationStats.accuracy.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                </div>
                <Progress value={categorizationStats.accuracy} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Category Suggestions */}
          {categorySuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Re-categorizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorySuggestions.slice(0, 10).map((suggestion, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{suggestion.transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {suggestion.transaction.category} → Suggested: {suggestion.suggestedCategory}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(suggestion.confidence * 100)}% confident
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}