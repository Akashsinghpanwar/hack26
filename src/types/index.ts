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

// Transit types for bus/train schedules
export interface TransitOption {
  id: string;
  serviceName: string;        // "First Bus 19", "ScotRail"
  serviceType: 'BUS' | 'RAIL' | 'SUBWAY' | 'TRAM' | 'FERRY';
  vehicleGoogleType?: string; // Original Google vehicle type (BUS, TROLLEYBUS, etc.)
  isElectric?: boolean;       // Whether the vehicle is electric
  departureTime: string;      // "14:35"
  arrivalTime: string;        // "14:52"
  departureTimestamp: number; // Unix timestamp
  arrivalTimestamp: number;   // Unix timestamp
  duration: number;           // minutes
  distance: number;           // meters
  stops: number;              // number of transit stops
  walkingDuration: number;    // total walking time in minutes
  fare?: string;              // fare info if available
  polyline: string;           // encoded polyline for full route
  steps: TransitStep[];       // detailed steps
  co2Emissions: number;       // calculated CO2 for this transit option
}

export interface TransitStep {
  mode: 'WALKING' | 'TRANSIT';
  instruction: string;
  htmlInstruction?: string;
  duration: number;           // seconds
  distance: number;           // meters
  polyline: string;           // encoded polyline for this step
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  transitDetails?: {
    lineName: string;         // "19", "Aberdeen - Dundee"
    lineShortName: string;    // "19"
    lineColor?: string;       // hex color
    vehicleType: string;      // "BUS", "HEAVY_RAIL", "TROLLEYBUS"
    vehicleIcon?: string;     // icon URL
    agencyName: string;       // "First Bus", "ScotRail"
    departureStop: string;    // "Union Street"
    arrivalStop: string;      // "Market Street"
    departureTime: string;    // "14:35"
    arrivalTime: string;      // "14:52"
    numStops: number;
    headsign?: string;        // "City Centre"
    isElectric?: boolean;     // Whether this transit segment uses electric vehicle
  };
}

export interface TransitRouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: 'bus' | 'train' | 'all';
  departureTime?: number;     // Unix timestamp, defaults to now
}

export interface TransitRouteResponse {
  success: boolean;
  options: TransitOption[];
  error?: string;
}
