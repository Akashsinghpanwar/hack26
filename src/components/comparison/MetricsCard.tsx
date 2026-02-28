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

// Icon backgrounds based on type
const iconConfig: Record<string, { bg: string; text: string }> = {
  '🚀': { bg: 'from-violet-500 to-purple-600', text: 'Trips' },
  '🌍': { bg: 'from-green-500 to-emerald-600', text: 'CO2' },
  '🔥': { bg: 'from-orange-500 to-red-500', text: 'Cal' },
  '📍': { bg: 'from-blue-500 to-cyan-500', text: 'Dist' },
  '🚗': { bg: 'from-red-400 to-red-600', text: 'Car' },
  '🚌': { bg: 'from-orange-400 to-orange-600', text: 'Bus' },
  '🚆': { bg: 'from-yellow-400 to-amber-500', text: 'Train' },
  '🚲': { bg: 'from-green-400 to-green-600', text: 'Bike' },
  '🚶': { bg: 'from-emerald-400 to-teal-600', text: 'Walk' },
  '⚡': { bg: 'from-cyan-400 to-blue-500', text: 'E-Bike' },
};

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
    green: 'text-green-700 bg-green-100/80',
    red: 'text-red-700 bg-red-100/80',
    neutral: 'text-muted-foreground bg-muted/80'
  };

  const config = iconConfig[icon] || { bg: 'from-gray-400 to-gray-600', text: '' };

  return (
    <Card className={cn(
      "overflow-hidden stat-card border-border/50 hover:border-primary/30",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-bold tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{unit}</span>
            </div>
            {comparison && (
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1.5",
                colorClasses[comparisonColor]
              )}>
                {comparison}
              </span>
            )}
          </div>
          
          {/* Modern icon container */}
          <div className={cn(
            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            config.bg
          )}>
            <span className="text-xl filter drop-shadow-sm">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
