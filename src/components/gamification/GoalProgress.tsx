'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WeeklyProgress {
  walkingDays: number;
  cyclingDays: number;
  transitDays: number;
  drivingDays: number;
  caloriesBurned: number;
}

interface LifestyleGoals {
  walkingGoal: number;
  cyclingGoal: number;
  publicTransitGoal: number;
  maxDrivingDays: number;
  weeklyCalorieTarget: number;
  fitnessGoal: string;
}

interface GoalProgressProps {
  goals: LifestyleGoals | null;
  progress: WeeklyProgress;
}

const fitnessGoalLabels: Record<string, { label: string; emoji: string }> = {
  lose_weight: { label: 'Lose Weight', emoji: '⚖️' },
  stay_active: { label: 'Stay Active', emoji: '💪' },
  build_stamina: { label: 'Build Stamina', emoji: '🏃' },
  reduce_carbon: { label: 'Reduce Carbon', emoji: '🌍' },
};

export function GoalProgress({ goals, progress }: GoalProgressProps) {
  if (!goals || !goals.walkingGoal && !goals.cyclingGoal && !goals.publicTransitGoal) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="font-semibold text-lg mb-2">Set Your Goals</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Set up your weekly activity goals to track your progress
          </p>
          <a
            href="/lifestyle-setup"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Set Up Goals →
          </a>
        </CardContent>
      </Card>
    );
  }

  const calculateProgress = (current: number, goal: number) => {
    if (goal === 0) return 100;
    return Math.min((current / goal) * 100, 100);
  };

  const GoalRing = ({ 
    current, 
    goal, 
    label, 
    icon,
    color 
  }: { 
    current: number; 
    goal: number; 
    label: string;
    icon: string;
    color: string;
  }) => {
    const percentage = calculateProgress(current, goal);
    const isComplete = current >= goal;
    
    return (
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-2">
          {/* Background circle */}
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={isComplete ? '#22c55e' : color}
              strokeWidth="6"
              strokeDasharray={`${(percentage / 100) * 176} 176`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">{isComplete ? '✓' : icon}</span>
          </div>
        </div>
        <div className="font-semibold text-sm">
          {current}/{goal}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    );
  };

  const DrivingIndicator = () => {
    const drivingOk = progress.drivingDays <= goals.maxDrivingDays;
    const percentage = goals.maxDrivingDays > 0 
      ? Math.min((progress.drivingDays / goals.maxDrivingDays) * 100, 100)
      : progress.drivingDays > 0 ? 100 : 0;
    
    return (
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-2">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={drivingOk ? '#22c55e' : '#ef4444'}
              strokeWidth="6"
              strokeDasharray={`${(percentage / 100) * 176} 176`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">{drivingOk ? '🚗' : '⚠️'}</span>
          </div>
        </div>
        <div className={`font-semibold text-sm ${drivingOk ? '' : 'text-red-500'}`}>
          {progress.drivingDays}/{goals.maxDrivingDays}
        </div>
        <div className="text-xs text-muted-foreground">Max Driving</div>
      </div>
    );
  };

  const calorieProgress = calculateProgress(progress.caloriesBurned, goals.weeklyCalorieTarget);
  const fitnessGoalInfo = fitnessGoalLabels[goals.fitnessGoal] || fitnessGoalLabels.stay_active;

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>🎯</span> Weekly Goals
          </span>
          <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
            {fitnessGoalInfo.emoji} {fitnessGoalInfo.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Rings */}
        <div className="grid grid-cols-4 gap-2">
          {goals.walkingGoal > 0 && (
            <GoalRing
              current={progress.walkingDays}
              goal={goals.walkingGoal}
              label="Walk"
              icon="🚶"
              color="#10b981"
            />
          )}
          {goals.cyclingGoal > 0 && (
            <GoalRing
              current={progress.cyclingDays}
              goal={goals.cyclingGoal}
              label="Cycle"
              icon="🚲"
              color="#06b6d4"
            />
          )}
          {goals.publicTransitGoal > 0 && (
            <GoalRing
              current={progress.transitDays}
              goal={goals.publicTransitGoal}
              label="Transit"
              icon="🚌"
              color="#f59e0b"
            />
          )}
          <DrivingIndicator />
        </div>

        {/* Calorie Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <span>🔥</span> Weekly Calories
            </span>
            <span className="font-semibold">
              {progress.caloriesBurned.toLocaleString()} / {goals.weeklyCalorieTarget.toLocaleString()} kcal
            </span>
          </div>
          <Progress value={calorieProgress} className="h-3" />
          {calorieProgress >= 100 && (
            <p className="text-xs text-green-600 font-medium text-center">
              🎉 Weekly calorie goal achieved!
            </p>
          )}
        </div>

        {/* Quick Summary */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          {progress.walkingDays + progress.cyclingDays + progress.transitDays === 0 ? (
            <span>Start tracking your journeys to see progress!</span>
          ) : (
            <span>
              Active {progress.walkingDays + progress.cyclingDays + progress.transitDays} days this week • 
              {progress.drivingDays <= goals.maxDrivingDays ? ' On track! 💪' : ' Try to reduce driving 🚗'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
