'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { JourneyInput } from '@/components/journey/JourneyInput';
import { ComparisonChart } from '@/components/comparison/ComparisonChart';
import { MetricsCard } from '@/components/comparison/MetricsCard';
import { ImpactSummary } from '@/components/comparison/ImpactSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransportMode, calculateAllModes, compareWithCar, ComparisonResult } from '@/lib/calculations';

export default function ComparePage() {
  const [distance, setDistance] = useState<number>(10);
  const [selectedMode, setSelectedMode] = useState<TransportMode>('bike');
  const [allResults, setAllResults] = useState<ComparisonResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);

  const handleCalculate = (dist: number, mode: TransportMode) => {
    setDistance(dist);
    setSelectedMode(mode);
    const results = calculateAllModes(dist);
    setAllResults(results);
    const result = results.find(r => r.mode === mode) || null;
    setSelectedResult(result);
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
            See how different transport options compare for your journey.
          </p>
        </div>

        <div className="space-y-8">
          <JourneyInput 
            onCalculate={handleCalculate}
            showSaveButton={false}
          />

          {allResults.length > 0 && (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {allResults.map((result) => (
                  <div
                    key={result.mode}
                    onClick={() => setSelectedResult(result)}
                    className={`cursor-pointer transition-all ${
                      selectedResult?.mode === result.mode 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <MetricsCard
                      title={result.mode.charAt(0).toUpperCase() + result.mode.slice(1)}
                      value={result.metrics.co2Emissions}
                      unit="kg CO2"
                      icon={
                        result.mode === 'car' ? '🚗' :
                        result.mode === 'bus' ? '🚌' :
                        result.mode === 'train' ? '🚆' :
                        result.mode === 'bike' ? '🚲' :
                        result.mode === 'walk' ? '🚶' : '⚡'
                      }
                      comparison={
                        result.mode !== 'car' 
                          ? `${result.metrics.travelTime} min` 
                          : `${result.metrics.travelTime} min`
                      }
                      comparisonColor={result.mode === 'car' ? 'red' : 'green'}
                    />
                  </div>
                ))}
              </div>

              {/* Charts */}
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

              {/* Selected Mode Summary */}
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
