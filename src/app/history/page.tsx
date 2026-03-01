'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TRANSPORT_DATA, TransportMode } from '@/lib/calculations';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HistoryPage() {
  const { status } = useSession();
  const router = useRouter();

  const { data: journeysData, isLoading } = useSWR(
    status === 'authenticated' ? '/api/journeys' : null,
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const journeys = journeysData?.data?.journeys || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <span>📜</span> Journey History
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-base">
            View all your past journeys and their environmental impact.
          </p>
        </div>

        {journeys.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <span className="text-4xl sm:text-6xl mb-4 block">🗺️</span>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No journeys yet</h3>
              <p className="text-muted-foreground text-sm">
                Start logging your journeys to see your history and track your impact!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {journeys.map((journey: any) => {
              const transportData = TRANSPORT_DATA[journey.transportMode as TransportMode];
              const isSustainable = journey.transportMode !== 'car';
              
              return (
                <Card key={journey.id} className={isSustainable ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="text-2xl sm:text-3xl shrink-0">{transportData.icon}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {journey.fromLocation && journey.toLocation 
                              ? `${journey.fromLocation} → ${journey.toLocation}`
                              : `${journey.distance} km journey`}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {transportData.label} • {journey.distance} km • {journey.travelTime} min
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm ml-auto sm:ml-0">
                        <div className="text-center">
                          <div className="font-semibold text-sm sm:text-lg">{journey.co2Saved}</div>
                          <div className="text-muted-foreground text-[10px] sm:text-sm">kg CO₂</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-sm sm:text-lg">{journey.caloriesBurned}</div>
                          <div className="text-muted-foreground text-[10px] sm:text-sm">kcal</div>
                        </div>
                        <div className="text-center text-muted-foreground text-[10px] sm:text-sm">
                          {new Date(journey.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
