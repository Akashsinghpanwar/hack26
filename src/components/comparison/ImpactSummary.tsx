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
    <Card className={`border-0 shadow-sm ${isSustainable ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-orange-50 to-amber-50'}`}>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="text-xl sm:text-2xl">{transportData.icon}</span>
          <span className="truncate">{transportData.label}</span>
          {isSustainable && <span className="ml-auto text-[10px] sm:text-xs bg-green-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">Sustainable</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6 pb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xl sm:text-3xl mb-0.5 sm:mb-1">🌍</div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {metrics.co2Saved > 0 ? metrics.co2Saved.toFixed(1) : metrics.co2Emissions.toFixed(1)}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground">
              kg {metrics.co2Saved > 0 ? 'saved' : 'CO₂'}
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xl sm:text-3xl mb-0.5 sm:mb-1">🌳</div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {trees > 0 ? trees : 0}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground">
              trees
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xl sm:text-3xl mb-0.5 sm:mb-1">🔥</div>
            <div className="text-lg sm:text-2xl font-bold text-orange-500">
              {metrics.caloriesBurned}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground">
              cal
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-2xl">💡</span>
            <div className="min-w-0">
              <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Tip</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{recommendation}</p>
            </div>
          </div>
        </div>

        {isSustainable && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {metrics.co2Saved > 0 && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm">
                ✓ Low Carbon
              </span>
            )}
            {metrics.caloriesBurned > 0 && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm">
                ✓ Active
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm">
              ✓ Eco
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
