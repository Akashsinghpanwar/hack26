'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import MapSelector from '@/components/journey/MapSelectorWrapper';
import { TransportSelector } from '@/components/journey/TransportSelector';
import { ComparisonChart } from '@/components/comparison/ComparisonChart';
import { MetricsCard } from '@/components/comparison/MetricsCard';
import { ImpactSummary } from '@/components/comparison/ImpactSummary';
import { EcoRecommendation } from '@/components/comparison/EcoRecommendation';
import { HybridJourneyPlanner } from '@/components/comparison/HybridJourneyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransportMode, calculateAllModes, ComparisonResult, TRANSPORT_DATA } from '@/lib/calculations';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ComparePage() {
  const { data: session, status } = useSession();
  const [distance, setDistance] = useState<number>(0);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<TransportMode>('bike');
  const [allResults, setAllResults] = useState<ComparisonResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [routeCalculated, setRouteCalculated] = useState(false);

  // Fetch user stats including lifestyle goals
  const { data: stats } = useSWR(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher
  );

  const userGoals = stats?.data?.lifestyleGoals;

  const handleRouteCalculated = (dist: number, from: string, to: string) => {
    setDistance(dist);
    setFromLocation(from);
    setToLocation(to);
    setRouteCalculated(true);
    
    // Calculate all transport modes for this distance
    const results = calculateAllModes(dist);
    setAllResults(results);
    
    // Set selected result based on current mode
    const result = results.find(r => r.mode === selectedMode) || null;
    setSelectedResult(result);
  };

  const handleModeSelect = (mode: TransportMode) => {
    setSelectedMode(mode);
    if (allResults.length > 0) {
      const result = allResults.find(r => r.mode === mode) || null;
      setSelectedResult(result);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>⚖️</span> Compare Transport Modes
          </h1>
          <p className="text-muted-foreground mt-1">
            Select your route on the map and compare different transport options.
          </p>
        </div>

        <div className="space-y-8">
          {/* Map Selector */}
          <MapSelector onRouteCalculated={handleRouteCalculated} />

          {/* Hybrid Journey Planner - Show for longer distances */}
          {routeCalculated && distance >= 3 && (
            <HybridJourneyPlanner
              distance={distance}
              userGoals={userGoals}
            />
          )}

          {/* Eco Recommendations - Show immediately after route is calculated */}
          {allResults.length > 0 && (
            <EcoRecommendation
              results={allResults}
              distance={distance}
              onSelectMode={handleModeSelect}
              currentMode={selectedMode}
            />
          )}

          {/* Transport Mode Selection - Show after route is calculated */}
          {routeCalculated && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    Select Your Transport Mode
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {fromLocation} → {toLocation} ({distance} km)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransportSelector
                  selected={selectedMode}
                  onSelect={handleModeSelect}
                />
              </CardContent>
            </Card>
          )}

          {allResults.length > 0 && (
            <>
              {/* Quick Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {allResults.map((result) => {
                  const transportData = TRANSPORT_DATA[result.mode];
                  return (
                    <div
                      key={result.mode}
                      onClick={() => handleModeSelect(result.mode)}
                      className={`cursor-pointer transition-all ${
                        selectedResult?.mode === result.mode 
                          ? 'ring-2 ring-primary ring-offset-2 scale-105' 
                          : 'hover:shadow-lg hover:scale-102'
                      }`}
                    >
                      <MetricsCard
                        title={transportData.label}
                        value={result.metrics.co2Emissions}
                        unit="kg CO2"
                        icon={transportData.icon}
                        comparison={`${result.metrics.travelTime} min`}
                        comparisonColor={result.mode === 'car' ? 'red' : 'green'}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Detailed Charts */}
              <Tabs defaultValue="co2" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="co2">CO2 Emissions</TabsTrigger>
                  <TabsTrigger value="time">Travel Time</TabsTrigger>
                  <TabsTrigger value="calories">Calories</TabsTrigger>
                </TabsList>
                <TabsContent value="co2" className="mt-4">
                  <ComparisonChart results={allResults} metric="co2" />
                </TabsContent>
                <TabsContent value="time" className="mt-4">
                  <ComparisonChart results={allResults} metric="time" />
                </TabsContent>
                <TabsContent value="calories" className="mt-4">
                  <ComparisonChart results={allResults} metric="calories" />
                </TabsContent>
              </Tabs>

              {/* Selected Mode Impact Summary */}
              {selectedResult && (
                <ImpactSummary result={selectedResult} distance={distance} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
