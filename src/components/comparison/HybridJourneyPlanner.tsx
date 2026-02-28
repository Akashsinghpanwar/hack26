'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TRANSPORT_DATA, TransportMode } from '@/lib/calculations';
import { ParkingFinder } from '@/components/journey/ParkingFinder';

interface HybridPlan {
  id: string;
  name: string;
  description: string;
  segments: {
    mode: TransportMode;
    distance: number;
    percentage: number;
  }[];
  totalCo2: number;
  totalCalories: number;
  totalTime: number;
  co2Saved: number;
  badge: string;
  recommended?: boolean;
}

interface HybridJourneyPlannerProps {
  distance: number;
  destinationLat?: number;
  destinationLon?: number;
  userGoals?: {
    walkingGoal: number;
    cyclingGoal: number;
    fitnessGoal?: string;
  } | null;
  onSelectPlan?: (plan: HybridPlan) => void;
}

export function HybridJourneyPlanner({ distance, destinationLat, destinationLon, userGoals, onSelectPlan }: HybridJourneyPlannerProps) {
  const [showParking, setShowParking] = useState(false);
  
  // Don't show for very short distances (walk/bike is better)
  if (distance < 3) return null;

  // Calculate hybrid plans based on distance
  const generateHybridPlans = (): HybridPlan[] => {
    const plans: HybridPlan[] = [];
    const carCo2 = distance * TRANSPORT_DATA.car.co2PerKm;

    // Plan 1: Park & Walk (Drive 70%, Walk 30%)
    if (distance >= 3 && distance <= 15) {
      const walkDist = Math.min(distance * 0.3, 2); // Max 2km walk
      const driveDist = distance - walkDist;
      const co2 = driveDist * TRANSPORT_DATA.car.co2PerKm;
      const calories = walkDist * TRANSPORT_DATA.walk.calPerKm;
      const time = (driveDist / TRANSPORT_DATA.car.speed + walkDist / TRANSPORT_DATA.walk.speed) * 60;


      plans.push({
        id: 'park-walk',
        name: 'Park & Walk',
        description: `Drive ${driveDist.toFixed(1)}km, then walk the last ${walkDist.toFixed(1)}km`,
        segments: [
          { mode: 'car', distance: driveDist, percentage: Math.round((driveDist / distance) * 100) },
          { mode: 'walk', distance: walkDist, percentage: Math.round((walkDist / distance) * 100) },
        ],
        totalCo2: Math.round(co2 * 100) / 100,
        totalCalories: Math.round(calories),
        totalTime: Math.round(time),
        co2Saved: Math.round((carCo2 - co2) * 100) / 100,
        badge: 'Active Finish',
        recommended: Boolean(userGoals?.walkingGoal && userGoals.walkingGoal > 0),
      });
    }

    // Plan 2: Park & Bike (Drive 50%, Bike 50%)
    if (distance >= 5 && distance <= 25) {
      const bikeDist = Math.min(distance * 0.5, 8); // Max 8km bike
      const driveDist = distance - bikeDist;
      const co2 = driveDist * TRANSPORT_DATA.car.co2PerKm;
      const calories = bikeDist * TRANSPORT_DATA.bike.calPerKm;
      const time = (driveDist / TRANSPORT_DATA.car.speed + bikeDist / TRANSPORT_DATA.bike.speed) * 60;

      plans.push({
        id: 'park-bike',
        name: 'Park & Bike',
        description: `Drive ${driveDist.toFixed(1)}km, then cycle ${bikeDist.toFixed(1)}km`,
        segments: [
          { mode: 'car', distance: driveDist, percentage: Math.round((driveDist / distance) * 100) },
          { mode: 'bike', distance: bikeDist, percentage: Math.round((bikeDist / distance) * 100) },
        ],
        totalCo2: Math.round(co2 * 100) / 100,
        totalCalories: Math.round(calories),
        totalTime: Math.round(time),
        co2Saved: Math.round((carCo2 - co2) * 100) / 100,
        badge: 'Fitness Boost',
        recommended: Boolean(userGoals?.cyclingGoal && userGoals.cyclingGoal > 0),
      });
    }

    // Plan 3: Transit + Walk (Bus/Train + Walk last mile)
    if (distance >= 5) {
      const walkDist = Math.min(1.5, distance * 0.15); // ~1.5km walk or 15%
      const transitDist = distance - walkDist;
      const transitMode: TransportMode = distance > 15 ? 'train' : 'bus';
      const co2 = transitDist * TRANSPORT_DATA[transitMode].co2PerKm;
      const calories = walkDist * TRANSPORT_DATA.walk.calPerKm;
      const time = (transitDist / TRANSPORT_DATA[transitMode].speed + walkDist / TRANSPORT_DATA.walk.speed) * 60;

      plans.push({
        id: 'transit-walk',
        name: `${transitMode === 'train' ? 'Train' : 'Bus'} + Walk`,
        description: `Take ${transitMode} ${transitDist.toFixed(1)}km, walk ${walkDist.toFixed(1)}km`,
        segments: [
          { mode: transitMode, distance: transitDist, percentage: Math.round((transitDist / distance) * 100) },
          { mode: 'walk', distance: walkDist, percentage: Math.round((walkDist / distance) * 100) },
        ],
        totalCo2: Math.round(co2 * 100) / 100,
        totalCalories: Math.round(calories),
        totalTime: Math.round(time),
        co2Saved: Math.round((carCo2 - co2) * 100) / 100,
        badge: 'Eco Hero',
      });
    }

    // Plan 4: Run Commute (for fitness enthusiasts)
    if (distance >= 3 && distance <= 10 && userGoals?.fitnessGoal === 'build_stamina') {
      const runDist = Math.min(distance * 0.4, 5); // Max 5km run
      const driveDist = distance - runDist;
      const co2 = driveDist * TRANSPORT_DATA.car.co2PerKm;
      const calories = runDist * 70; // ~70 cal/km running
      const time = (driveDist / TRANSPORT_DATA.car.speed + runDist / 8) * 60; // 8km/h running

      plans.push({
        id: 'park-run',
        name: 'Park & Run',
        description: `Drive ${driveDist.toFixed(1)}km, then run ${runDist.toFixed(1)}km`,
        segments: [
          { mode: 'car', distance: driveDist, percentage: Math.round((driveDist / distance) * 100) },
          { mode: 'walk', distance: runDist, percentage: Math.round((runDist / distance) * 100) },
        ],
        totalCo2: Math.round(co2 * 100) / 100,
        totalCalories: Math.round(calories),
        totalTime: Math.round(time),
        co2Saved: Math.round((carCo2 - co2) * 100) / 100,
        badge: 'Cardio Commute',
        recommended: true,
      });
    }

    // Plan 5: E-bike Express (fast and eco)
    if (distance >= 5 && distance <= 20) {
      const ebikeDist = Math.min(distance * 0.6, 12);
      const driveDist = distance - ebikeDist;
      const co2 = driveDist * TRANSPORT_DATA.car.co2PerKm + ebikeDist * TRANSPORT_DATA.ebike.co2PerKm;
      const calories = ebikeDist * TRANSPORT_DATA.ebike.calPerKm;
      const time = (driveDist / TRANSPORT_DATA.car.speed + ebikeDist / TRANSPORT_DATA.ebike.speed) * 60;

      plans.push({
        id: 'park-ebike',
        name: 'Park & E-bike',
        description: `Drive ${driveDist.toFixed(1)}km, e-bike ${ebikeDist.toFixed(1)}km`,
        segments: [
          { mode: 'car', distance: driveDist, percentage: Math.round((driveDist / distance) * 100) },
          { mode: 'ebike', distance: ebikeDist, percentage: Math.round((ebikeDist / distance) * 100) },
        ],
        totalCo2: Math.round(co2 * 100) / 100,
        totalCalories: Math.round(calories),
        totalTime: Math.round(time),
        co2Saved: Math.round((carCo2 - co2) * 100) / 100,
        badge: 'Speed + Eco',
      });
    }

    // Sort by recommendation and CO2 saved
    return plans.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return b.co2Saved - a.co2Saved;
    });
  };

  const plans = generateHybridPlans();

  if (plans.length === 0) return null;

  const modeColors: Record<TransportMode, string> = {
    car: 'bg-rose-500',
    bus: 'bg-amber-500',
    train: 'bg-yellow-500',
    bike: 'bg-emerald-500',
    walk: 'bg-green-500',
    ebike: 'bg-cyan-500',
  };

  const modeLabels: Record<TransportMode, string> = {
    car: 'Drive',
    bus: 'Bus',
    train: 'Train',
    bike: 'Bike',
    walk: 'Walk',
    ebike: 'E-bike',
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-violet-100 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-semibold">Hybrid Journey Plans</span>
            <p className="text-violet-200 text-sm font-normal">Split your {distance}km trip smartly</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-3">
          {plans.slice(0, 3).map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                plan.recommended
                  ? 'border-violet-300 bg-white shadow-md ring-2 ring-violet-200'
                  : 'border-slate-200 bg-white hover:border-violet-300'
              }`}
              onClick={() => onSelectPlan?.(plan)}
            >
              {plan.recommended && (
                <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                  Recommended for you
                </div>
              )}

              <div className="flex items-start justify-between mb-3 mt-1">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">{plan.name}</h3>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                  {plan.badge}
                </span>
              </div>

              {/* Journey Segments Visual */}
              <div className="flex h-10 rounded-xl overflow-hidden mb-4 shadow-inner">
                {plan.segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-center text-white text-xs font-semibold ${modeColors[segment.mode]}`}
                    style={{ width: `${segment.percentage}%` }}
                  >
                    <span className="truncate px-1">{modeLabels[segment.mode]} {segment.percentage}%</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-xl font-bold text-emerald-600">{plan.co2Saved}</div>
                  <div className="text-xs text-emerald-700 font-medium">kg CO2 saved</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                  <div className="text-xl font-bold text-orange-600">{plan.totalCalories}</div>
                  <div className="text-xs text-orange-700 font-medium">calories</div>
                </div>
                <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100">
                  <div className="text-xl font-bold text-sky-600">{plan.totalTime}</div>
                  <div className="text-xs text-sky-700 font-medium">minutes</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Find Parking Button */}
        <Button
          onClick={() => setShowParking(!showParking)}
          variant="outline"
          className="w-full border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 h-11"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {showParking ? 'Hide Parking Options' : 'Find Free Parking Near Destination'}
        </Button>

        {/* Parking Finder */}
        {showParking && (
          <ParkingFinder
            destinationLat={destinationLat}
            destinationLon={destinationLon}
          />
        )}
      </CardContent>
    </Card>
  );
}
