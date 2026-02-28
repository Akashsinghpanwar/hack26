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
import { EcoRecommendation } from '@/components/comparison/EcoRecommendation';
import { HybridJourneyPlanner } from '@/components/comparison/HybridJourneyPlanner';
import { SustainabilityScore } from '@/components/gamification/SustainabilityScore';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { GoalProgress } from '@/components/gamification/GoalProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransportMode, compareWithCar, ComparisonResult, calculateMetrics, calculateAllModes, TRANSPORT_DATA } from '@/lib/calculations';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Transport Mode Selection Modal
function TransportModeModal({ 
  isOpen, 
  onSelect, 
  distance,
  fromLocation,
  toLocation 
}: { 
  isOpen: boolean; 
  onSelect: (mode: TransportMode) => void;
  distance: number;
  fromLocation: string;
  toLocation: string;
}) {
  if (!isOpen) return null;

  const modes: { mode: TransportMode; label: string; icon: string; color: string; desc: string }[] = [
    { mode: 'car', label: 'Car', icon: '🚗', color: 'from-red-500 to-red-600', desc: 'Drove myself' },
    { mode: 'bus', label: 'Bus', icon: '🚌', color: 'from-amber-500 to-amber-600', desc: 'Public bus' },
    { mode: 'train', label: 'Train', icon: '🚆', color: 'from-yellow-500 to-yellow-600', desc: 'Train/Metro' },
    { mode: 'bike', label: 'Bicycle', icon: '🚲', color: 'from-green-500 to-green-600', desc: 'Pedal power' },
    { mode: 'walk', label: 'Walk', icon: '🚶', color: 'from-blue-500 to-blue-600', desc: 'On foot' },
    { mode: 'ebike', label: 'E-Bike', icon: '⚡', color: 'from-cyan-500 to-cyan-600', desc: 'Electric bike' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-xl">🎯</span>
            How did you travel?
          </h2>
          <p className="mt-2 text-emerald-100">
            {fromLocation} → {toLocation} ({distance.toFixed(1)} km)
          </p>
        </div>
        
        {/* Mode Grid */}
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4 text-center">
            Select the transport mode you used for this journey
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {modes.map(({ mode, label, icon, color, desc }) => (
              <button
                key={mode}
                onClick={() => onSelect(mode)}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-transparent hover:shadow-lg transition-all duration-200`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 rounded-xl transition-opacity`} />
                <span className="relative text-3xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="relative font-semibold text-slate-700 group-hover:text-white">{label}</span>
                <span className="relative text-xs text-slate-400 group-hover:text-white/80">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [allResults, setAllResults] = useState<ComparisonResult[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
  const [routeReady, setRouteReady] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);

  const { data: stats, mutate: mutateStats } = useSWR(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleRouteCalculated = (dist: number, from: string, to: string, destLat?: number, destLon?: number) => {
    setDistance(dist);
    setFromLocation(from);
    setToLocation(to);
    setRouteReady(true);
    
    // Store destination coordinates for parking finder
    if (destLat && destLon) {
      setDestCoords({ lat: destLat, lon: destLon });
    }
    
    // Calculate all modes for recommendations
    const results = calculateAllModes(dist);
    setAllResults(results);
    
    // Show modal to ask transport mode
    setShowModeModal(true);
  };

  const handleModeSelect = (mode: TransportMode) => {
    setSelectedMode(mode);
    setShowModeModal(false);
    
    if (distance > 0) {
      const result = compareWithCar(distance, mode);
      setComparisonResult(result);
    }
  };

  const handleSaveJourney = async () => {
    if (!routeReady || distance <= 0 || !selectedMode) return;
    
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
        setSelectedMode(null);
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
      
      {/* Transport Mode Selection Modal */}
      <TransportModeModal
        isOpen={showModeModal}
        onSelect={handleModeSelect}
        distance={distance}
        fromLocation={fromLocation}
        toLocation={toLocation}
      />
      
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

            {/* Hybrid Journey Planner - Smart Split Options */}
            {routeReady && distance >= 3 && (
              <HybridJourneyPlanner
                distance={distance}
                destinationLat={destCoords?.lat}
                destinationLon={destCoords?.lon}
                userGoals={userStats?.lifestyleGoals}
              />
            )}

            {/* Eco Recommendations - Show immediately after route is calculated */}
            {allResults.length > 0 && (
              <EcoRecommendation
                results={allResults}
                distance={distance}
                onSelectMode={handleModeSelect}
                currentMode={selectedMode || undefined}
              />
            )}

            {/* Transport Mode Selection */}
            {routeReady && selectedMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">🚀</span>
                      Your Travel Mode
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
            <GoalProgress 
              goals={userStats?.lifestyleGoals || null}
              progress={userStats?.weeklyProgress || {
                walkingDays: 0,
                cyclingDays: 0,
                transitDays: 0,
                drivingDays: 0,
                caloriesBurned: 0,
              }}
            />
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
