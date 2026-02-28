'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLevel } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface SustainabilityScoreProps {
  score: number;
  className?: string;
}

export function SustainabilityScore({ score, className }: SustainabilityScoreProps) {
  const level = getLevel(score);
  const progress = level.maxScore === Infinity 
    ? 100 
    : ((score - level.minScore) / (level.maxScore - level.minScore)) * 100;

  const nextLevelScore = level.maxScore === Infinity ? score : level.maxScore;
  
  // Calculate stroke for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const levelColors: Record<string, string> = {
    'Eco Beginner': 'from-gray-400 to-gray-500',
    'Green Starter': 'from-lime-400 to-green-500',
    'Climate Conscious': 'from-green-400 to-emerald-500',
    'Eco Warrior': 'from-emerald-400 to-teal-500',
    'Planet Protector': 'from-teal-400 to-cyan-500',
    'Carbon Hero': 'from-cyan-400 to-blue-500',
    'Climate Champion': 'from-blue-400 to-purple-500',
  };

  const gradientClass = levelColors[level.name] || 'from-green-400 to-emerald-500';

  return (
    <Card className={cn("overflow-hidden border-border/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="font-semibold">Eco Score</span>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            "bg-gradient-to-r text-white",
            gradientClass
          )}>
            {level.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Circular Progress */}
        <div className="relative flex items-center justify-center mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted/30"
            />
            {/* Progress circle with gradient */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold gradient-text">{score}</span>
            <span className="text-xs text-muted-foreground">points</span>
          </div>
        </div>

        {/* Level Progress Bar */}
        {level.maxScore !== Infinity && (
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Next Level</span>
              <span className="font-medium">{score} / {nextLevelScore}</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: LeafIcon, label: 'CO2', color: 'text-green-500' },
            { icon: FlameIcon, label: 'Cal', color: 'text-orange-500' },
            { icon: RouteIcon, label: 'Trips', color: 'text-blue-500' },
            { icon: BoltIcon, label: 'Streak', color: 'text-purple-500' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex flex-col items-center p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Icon className={cn("w-5 h-5", item.color)} />
                <span className="text-[10px] text-muted-foreground mt-1">{item.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini icons
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.16 4.16a7.5 7.5 0 0110.678 10.678A7.5 7.5 0 014.16 4.16zm2.475 9.238a.75.75 0 001.015-.26 5.5 5.5 0 016.012-2.42.75.75 0 10.336-1.463 7 7 0 00-7.658 3.108.75.75 0 00.295 1.035z" clipRule="evenodd"/>
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM10 11.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd"/>
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.145c.182-.1.424-.243.705-.423a15.5 15.5 0 002.564-2.203c1.592-1.717 3.116-4.177 3.116-7.151 0-4.142-3.358-7.5-7.5-7.5S2 4.858 2 9c0 2.974 1.524 5.434 3.116 7.151a15.5 15.5 0 002.564 2.203c.28.18.523.323.705.423a5.5 5.5 0 00.3.153l.018.008.006.003z" clipRule="evenodd"/>
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z"/>
    </svg>
  );
}
