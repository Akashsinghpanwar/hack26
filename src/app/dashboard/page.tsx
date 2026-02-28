'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { JourneyInput } from '@/components/journey/JourneyInput';
import { MetricsCard } from '@/components/comparison/MetricsCard';
import { ImpactSummary } from '@/components/comparison/ImpactSummary';
import { SustainabilityScore } from '@/components/gamification/SustainabilityScore';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { TransportMode, compareWithCar, ComparisonResult } from '@/lib/calculations';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [distance, setDistance] = useState<number>(10);

  const { data: stats, mutate: mutateStats } = useSWR(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCalculate = (dist: number, mode: TransportMode) => {
    setDistance(dist);
    const result = compareWithCar(dist, mode);
    setComparisonResult(result);
  };

  const handleSaveJourney = async (dist: number, mode: TransportMode, from?: string, to?: string) => {
    try {
      const response = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance: dist,
          transportMode: mode,
          fromLocation: from,
          toLocation: to
        }),
      });

      if (response.ok) {
        mutateStats();
        alert('Journey saved successfully!');
      }
    } catch (error) {
      console.error('Error saving journey:', error);
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
            <JourneyInput 
              onCalculate={handleCalculate}
              onSave={handleSaveJourney}
            />

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
