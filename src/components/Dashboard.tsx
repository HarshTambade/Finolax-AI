import { Transaction, Jar, Alert, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert as AlertComponent, AlertDescription } from '@/components/ui/alert';
import { FinancialAnalytics } from '@/lib/analytics';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  jars: Jar[];
  profile: UserProfile;
  alerts: Alert[];
}

export default function Dashboard({ transactions, jars, profile, alerts }: DashboardProps) {
  const safeToSpend = FinancialAnalytics.calculateSafeToSpend(profile.balance, jars);
  const patterns = FinancialAnalytics.detectSpendingPatterns(transactions);
  const weeklyIncome = profile.monthlyIncome / 4;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">Your personalized money coach</p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertComponent
              key={alert.id}
              variant={alert.type === 'warning' ? 'destructive' : 'default'}
              className={
                alert.type === 'success' ? 'border-green-500 bg-green-50' :
                alert.type === 'info' ? 'border-blue-500 bg-blue-50' : ''
              }
            >
              {getAlertIcon(alert.type)}
              <AlertDescription>{alert.message}</AlertDescription>
            </AlertComponent>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{profile.balance.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              {profile.balance > 0 ? 'Available funds' : 'Negative balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe to Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{safeToSpend.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per day this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{weeklyIncome.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Average per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{profile.fixedExpenses.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Monthly obligations</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Spending Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patterns.slice(0, 5).map((pattern) => (
                <div key={pattern.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{pattern.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ₹{pattern.amount.toFixed(0)} ({pattern.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${pattern.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}