'use client';

import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import MapSelector from '@/components/journey/MapSelectorWrapper';
import { ComparisonChart } from '@/components/comparison/ComparisonChart';
import { ImpactSummary } from '@/components/comparison/ImpactSummary';
import { VehicleLookup } from '@/components/comparison/VehicleLookup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransportMode, calculateAllModes, calculateAllModesWithCustomCar, ComparisonResult, TRANSPORT_DATA } from '@/lib/calculations';

export default function ComparePage() {
  const [distance, setDistance] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
  const [allResults, setAllResults] = useState<ComparisonResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [customCarCo2, setCustomCarCo2] = useState<number | null>(null);

  const handleRouteCalculated = useCallback((dist: number, from: string, to: string, destLat?: number, destLon?: number) => {
    setDistance(dist);
    setRouteCalculated(true);
    setSelectedMode(null);
    setSelectedResult(null);

    const results = customCarCo2 !== null
      ? calculateAllModesWithCustomCar(dist, customCarCo2)
      : calculateAllModes(dist);
    setAllResults(results);
  }, [customCarCo2]);

  const handleModeSelect = (mode: TransportMode) => {
    setSelectedMode(mode);
    const result = allResults.find(r => r.mode === mode) || null;
    setSelectedResult(result);
  };

  const handleVehicleFound = useCallback((co2PerKm: number, vehicleInfo: any) => {
    setCustomCarCo2(co2PerKm);
    if (distance > 0) {
      const results = calculateAllModesWithCustomCar(distance, co2PerKm);
      setAllResults(results);
      if (selectedMode) {
        const result = results.find(r => r.mode === selectedMode) || null;
        setSelectedResult(result);
      }
    }
  }, [distance, selectedMode]);

  // Find most sustainable option
  const mostSustainable = allResults.length > 0 
    ? [...allResults].filter(r => r.mode !== 'car').sort((a, b) => b.metrics.co2Saved - a.metrics.co2Saved)[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header - Mobile optimized */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Compare Transport</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Select route and transport mode</p>
        </div>

        <div className="space-y-4">
          {/* Vehicle Lookup - Collapsible on mobile */}
          <VehicleLookup onVehicleFound={handleVehicleFound} />

          {/* Map - Standing Rectangle */}
          <MapSelector onRouteCalculated={handleRouteCalculated} />

          {/* Transport Selection + Comparison Tabs - Combined */}
          {routeCalculated && allResults.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 flex items-center justify-between">
                  <span>Select Transport Mode</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {distance.toFixed(1)} km
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4">
                {/* Transport Mode Grid - Mobile optimized */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {allResults.map((result) => {
                    const data = TRANSPORT_DATA[result.mode];
                    const isSelected = selectedMode === result.mode;
                    const isMostSustainable = mostSustainable?.mode === result.mode;
                    
                    return (
                      <button
                        key={result.mode}
                        onClick={() => handleModeSelect(result.mode)}
                        className={`relative p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all text-center ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]' 
                            : 'border-slate-200 bg-white hover:border-slate-300 active:scale-95'
                        }`}
                      >
                        {isMostSustainable && result.mode !== 'car' && (
                          <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-emerald-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            BEST
                          </div>
                        )}
                        
                        <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{data.icon}</div>
                        <div className="font-medium text-[10px] sm:text-xs text-slate-800 truncate">{data.label}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500">{result.metrics.travelTime}m</div>
                        <div className={`text-[9px] sm:text-[10px] font-medium ${
                          result.mode === 'car' ? 'text-red-500' : 'text-emerald-600'
                        }`}>
                          {result.mode === 'car' 
                            ? `${result.metrics.co2Emissions.toFixed(1)}kg` 
                            : `-${result.metrics.co2Saved.toFixed(1)}kg`
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Comparison Tabs - Inline with transport selection */}
                {selectedResult && (
                  <Tabs defaultValue="co2" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10 mb-3">
                      <TabsTrigger value="co2" className="text-xs sm:text-sm">CO₂</TabsTrigger>
                      <TabsTrigger value="time" className="text-xs sm:text-sm">Time</TabsTrigger>
                      <TabsTrigger value="calories" className="text-xs sm:text-sm">Calories</TabsTrigger>
                    </TabsList>
                    <TabsContent value="co2" className="mt-0">
                      <ComparisonChart results={allResults} metric="co2" />
                    </TabsContent>
                    <TabsContent value="time" className="mt-0">
                      <ComparisonChart results={allResults} metric="time" />
                    </TabsContent>
                    <TabsContent value="calories" className="mt-0">
                      <ComparisonChart results={allResults} metric="calories" />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          )}

          {/* Impact Summary - Mobile optimized */}
          {selectedResult && (
            <ImpactSummary result={selectedResult} distance={distance} />
          )}
        </div>
      </main>
    </div>
  );
}
