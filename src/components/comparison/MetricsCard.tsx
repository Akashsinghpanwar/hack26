'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: string;
  comparison?: string;
  comparisonColor?: 'green' | 'red' | 'neutral';
  className?: string;
}

export function MetricsCard({ 
  title, 
  value, 
  unit, 
  icon, 
  comparison, 
  comparisonColor = 'neutral',
  className 
}: MetricsCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    neutral: 'text-muted-foreground bg-muted'
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {comparison && (
              <p className={cn(
                "text-xs px-2 py-1 rounded-full inline-block mt-2",
                colorClasses[comparisonColor]
              )}>
                {comparison}
              </p>
            )}
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}
