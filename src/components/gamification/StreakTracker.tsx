'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak?: number;
}

export function StreakTracker({ currentStreak, longestStreak = 0 }: StreakTrackerProps) {
  const streakDays = Array.from({ length: 7 }, (_, i) => i < currentStreak);
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Sustainable Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-5xl font-bold text-orange-500">{currentStreak}</span>
          <span className="text-xl text-muted-foreground ml-2">days</span>
        </div>

        <div className="flex justify-center gap-2">
          {streakDays.map((active, i) => (
            <div key={i} className="text-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                  ${active 
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' 
                    : 'bg-gray-100 text-gray-400'
                  }`}
              >
                {active ? '🔥' : dayLabels[i]}
              </div>
              <span className="text-xs text-muted-foreground">{dayLabels[i]}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm pt-2 border-t">
          <div>
            <span className="text-muted-foreground">Current</span>
            <span className="ml-2 font-semibold">{currentStreak} days</span>
          </div>
          <div>
            <span className="text-muted-foreground">Best</span>
            <span className="ml-2 font-semibold">{Math.max(currentStreak, longestStreak)} days</span>
          </div>
        </div>

        {currentStreak >= 3 && (
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <span className="text-orange-700 text-sm font-medium">
              {currentStreak >= 7 
                ? '🎉 Amazing! You\'re a streak master!' 
                : currentStreak >= 3 
                  ? '👏 Great job! Keep going!' 
                  : 'Start your streak today!'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
