'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import MapSelector from '@/components/journey/MapSelectorWrapper';
import { TransportSelector } from '@/components/journey/TransportSelector';
import { MetricsCard } from '@/components/comparison/MetricsCard';
import { ImpactSummary } from '@/components/comparison/ImpactSummary';
import { SustainabilityScore } from '@/components/gamification/SustainabilityScore';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransportMode, compareWithCar, ComparisonResult, calculateMetrics } from '@/lib/calculations';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<TransportMode>('bike');
  const [routeReady, setRouteReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: stats, mutate: mutateStats } = useSWR(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleRouteCalculated = (dist: number, from: string, to: string) => {
    setDistance(dist);
    setFromLocation(from);
    setToLocation(to);
    setRouteReady(true);
    
    // Calculate for selected mode
    const result = compareWithCar(dist, selectedMode);
    setComparisonResult(result);
  };

  const handleModeSelect = (mode: TransportMode) => {
    setSelectedMode(mode);
    if (distance > 0) {
      const result = compareWithCar(distance, mode);
      setComparisonResult(result);
    }
  };

  const handleSaveJourney = async () => {
    if (!routeReady || distance <= 0) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance,
          transportMode: selectedMode,
          fromLocation,
          toLocation
        }),
      });

      if (response.ok) {
        mutateStats();
        alert('Journey saved successfully! Check your history.');
        // Reset for new journey
        setRouteReady(false);
        setComparisonResult(null);
        setDistance(0);
      }
    } catch (error) {
      console.error('Error saving journey:', error);
      alert('Failed to save journey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userStats = stats?.data;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, {session?.user?.name || 'Eco Traveler'}! 🌱
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your sustainable travel and make a difference.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Total Journeys"
            value={userStats?.totalJourneys || 0}
            unit="trips"
            icon="🚀"
          />
          <MetricsCard
            title="CO2 Saved"
            value={userStats?.totalCo2Saved || 0}
            unit="kg"
            icon="🌍"
            comparison={userStats?.totalCo2Saved > 0 ? 'vs driving' : undefined}
            comparisonColor="green"
          />
          <MetricsCard
            title="Calories Burned"
            value={userStats?.totalCaloriesBurned || 0}
            unit="kcal"
            icon="🔥"
          />
          <MetricsCard
            title="Distance"
            value={userStats?.totalDistance || 0}
            unit="km"
            icon="📍"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Selector */}
            <MapSelector onRouteCalculated={handleRouteCalculated} />

            {/* Transport Mode Selection */}
            {routeReady && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">🚀</span>
                      How will you travel?
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {fromLocation} → {toLocation}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TransportSelector
                    selected={selectedMode}
                    onSelect={handleModeSelect}
                  />
                  <Button 
                    onClick={handleSaveJourney}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">💾</span>
                        Save This Journey
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Impact Summary */}
            {comparisonResult && (
              <ImpactSummary result={comparisonResult} distance={distance} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SustainabilityScore score={userStats?.sustainabilityScore || 0} />
            <StreakTracker 
              currentStreak={userStats?.currentStreak || 0}
              longestStreak={userStats?.currentStreak || 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
