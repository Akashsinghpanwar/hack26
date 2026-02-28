'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getLevel } from '@/lib/calculations';

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

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Sustainability Score
          </span>
          <span className="text-sm font-normal text-muted-foreground">Level: {level.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            {score}
          </span>
          <span className="text-xl text-muted-foreground ml-2">pts</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{level.name}</span>
            {level.maxScore !== Infinity && (
              <span className="text-muted-foreground">{score} / {nextLevelScore}</span>
            )}
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">🌍</div>
            <div className="text-xs text-muted-foreground">CO2</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">🔥</div>
            <div className="text-xs text-muted-foreground">Fitness</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">🚀</div>
            <div className="text-xs text-muted-foreground">Trips</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">⚡</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
