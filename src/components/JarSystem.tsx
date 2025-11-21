import { Jar } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { PiggyBank, Plus } from 'lucide-react';

interface JarSystemProps {
  jars: Jar[];
  onUpdateJar: (jarName: string, amount: number) => void;
}

export default function JarSystem({ jars, onUpdateJar }: JarSystemProps) {
  const [addAmounts, setAddAmounts] = useState<{ [key: string]: string }>({});

  const handleAddToJar = (jarName: string) => {
    const amount = parseFloat(addAmounts[jarName] || '0');
    if (amount > 0) {
      onUpdateJar(jarName, amount);
      setAddAmounts({ ...addAmounts, [jarName]: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <PiggyBank className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Virtual Jars</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {jars.map((jar) => {
          const progress = (jar.current / jar.target) * 100;
          const remaining = jar.target - jar.current;
          
          return (
            <Card key={jar.name} className="border-l-4" style={{ borderLeftColor: jar.color.replace('bg-', '') }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{jar.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Priority {jar.priority}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>₹{jar.current.toFixed(0)} / ₹{jar.target.toFixed(0)}</span>
                    <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {remaining > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ₹{remaining.toFixed(0)} remaining • Save ₹{(remaining / 7).toFixed(0)}/day
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={addAmounts[jar.name] || ''}
                    onChange={(e) => setAddAmounts({ ...addAmounts, [jar.name]: e.target.value })}
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleAddToJar(jar.name)}
                    disabled={!addAmounts[jar.name] || parseFloat(addAmounts[jar.name]) <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}