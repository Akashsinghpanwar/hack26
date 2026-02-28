export type TransportMode = 'car' | 'bus' | 'train' | 'bike' | 'walk' | 'ebike';

export interface TransportData {
  co2PerKm: number;  // kg CO2 per km
  speed: number;      // km/h average speed
  calPerKm: number;   // calories burned per km
  label: string;
  icon: string;
  color: string;
}

export const TRANSPORT_DATA: Record<TransportMode, TransportData> = {
  car: {
    co2PerKm: 0.21,
    speed: 40,
    calPerKm: 0,
    label: 'Car',
    icon: '🚗',
    color: '#ef4444'
  },
  bus: {
    co2PerKm: 0.089,
    speed: 25,
    calPerKm: 0,
    label: 'Bus',
    icon: '🚌',
    color: '#f97316'
  },
  train: {
    co2PerKm: 0.041,
    speed: 60,
    calPerKm: 0,
    label: 'Train',
    icon: '🚆',
    color: '#eab308'
  },
  bike: {
    co2PerKm: 0,
    speed: 15,
    calPerKm: 30,
    label: 'Bicycle',
    icon: '🚲',
    color: '#22c55e'
  },
  walk: {
    co2PerKm: 0,
    speed: 5,
    calPerKm: 60,
    label: 'Walking',
    icon: '🚶',
    color: '#10b981'
  },
  ebike: {
    co2PerKm: 0.006,
    speed: 20,
    calPerKm: 15,
    label: 'E-Bike',
    icon: '⚡',
    color: '#06b6d4'
  }
};

export interface JourneyMetrics {
  travelTime: number;      // minutes
  co2Emissions: number;    // kg
  caloriesBurned: number;  // kcal
  co2Saved: number;        // kg (vs car)
}

export interface ComparisonResult {
  mode: TransportMode;
  metrics: JourneyMetrics;
  timeDifference: number;  // minutes vs car (positive = slower)
  co2Difference: number;   // kg vs car (negative = saved)
  calorieDifference: number;
}

// Calculate metrics for a single transport mode
export function calculateMetrics(distance: number, mode: TransportMode): JourneyMetrics {
  const data = TRANSPORT_DATA[mode];
  const carData = TRANSPORT_DATA.car;
  
  const travelTime = (distance / data.speed) * 60; // minutes
  const co2Emissions = distance * data.co2PerKm;
  const caloriesBurned = distance * data.calPerKm;
  const co2Saved = (carData.co2PerKm * distance) - co2Emissions;
  
  return {
    travelTime: Math.round(travelTime),
    co2Emissions: Math.round(co2Emissions * 100) / 100,
    caloriesBurned: Math.round(caloriesBurned),
    co2Saved: Math.round(co2Saved * 100) / 100
  };
}

// Compare a mode against driving
export function compareWithCar(distance: number, mode: TransportMode): ComparisonResult {
  const modeMetrics = calculateMetrics(distance, mode);
  const carMetrics = calculateMetrics(distance, 'car');
  
  return {
    mode,
    metrics: modeMetrics,
    timeDifference: modeMetrics.travelTime - carMetrics.travelTime,
    co2Difference: modeMetrics.co2Emissions - carMetrics.co2Emissions,
    calorieDifference: modeMetrics.caloriesBurned - carMetrics.caloriesBurned
  };
}

// Calculate all modes for comparison
export function calculateAllModes(distance: number): ComparisonResult[] {
  const modes: TransportMode[] = ['car', 'bus', 'train', 'bike', 'walk', 'ebike'];
  return modes.map(mode => compareWithCar(distance, mode));
}

// Convert CO2 saved to equivalent trees planted (1 tree absorbs ~21kg CO2/year)
export function co2ToTrees(co2Kg: number): number {
  return Math.round((co2Kg / 21) * 100) / 100;
}

// Convert calories to food equivalents
export function caloriesToFood(calories: number): string {
  if (calories >= 500) return `${Math.round(calories / 500)} burger(s)`;
  if (calories >= 250) return `${Math.round(calories / 250)} donut(s)`;
  if (calories >= 100) return `${Math.round(calories / 100)} apple(s)`;
  return `${calories} kcal`;
}

// Calculate sustainability score
export function calculateSustainabilityScore(
  totalCo2Saved: number,
  totalCalories: number,
  sustainableTrips: number,
  currentStreak: number
): number {
  const co2Points = totalCo2Saved * 10;
  const caloriePoints = totalCalories * 0.1;
  const tripPoints = sustainableTrips * 5;
  const streakBonus = currentStreak * 2;
  
  return Math.round(co2Points + caloriePoints + tripPoints + streakBonus);
}

// Get level based on score
export function getLevel(score: number): { name: string; minScore: number; maxScore: number } {
  const levels = [
    { name: 'Eco Beginner', minScore: 0, maxScore: 100 },
    { name: 'Green Starter', minScore: 100, maxScore: 300 },
    { name: 'Climate Conscious', minScore: 300, maxScore: 600 },
    { name: 'Eco Warrior', minScore: 600, maxScore: 1000 },
    { name: 'Planet Protector', minScore: 1000, maxScore: 2000 },
    { name: 'Carbon Hero', minScore: 2000, maxScore: 5000 },
    { name: 'Climate Champion', minScore: 5000, maxScore: Infinity }
  ];
  
  return levels.find(l => score >= l.minScore && score < l.maxScore) || levels[0];
}

// Smart recommendations
export function getRecommendation(
  distance: number,
  currentMode: TransportMode,
  frequency: number = 5 // trips per week
): string {
  if (currentMode === 'car') {
    if (distance <= 5) {
      const bikeSavings = distance * TRANSPORT_DATA.car.co2PerKm * frequency * 4;
      return `If you cycle instead of driving ${frequency}x per week, you could save ${bikeSavings.toFixed(1)} kg CO2 per month!`;
    }
    if (distance <= 15) {
      const ebikeSavings = distance * (TRANSPORT_DATA.car.co2PerKm - TRANSPORT_DATA.ebike.co2PerKm) * frequency * 4;
      return `An e-bike could save you ${ebikeSavings.toFixed(1)} kg CO2 per month for this commute!`;
    }
    const trainSavings = distance * (TRANSPORT_DATA.car.co2PerKm - TRANSPORT_DATA.train.co2PerKm) * frequency * 4;
    return `Taking the train would save ${trainSavings.toFixed(1)} kg CO2 per month!`;
  }
  
  const calories = distance * TRANSPORT_DATA[currentMode].calPerKm * frequency * 4;
  if (calories > 0) {
    return `Great choice! You're burning ${calories} calories per month with this sustainable transport!`;
  }
  
  return `You're making a sustainable choice! Keep it up!`;
}

// Check if transport mode is sustainable (non-car)
export function isSustainableMode(mode: TransportMode): boolean {
  return mode !== 'car';
}
