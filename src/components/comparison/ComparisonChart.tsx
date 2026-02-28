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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{getMetricTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted))' }}
                label={{ 
                  value: getMetricLabel(), 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'hsl(var(--foreground))'
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [
                  metric === 'co2' ? `${value} kg` : 
                  metric === 'time' ? `${value} min` : 
                  `${value} kcal`,
                  getMetricLabel()
                ]}
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
