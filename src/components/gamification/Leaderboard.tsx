'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  type: 'co2' | 'calories';
  period: 'week' | 'month' | 'all';
  onPeriodChange?: (period: 'week' | 'month' | 'all') => void;
  onTypeChange?: (type: 'co2' | 'calories') => void;
}

export function Leaderboard({ 
  entries, 
  type, 
  period,
  onPeriodChange,
  onTypeChange 
}: LeaderboardProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank.toString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Leaderboard
          </span>
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <div className="flex gap-1">
            {(['week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange?.(p)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  period === p 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['co2', 'calories'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onTypeChange?.(t)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  type === t 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {t === 'co2' ? 'CO2 Saved' : 'Calories'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <span className="text-4xl mb-2 block">📊</span>
            <p>No data available yet. Start logging journeys!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div 
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  entry.isCurrentUser ? "bg-primary/10 border-2 border-primary" : "bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                  getRankStyle(entry.rank)
                )}>
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">
                      {entry.userName}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.journeyCount} journeys
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {type === 'co2' ? entry.co2Saved : entry.caloriesBurned}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {type === 'co2' ? 'kg CO2' : 'kcal'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
