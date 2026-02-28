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
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>📜</span> Journey History
          </h1>
          <p className="text-muted-foreground mt-1">
            View all your past journeys and their environmental impact.
          </p>
        </div>

        {journeys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-6xl mb-4 block">🗺️</span>
              <h3 className="text-xl font-semibold mb-2">No journeys yet</h3>
              <p className="text-muted-foreground">
                Start logging your journeys to see your history and track your impact!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey: any) => {
              const transportData = TRANSPORT_DATA[journey.transportMode as TransportMode];
              const isSustainable = journey.transportMode !== 'car';
              
              return (
                <Card key={journey.id} className={isSustainable ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{transportData.icon}</span>
                        <div>
                          <h3 className="font-semibold">
                            {journey.fromLocation && journey.toLocation 
                              ? `${journey.fromLocation} → ${journey.toLocation}`
                              : `${journey.distance} km journey`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {transportData.label} • {journey.distance} km • {journey.travelTime} min
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-lg">{journey.co2Saved}</div>
                          <div className="text-muted-foreground">kg CO2 saved</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-lg">{journey.caloriesBurned}</div>
                          <div className="text-muted-foreground">kcal burned</div>
                        </div>
                        <div className="text-center text-muted-foreground">
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
