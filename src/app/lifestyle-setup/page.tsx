'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface GoalOption {
  value: number;
  label: string;
  emoji: string;
}

const dayOptions: GoalOption[] = [
  { value: 0, label: 'Not for me', emoji: '❌' },
  { value: 1, label: '1 day', emoji: '1️⃣' },
  { value: 2, label: '2 days', emoji: '2️⃣' },
  { value: 3, label: '3 days', emoji: '3️⃣' },
  { value: 4, label: '4 days', emoji: '4️⃣' },
  { value: 5, label: '5 days', emoji: '5️⃣' },
  { value: 6, label: '6 days', emoji: '6️⃣' },
  { value: 7, label: 'Every day', emoji: '🔥' },
];

const fitnessGoals = [
  { value: 'lose_weight', label: 'Lose Weight', emoji: '⚖️', description: 'Burn calories through active transport' },
  { value: 'stay_active', label: 'Stay Active', emoji: '💪', description: 'Maintain regular physical activity' },
  { value: 'build_stamina', label: 'Build Stamina', emoji: '🏃', description: 'Improve endurance over time' },
  { value: 'reduce_carbon', label: 'Reduce Carbon Footprint', emoji: '🌍', description: 'Focus on eco-friendly travel' },
];

const calorieTargets = [
  { value: 500, label: 'Light (500 kcal/week)', description: 'Gentle start' },
  { value: 1000, label: 'Moderate (1,000 kcal/week)', description: 'Balanced activity' },
  { value: 2000, label: 'Active (2,000 kcal/week)', description: 'Regular exercise' },
  { value: 3500, label: 'Intensive (3,500 kcal/week)', description: 'Serious fitness' },
];

export default function LifestyleSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [walkingGoal, setWalkingGoal] = useState(2);
  const [cyclingGoal, setCyclingGoal] = useState(2);
  const [publicTransitGoal, setPublicTransitGoal] = useState(1);
  const [maxDrivingDays, setMaxDrivingDays] = useState(3);
  const [fitnessGoal, setFitnessGoal] = useState('stay_active');
  const [weeklyCalorieTarget, setWeeklyCalorieTarget] = useState(1000);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walkingGoal,
          cyclingGoal,
          publicTransitGoal,
          maxDrivingDays,
          fitnessGoal,
          weeklyCalorieTarget,
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const DaySelector = ({ 
    value, 
    onChange, 
    label, 
    icon 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
    icon: string;
  }) => (
    <div className="space-y-2 sm:space-y-3">
      <Label className="flex items-center gap-2 text-sm sm:text-lg">
        <span className="text-xl sm:text-2xl">{icon}</span>
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {dayOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              value === option.value
                ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {option.emoji} {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            {step === 1 && '🏃 Set Your Activity Goals'}
            {step === 2 && '🚗 Driving Habits'}
            {step === 3 && '🎯 Health & Fitness Goals'}
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
            {step === 1 && 'How often do you want to use active transport each week?'}
            {step === 2 && 'Help us understand your current driving habits'}
            {step === 3 && 'What are you hoping to achieve?'}
          </p>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s === step ? 'bg-primary w-8' : s < step ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Activity Goals */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Goals</CardTitle>
              <CardDescription>
                Set how many days per week you'd like to use each transport mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DaySelector
                value={walkingGoal}
                onChange={setWalkingGoal}
                label="Walking Days"
                icon="🚶"
              />
              
              <DaySelector
                value={cyclingGoal}
                onChange={setCyclingGoal}
                label="Cycling Days"
                icon="🚲"
              />
              
              <DaySelector
                value={publicTransitGoal}
                onChange={setPublicTransitGoal}
                label="Public Transit Days (Bus/Train)"
                icon="🚌"
              />

              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Continue →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Driving Habits */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Driving Limits</CardTitle>
              <CardDescription>
                Set a maximum number of days you want to drive per week. 
                We'll help you stay accountable!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="flex items-center gap-2 text-sm sm:text-lg">
                  <span className="text-xl sm:text-2xl">🚗</span>
                  Maximum Driving Days Per Week
                </Label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => setMaxDrivingDays(days)}
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        maxDrivingDays === days
                          ? days === 0 
                            ? 'bg-green-500 text-white ring-2 ring-green-500 ring-offset-2'
                            : 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {days === 0 ? '🌱 Zero' : days === 7 ? '7 (No limit)' : `${days} days`}
                    </button>
                  ))}
                </div>
                
                {maxDrivingDays === 0 && (
                  <p className="text-green-600 text-sm font-medium mt-2">
                    🎉 Amazing! Going car-free is the best for the planet!
                  </p>
                )}
                {maxDrivingDays <= 2 && maxDrivingDays > 0 && (
                  <p className="text-green-600 text-sm font-medium mt-2">
                    👏 Great goal! Minimal driving makes a big difference.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Fitness Goals */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Health Goals</CardTitle>
              <CardDescription>
                What's your primary motivation for sustainable travel?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fitness Goal */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-lg">Primary Goal</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fitnessGoals.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setFitnessGoal(goal.value)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        fitnessGoal === goal.value
                          ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="text-2xl mb-1">{goal.emoji}</div>
                      <div className="font-semibold">{goal.label}</div>
                      <div className={`text-xs ${fitnessGoal === goal.value ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {goal.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Calorie Target */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-lg">Weekly Calorie Burn Target</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calorieTargets.map((target) => (
                    <button
                      key={target.value}
                      onClick={() => setWeeklyCalorieTarget(target.value)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        weeklyCalorieTarget === target.value
                          ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-2'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="font-semibold text-sm">{target.label}</div>
                      <div className={`text-xs ${weeklyCalorieTarget === target.value ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {target.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  ← Back
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={saving}
                >
                  {saving ? '⏳ Saving...' : '✨ Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Preview */}
        {step === 3 && (
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-green-800 mb-2 sm:mb-3 text-sm">Your Weekly Plan:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center text-sm">
                <div className="bg-white rounded-lg p-2">
                  <div className="text-xl">🚶</div>
                  <div className="font-bold">{walkingGoal}</div>
                  <div className="text-xs text-gray-500">Walk days</div>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-xl">🚲</div>
                  <div className="font-bold">{cyclingGoal}</div>
                  <div className="text-xs text-gray-500">Cycle days</div>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-xl">🚌</div>
                  <div className="font-bold">{publicTransitGoal}</div>
                  <div className="text-xs text-gray-500">Transit days</div>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-xl">🚗</div>
                  <div className="font-bold">≤{maxDrivingDays}</div>
                  <div className="text-xs text-gray-500">Max car days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip button */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip for now, I'll set this up later
          </button>
        </div>
      </div>
    </div>
  );
}
