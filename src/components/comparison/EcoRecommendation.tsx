'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComparisonResult, TRANSPORT_DATA, TransportMode } from '@/lib/calculations';

interface EcoRecommendationProps {
  results: ComparisonResult[];
  distance: number;
  onSelectMode: (mode: TransportMode) => void;
  currentMode?: TransportMode;
}

export function EcoRecommendation({ results, distance, onSelectMode, currentMode }: EcoRecommendationProps) {
  // Sort by CO2 savings (most eco-friendly first)
  const sortedByEco = [...results]
    .filter(r => r.mode !== 'car')
    .sort((a, b) => b.metrics.co2Saved - a.metrics.co2Saved);

  // Find best options
  const mostEcoFriendly = sortedByEco[0];
  const bestForCalories = [...results]
    .filter(r => r.mode !== 'car')
    .sort((a, b) => b.metrics.caloriesBurned - a.metrics.caloriesBurned)[0];
  const fastestEco = [...results]
    .filter(r => r.mode !== 'car')
    .sort((a, b) => a.metrics.travelTime - b.metrics.travelTime)[0];

  const carResult = results.find(r => r.mode === 'car');

  // Get recommendations based on distance
  const getDistanceBasedRecommendations = () => {
    const recommendations: { mode: TransportMode; reason: string; badge: string }[] = [];

    if (distance <= 2) {
      recommendations.push({
        mode: 'walk',
        reason: 'Perfect walking distance! Get fresh air and burn calories.',
        badge: '🏆 Best Choice'
      });
    }
    
    if (distance <= 5) {
      recommendations.push({
        mode: 'bike',
        reason: 'Ideal for cycling! Zero emissions and great exercise.',
        badge: '🌱 Eco Champion'
      });
    }

    if (distance <= 8) {
      recommendations.push({
        mode: 'ebike',
        reason: 'E-bike is perfect for this distance - fast and nearly zero emissions.',
        badge: '⚡ Smart Choice'
      });
    }

    if (distance > 5 && distance <= 30) {
      recommendations.push({
        mode: 'bus',
        reason: 'Public transit saves 57% CO2 compared to driving alone.',
        badge: '🚌 Community Hero'
      });
    }

    if (distance > 10) {
      recommendations.push({
        mode: 'train',
        reason: 'Train is the most efficient for longer distances - 80% less CO2!',
        badge: '🚆 Distance Champion'
      });
    }

    return recommendations;
  };

  const recommendations = getDistanceBasedRecommendations();
  const topRecommendation = recommendations[0];

  // Environmental impact equivalents
  const treesEquivalent = (mostEcoFriendly?.metrics.co2Saved || 0) * 0.06; // ~0.06 trees absorb 1kg CO2/year
  const phoneCharges = (mostEcoFriendly?.metrics.co2Saved || 0) * 122; // ~8.22g CO2 per phone charge
  const plasticBags = (mostEcoFriendly?.metrics.co2Saved || 0) * 17; // ~60g CO2 per plastic bag

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <span className="text-3xl">🌍</span>
          Eco-Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Recommendation */}
        {topRecommendation && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
            <div className="flex items-start gap-4">
              <div className="text-5xl">
                {TRANSPORT_DATA[topRecommendation.mode].icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-green-800">
                    {TRANSPORT_DATA[topRecommendation.mode].label}
                  </span>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {topRecommendation.badge}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {topRecommendation.reason}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {results.find(r => r.mode === topRecommendation.mode) && (
                    <>
                      <span className="flex items-center gap-1">
                        <span className="text-green-600 font-semibold">
                          {results.find(r => r.mode === topRecommendation.mode)?.metrics.co2Saved.toFixed(2)} kg
                        </span>
                        <span className="text-gray-500">CO2 saved</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-orange-600 font-semibold">
                          {results.find(r => r.mode === topRecommendation.mode)?.metrics.caloriesBurned.toFixed(0)} kcal
                        </span>
                        <span className="text-gray-500">burned</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-blue-600 font-semibold">
                          {results.find(r => r.mode === topRecommendation.mode)?.metrics.travelTime.toFixed(0)} min
                        </span>
                        <span className="text-gray-500">travel time</span>
                      </span>
                    </>
                  )}
                </div>
                <Button 
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  onClick={() => onSelectMode(topRecommendation.mode)}
                >
                  Choose {TRANSPORT_DATA[topRecommendation.mode].label} →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Comparison */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl mb-1">🌿</div>
            <div className="text-xl font-bold text-green-700">
              {mostEcoFriendly?.metrics.co2Saved.toFixed(2) || 0}
            </div>
            <div className="text-xs text-gray-500">kg CO2 saveable</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-bold text-orange-600">
              {bestForCalories?.metrics.caloriesBurned.toFixed(0) || 0}
            </div>
            <div className="text-xs text-gray-500">max calories</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-xl font-bold text-blue-600">
              {fastestEco?.metrics.travelTime.toFixed(0) || 0}
            </div>
            <div className="text-xs text-gray-500">min (eco option)</div>
          </div>
        </div>

        {/* Environmental Impact Visualization */}
        {mostEcoFriendly && mostEcoFriendly.metrics.co2Saved > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>💡</span> Your Impact By Choosing Green
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              By choosing <strong>{TRANSPORT_DATA[mostEcoFriendly.mode].label}</strong> instead of driving, you save:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-lg">🌳</div>
                <div className="font-bold text-green-700">{treesEquivalent.toFixed(1)}</div>
                <div className="text-xs text-gray-500">tree-days of absorption</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-lg">📱</div>
                <div className="font-bold text-blue-700">{Math.round(phoneCharges)}</div>
                <div className="text-xs text-gray-500">phone charges</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2">
                <div className="text-lg">🛍️</div>
                <div className="font-bold text-yellow-700">{Math.round(plasticBags)}</div>
                <div className="text-xs text-gray-500">plastic bags</div>
              </div>
            </div>
          </div>
        )}

        {/* Other Eco Options */}
        {recommendations.length > 1 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Other Sustainable Options:</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.slice(1).map((rec) => (
                <Button
                  key={rec.mode}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectMode(rec.mode)}
                  className={`border-green-300 hover:bg-green-50 ${
                    currentMode === rec.mode ? 'bg-green-100 border-green-500' : ''
                  }`}
                >
                  <span className="mr-1">{TRANSPORT_DATA[rec.mode].icon}</span>
                  {TRANSPORT_DATA[rec.mode].label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Car Warning */}
        {carResult && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-xl">🚗</span>
              <div>
                <span className="font-semibold text-red-700">Driving Impact: </span>
                <span className="text-red-600">
                  {carResult.metrics.co2Emissions.toFixed(2)} kg CO2 for this {distance.toFixed(1)} km journey
                </span>
                <p className="text-gray-600 mt-1">
                  Consider sustainable options above to reduce your carbon footprint!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
