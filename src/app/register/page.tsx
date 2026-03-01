'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, User, Car, Target, Flame } from 'lucide-react';

// Car emission factors (g CO2/km)
const CAR_EMISSION_FACTORS: Record<string, number> = {
  petrol: 171,
  diesel: 171,
  hybrid: 92,
  electric: 0,
};

const dayOptions = [
  { value: 0, label: 'None', emoji: '❌' },
  { value: 1, label: '1 day', emoji: '1️⃣' },
  { value: 2, label: '2 days', emoji: '2️⃣' },
  { value: 3, label: '3 days', emoji: '3️⃣' },
  { value: 4, label: '4 days', emoji: '4️⃣' },
  { value: 5, label: '5 days', emoji: '5️⃣' },
  { value: 6, label: '6 days', emoji: '6️⃣' },
  { value: 7, label: 'Daily', emoji: '🔥' },
];

const fitnessGoals = [
  { value: 'lose_weight', label: 'Lose Weight', emoji: '⚖️', description: 'Burn calories through active transport' },
  { value: 'stay_active', label: 'Stay Active', emoji: '💪', description: 'Maintain regular physical activity' },
  { value: 'build_stamina', label: 'Build Stamina', emoji: '🏃', description: 'Improve endurance over time' },
  { value: 'reduce_carbon', label: 'Eco Focus', emoji: '🌍', description: 'Prioritize eco-friendly travel' },
];

const calorieTargets = [
  { value: 500, label: '500 kcal', description: 'Light' },
  { value: 1000, label: '1,000 kcal', description: 'Moderate' },
  { value: 2000, label: '2,000 kcal', description: 'Active' },
  { value: 3500, label: '3,500 kcal', description: 'Intensive' },
];

