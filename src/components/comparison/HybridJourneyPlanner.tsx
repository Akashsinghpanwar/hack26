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
        badge: '🚶 Active Finish',
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
        badge: '🚴 Fitness Boost',
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
        badge: '🌍 Eco Hero',
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
        badge: '🏃 Cardio Commute',
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
        badge: '⚡ Speed + Eco',
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

  const modeIcons: Record<TransportMode, string> = {
    car: '🚗',
    bus: '🚌',
    train: '🚆',
    bike: '🚴',
    walk: '🚶',
    ebike: '⚡',
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Hybrid Journey Plans
          <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
            Smart Split
          </span>
        </CardTitle>
        <p className="text-sm text-purple-600 mt-1">
          Split your {distance}km journey for maximum fitness + minimum emissions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {plans.slice(0, 3).map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                plan.recommended
                  ? 'border-purple-400 bg-white shadow-sm'
                  : 'border-purple-100 bg-white/70 hover:border-purple-300'
              }`}
              onClick={() => onSelectPlan?.(plan)}
            >
              {plan.recommended && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  Recommended
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {plan.name}
                    <span className="text-sm">{plan.badge}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              {/* Journey Segments Visual */}
              <div className="flex h-8 rounded-full overflow-hidden mb-3">
                {plan.segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-center text-white text-xs font-medium ${
                      segment.mode === 'car'
                        ? 'bg-red-400'
                        : segment.mode === 'walk'
                        ? 'bg-green-500'
                        : segment.mode === 'bike'
                        ? 'bg-emerald-500'
                        : segment.mode === 'ebike'
                        ? 'bg-cyan-500'
                        : segment.mode === 'bus'
                        ? 'bg-orange-400'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${segment.percentage}%` }}
                  >
                    {modeIcons[segment.mode]} {segment.percentage}%
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{plan.co2Saved}kg</div>
                  <div className="text-xs text-green-700">CO2 Saved</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-orange-600">{plan.totalCalories}</div>
                  <div className="text-xs text-orange-700">Calories</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-600">{plan.totalTime}m</div>
                  <div className="text-xs text-blue-700">Total Time</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick tip */}
        <div className="flex items-start gap-3 p-3 bg-purple-100 rounded-lg">
          <span className="text-xl">💡</span>
          <div className="text-sm text-purple-800">
            <strong>Pro tip:</strong> Park at a designated spot and complete your journey actively. 
            You'll save on parking, get exercise, and reduce emissions!
          </div>
        </div>

        {/* Find Parking Button */}
        <Button
          onClick={() => setShowParking(!showParking)}
          variant="outline"
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
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
