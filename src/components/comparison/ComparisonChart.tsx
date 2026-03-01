'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ComparisonResult, TRANSPORT_DATA } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComparisonChartProps {
  results: ComparisonResult[];
  metric: 'co2' | 'time' | 'calories';
}

export function ComparisonChart({ results, metric }: ComparisonChartProps) {
  const chartData = results.map((result) => {
    const data = TRANSPORT_DATA[result.mode];
    return {
      name: data.label,
      icon: data.icon,
      co2: result.metrics.co2Emissions,
      time: result.metrics.travelTime,
      calories: result.metrics.caloriesBurned,
      color: data.color
    };
  });

  const getMetricLabel = () => {
    switch (metric) {
      case 'co2': return 'CO2 Emissions (kg)';
      case 'time': return 'Travel Time (min)';
      case 'calories': return 'Calories Burned';
    }
  };

  const getMetricTitle = () => {
    switch (metric) {
      case 'co2': return 'CO2 Emissions Comparison';
      case 'time': return 'Travel Time Comparison';
      case 'calories': return 'Calories Burned Comparison';
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="h-[200px] sm:h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value) => {
                  const numValue = Number(value) || 0;
                  return [
                    metric === 'co2' ? `${numValue} kg` : 
                    metric === 'time' ? `${numValue} min` : 
                    `${numValue} kcal`,
                    getMetricLabel()
                  ];
                }}
              />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
