import { TransportMode, JourneyMetrics } from '@/lib/calculations';
import 'next-auth';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

// Journey types
export interface JourneyInput {
  distance: number;
  transportMode: TransportMode;
  fromLocation?: string;
  toLocation?: string;
}

export interface JourneyRecord {
  id: string;
  distance: number;
  transportMode: TransportMode;
  travelTime: number;
  co2Emissions: number;
  caloriesBurned: number;
  co2Saved: number;
  fromLocation?: string;
  toLocation?: string;
  createdAt: Date;
}

// User stats
export interface UserStats {
  totalJourneys: number;
  totalDistance: number;
  totalCo2Saved: number;
  totalCaloriesBurned: number;
  sustainableTrips: number;
  currentStreak: number;
  longestStreak: number;
  sustainabilityScore: number;
}

// Achievement types
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  type: 'co2' | 'calories' | 'journeys' | 'streak';
  unlocked?: boolean;
  unlockedAt?: Date;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage?: string;
  co2Saved: number;
  caloriesBurned: number;
  journeyCount: number;
  isCurrentUser?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
