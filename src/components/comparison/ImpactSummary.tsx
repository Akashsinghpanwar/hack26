'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonResult, TRANSPORT_DATA, co2ToTrees, caloriesToFood, getRecommendation } from '@/lib/calculations';

interface ImpactSummaryProps {
  result: ComparisonResult;
  distance: number;
}

export function ImpactSummary({ result, distance }: ImpactSummaryProps) {
  const { mode, metrics } = result;
  const transportData = TRANSPORT_DATA[mode];
  const trees = co2ToTrees(metrics.co2Saved);
  const food = caloriesToFood(metrics.caloriesBurned);
  const recommendation = getRecommendation(distance, mode);

  const isSustainable = mode !== 'car';

  return (
    <Card className={isSustainable ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{transportData.icon}</span>
          Your Choice: {transportData.label}
          {isSustainable && <span className="ml-2 text-sm bg-green-500 text-white px-2 py-0.5 rounded-full">Sustainable</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-1">🌍</div>
            <div className="text-2xl font-bold text-green-600">
              {metrics.co2Saved > 0 ? `${metrics.co2Saved} kg` : `${metrics.co2Emissions} kg`}
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.co2Saved > 0 ? 'CO2 Saved vs Driving' : 'CO2 Emitted'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-1">🌳</div>
            <div className="text-2xl font-bold text-green-600">
              {trees > 0 ? trees : 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Equivalent Trees Planted
            </div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-orange-500">
              {metrics.caloriesBurned}
            </div>
            <div className="text-sm text-muted-foreground">
              Calories Burned ({food})
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-semibold text-blue-800">Smart Recommendation</h4>
              <p className="text-sm text-muted-foreground mt-1">{recommendation}</p>
            </div>
          </div>
        </div>

        {isSustainable && (
          <div className="flex flex-wrap gap-2">
            {metrics.co2Saved > 0 && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <span>✓</span> Low Carbon
              </span>
            )}
            {metrics.caloriesBurned > 0 && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <span>✓</span> Active Travel
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>✓</span> Eco Friendly
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