const TOTAL_STEPS = 5;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Car details
  const [carPlateNumber, setCarPlateNumber] = useState('');
  const [carType, setCarType] = useState<string>('petrol');
  
  // Step 3: Activity goals
  const [walkingGoal, setWalkingGoal] = useState(2);
  const [cyclingGoal, setCyclingGoal] = useState(2);
  const [publicTransitGoal, setPublicTransitGoal] = useState(1);
  
  // Step 4: Driving limits
  const [maxDrivingDays, setMaxDrivingDays] = useState(3);
  
  // Step 5: Health goals
  const [fitnessGoal, setFitnessGoal] = useState('stay_active');
  const [weeklyCalorieTarget, setWeeklyCalorieTarget] = useState(1000);

  const validateStep = () => {
    setError('');
    
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your name');
        return false;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const carEmissionFactor = CAR_EMISSION_FACTORS[carType] || 171;
      
      // Register user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          carPlateNumber: carPlateNumber || null,
          carType: carType || null,
          carEmissionFactor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Save lifestyle goals
      await fetch('/api/user/lifestyle', {
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

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const DaySelector = ({ value, onChange, label, icon }: { value: number; onChange: (v: number) => void; label: string; icon: string }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <span className="text-lg">{icon}</span>
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {dayOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === option.value
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-1'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  const stepInfo = [
    { icon: User, title: 'Account', desc: 'Your details' },
    { icon: Car, title: 'Vehicle', desc: 'Car info' },
    { icon: Target, title: 'Activity', desc: 'Weekly goals' },
    { icon: Car, title: 'Driving', desc: 'Limits' },
    { icon: Flame, title: 'Health', desc: 'Fitness goals' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 sm:p-4">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <CardHeader className="text-center pb-2 px-3 sm:px-6">
          <Link href="/" className="flex items-center justify-center mb-3">
            <Image src="/logo.png" alt="Eco29" width={140} height={46} className="h-9 sm:h-10 w-auto object-contain" />
          </Link>
          <CardTitle className="text-lg sm:text-xl">{stepInfo[step - 1].title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{stepInfo[step - 1].desc}</CardDescription>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center gap-0.5 sm:gap-1 mt-3 sm:mt-4">
            {stepInfo.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = i + 1 === step;
              const isComplete = i + 1 < step;
              return (
                <div key={i} className="flex items-center">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-emerald-500 text-white scale-110' : 
                    isComplete ? 'bg-emerald-100 text-emerald-600' : 
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {isComplete ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <StepIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                  {i < stepInfo.length - 1 && (
                    <div className={`w-4 sm:w-6 h-0.5 ${isComplete ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-4 px-3 sm:px-6">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Account Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Step 2: Car Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="carPlateNumber">Car Registration (Optional)</Label>
                <Input
                  id="carPlateNumber"
                  placeholder="e.g., AB12 CDE"
                  value={carPlateNumber}
                  onChange={(e) => setCarPlateNumber(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Car Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['petrol', 'diesel', 'hybrid', 'electric'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCarType(type)}
                      disabled={isLoading}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        carType === type
                          ? type === 'electric' 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : type === 'hybrid'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xl mb-1">
                        {type === 'petrol' && '⛽'}
                        {type === 'diesel' && '🛢️'}
                        {type === 'hybrid' && '🔋'}
                        {type === 'electric' && '⚡'}
                      </div>
                      <div className="capitalize">{type}</div>
                      <div className="text-[10px] text-slate-500">{CAR_EMISSION_FACTORS[type]}g CO₂/km</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Activity Goals */}
          {step === 3 && (
            <div className="space-y-5">
              <DaySelector value={walkingGoal} onChange={setWalkingGoal} label="Walking Days" icon="🚶" />
              <DaySelector value={cyclingGoal} onChange={setCyclingGoal} label="Cycling Days" icon="🚲" />
              <DaySelector value={publicTransitGoal} onChange={setPublicTransitGoal} label="Public Transit Days" icon="🚌" />
            </div>
          )}

          {/* Step 4: Driving Limits */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <span className="text-lg">🚗</span>
                Maximum Driving Days Per Week
              </Label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setMaxDrivingDays(days)}
                    className={`p-2 sm:p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      maxDrivingDays === days
                        ? days === 0 
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-1'
                          : 'bg-slate-800 text-white ring-2 ring-slate-800 ring-offset-1'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {days === 0 ? '🌱 0' : days}
                  </button>
                ))}
              </div>
              {maxDrivingDays === 0 && (
                <p className="text-emerald-600 text-sm font-medium bg-emerald-50 p-2 rounded-lg">
                  🎉 Amazing! Going car-free is the best for the planet!
                </p>
              )}
              {maxDrivingDays <= 2 && maxDrivingDays > 0 && (
                <p className="text-emerald-600 text-sm font-medium bg-emerald-50 p-2 rounded-lg">
                  👏 Great goal! Minimal driving makes a big difference.
                </p>
              )}
            </div>
          )}

          {/* Step 5: Health Goals */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Primary Goal</Label>
                <div className="grid grid-cols-2 gap-2">
                  {fitnessGoals.map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => setFitnessGoal(goal.value)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        fitnessGoal === goal.value
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-1'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{goal.emoji}</div>
                      <div className="font-semibold text-sm">{goal.label}</div>
                      <div className={`text-[10px] ${fitnessGoal === goal.value ? 'text-white/80' : 'text-slate-500'}`}>
                        {goal.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Weekly Calorie Target</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {calorieTargets.map((target) => (
                    <button
                      key={target.value}
                      type="button"
                      onClick={() => setWeeklyCalorieTarget(target.value)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        weeklyCalorieTarget === target.value
                          ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-1'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{target.label}</div>
                      <div className={`text-[10px] ${weeklyCalorieTarget === target.value ? 'text-white/80' : 'text-slate-500'}`}>
                        {target.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 text-sm mb-2">Your Weekly Plan:</h4>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg">🚶</div>
                    <div className="font-bold">{walkingGoal}</div>
                    <div className="text-slate-500">Walk</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg">🚲</div>
                    <div className="font-bold">{cyclingGoal}</div>
                    <div className="text-slate-500">Cycle</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg">🚌</div>
                    <div className="font-bold">{publicTransitGoal}</div>
                    <div className="text-slate-500">Transit</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg">🚗</div>
                    <div className="font-bold">≤{maxDrivingDays}</div>
                    <div className="text-slate-500">Drive</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={isLoading} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button onClick={nextStep} disabled={isLoading} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? '⏳ Creating...' : '✨ Complete Signup'}
              </Button>
            )}
          </div>

          {/* Login link */}
          <p className="text-sm text-center text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
