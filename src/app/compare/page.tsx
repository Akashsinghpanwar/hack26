'use client';

import { useState, useCallback, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import MapSelector from '@/components/journey/MapSelectorWrapper';
import { ImpactSummary } from '@/components/comparison/ImpactSummary';
import { VehicleLookup } from '@/components/comparison/VehicleLookup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransportMode, calculateAllModes, calculateAllModesWithCustomCar, ComparisonResult, TRANSPORT_DATA } from '@/lib/calculations';

type SortCriteria = 'co2' | 'time' | 'calories';

const SORT_OPTIONS: { value: SortCriteria; label: string; icon: string; description: string }[] = [
  { value: 'co2', label: 'CO₂ Saved', icon: '🌍', description: 'Most eco-friendly first' },
  { value: 'time', label: 'Travel Time', icon: '⏱️', description: 'Fastest first' },
  { value: 'calories', label: 'Calories Burned', icon: '🔥', description: 'Most active first' },
];

export default function ComparePage() {
  const [distance, setDistance] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
  const [allResults, setAllResults] = useState<ComparisonResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [customCarCo2, setCustomCarCo2] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortCriteria>('co2');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRouteCalculated = useCallback((dist: number, from: string, to: string, destinationLat?: number, destinationLon?: number) => {
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

  // Sort results based on selected criteria
  const sortedResults = useMemo(() => {
    if (allResults.length === 0) return [];
    const sorted = [...allResults];
    switch (sortBy) {
      case 'co2':
        // Best = most CO2 saved (lowest emissions)
        sorted.sort((a, b) => a.metrics.co2Emissions - b.metrics.co2Emissions);
        break;
      case 'time':
        // Best = fastest
        sorted.sort((a, b) => a.metrics.travelTime - b.metrics.travelTime);
        break;
      case 'calories':
        // Best = most calories burned
        sorted.sort((a, b) => b.metrics.caloriesBurned - a.metrics.caloriesBurned);
        break;
    }
    return sorted;
  }, [allResults, sortBy]);

  const getMetricValue = (result: ComparisonResult): { value: string; label: string; color: string } => {
    switch (sortBy) {
      case 'co2':
        return result.mode === 'car'
          ? { value: `${result.metrics.co2Emissions.toFixed(2)} kg`, label: 'CO₂ emitted', color: 'text-red-600' }
          : { value: `${result.metrics.co2Saved.toFixed(2)} kg`, label: 'CO₂ saved', color: 'text-emerald-600' };
      case 'time':
        return { value: `${result.metrics.travelTime} min`, label: 'travel time', color: 'text-sky-600' };
      case 'calories':
        return { value: `${result.metrics.caloriesBurned} kcal`, label: 'burned', color: 'text-orange-600' };
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { text: '🥇 BEST', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (index === 1) return { text: '🥈 2nd', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (index === 2) return { text: '🥉 3rd', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { text: `#${index + 1}`, bg: 'bg-slate-50 text-slate-500 border-slate-200' };
  };

  const currentSortOption = SORT_OPTIONS.find(o => o.value === sortBy)!;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Compare Transport</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Select route and transport mode</p>
        </div>

        <div className="space-y-4">
          <VehicleLookup onVehicleFound={handleVehicleFound} />
          <MapSelector onRouteCalculated={handleRouteCalculated} />

          {/* Transport Selection - Sorted List */}
          {routeCalculated && allResults.length > 0 && (
            <Card className="border-0 shadow-sm overflow-visible">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 flex items-center justify-between">
                  <span>Select Transport Mode</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {distance.toFixed(1)} km
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4">
                {/* Sort Dropdown */}
                <div className="mb-4 relative">
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Sort by</label>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{currentSortOption.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-slate-800">{currentSortOption.label}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">{currentSortOption.description}</div>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value); setDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${
                              sortBy === option.value
                                ? 'bg-emerald-50 border-l-4 border-emerald-500'
                                : 'hover:bg-slate-50 border-l-4 border-transparent'
                            }`}
                          >
                            <span className="text-lg">{option.icon}</span>
                            <div>
                              <div className={`text-sm font-medium ${sortBy === option.value ? 'text-emerald-700' : 'text-slate-700'}`}>{option.label}</div>
                              <div className="text-[10px] sm:text-xs text-slate-400">{option.description}</div>
                            </div>
                            {sortBy === option.value && (
                              <svg className="w-4 h-4 text-emerald-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Ranked Transport Mode List */}
                <div className="space-y-2">
                  {sortedResults.map((result, index) => {
                    const data = TRANSPORT_DATA[result.mode];
                    const isSelected = selectedMode === result.mode;
                    const metric = getMetricValue(result);
                    const rank = getRankBadge(index);

                    return (
                      <button
                        key={result.mode}
                        onClick={() => handleModeSelect(result.mode)}
                        className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-md'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm active:scale-[0.99]'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`shrink-0 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg border ${rank.bg}`}>
                          {rank.text}
                        </div>

                        {/* Icon */}
                        <div className="text-2xl sm:text-3xl shrink-0">{data.icon}</div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-slate-800">{data.label}</div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400 mt-0.5">
                            <span>⏱ {result.metrics.travelTime}m</span>
                            <span>🌍 {result.metrics.co2Emissions.toFixed(2)}kg</span>
                            <span>🔥 {result.metrics.caloriesBurned}kcal</span>
                          </div>
                        </div>

                        {/* Primary Metric */}
                        <div className="shrink-0 text-right">
                          <div className={`text-base sm:text-lg font-bold ${metric.color}`}>{metric.value}</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400">{metric.label}</div>
                        </div>
                      </button>
                    );
                  })}

                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact Summary */}
          {selectedResult && (
            <ImpactSummary result={selectedResult} distance={distance} />
          )}
        </div>
      </main>
    </div>
  );
}
