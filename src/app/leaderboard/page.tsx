'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { Leaderboard as LeaderboardComponent } from '@/components/gamification/Leaderboard';
import { LeaderboardEntry } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [type, setType] = useState<'co2' | 'calories'>('co2');

  const { data, isLoading } = useSWR(
    `/api/leaderboard?period=${period}&type=${type}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  const entries: LeaderboardEntry[] = data?.data?.leaderboard || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>🏆</span> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            See how you rank against other eco travelers.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <LeaderboardComponent
            entries={entries}
            type={type}
            period={period}
            onPeriodChange={setPeriod}
            onTypeChange={setType}
          />
        </div>
      </main>
    </div>
  );
}
