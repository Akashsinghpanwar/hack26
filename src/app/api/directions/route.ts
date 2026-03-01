import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// CO2 emissions per km for different modes (in grams)
const CO2_PER_KM: Record<string, number> = {
  driving: 171,     // Average car emissions per km
  walking: 0,       // Zero emissions
  bicycling: 0,     // Zero emissions
  transit: 89,      // Average public transit
};

// Calories burned per km for different modes
const CALORIES_PER_KM: Record<string, number> = {
  driving: 0,
  walking: 50,      // ~50 cal/km walking
  bicycling: 30,    // ~30 cal/km cycling
  transit: 10,      // Standing/walking to stops
};

// Decode Google's encoded polyline format
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

export interface DirectionsResponse {
  success: boolean;
  route?: {
    polyline: [number, number][];
    distance: number; // in km
    duration: number; // in minutes
    co2Emissions: number; // in grams
    calories: number;
    steps?: {
      instruction: string;
      distance: number;
      duration: number;
    }[];
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback to OSRM if no Google API key
      return NextResponse.json({
        success: false,
        error: 'Google Maps API key not configured',
      } as DirectionsResponse, { status: 500 });
    }

    const body = await request.json();
    const { origin, destination, mode } = body;

    if (!origin || !destination) {
      return NextResponse.json({
        success: false,
        error: 'Origin and destination are required',
      } as DirectionsResponse, { status: 400 });
    }

    // Map our mode to Google's mode
    const googleMode = mode === 'e-bike' ? 'bicycling' : 
                       mode === 'car' ? 'driving' :
                       mode === 'bike' ? 'bicycling' :
                       mode === 'walk' ? 'walking' : 'driving';

    // Call Google Maps Directions API
    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&mode=${googleMode}` +
      `&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return NextResponse.json({
          success: false,
          error: `No ${mode} route found for this journey`,
        } as DirectionsResponse);
      }
      
      return NextResponse.json({
        success: false,
        error: `Google Maps API error: ${data.status}`,
      } as DirectionsResponse, { status: 500 });
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    
    // Decode the polyline
    const polyline = decodePolyline(route.overview_polyline.points);
    
    // Calculate metrics
    const distanceKm = leg.distance.value / 1000;
    const durationMin = Math.round(leg.duration.value / 60);
    const co2 = Math.round(distanceKm * (CO2_PER_KM[googleMode] || 0));
    const calories = Math.round(distanceKm * (CALORIES_PER_KM[googleMode] || 0));
    
    // Extract steps
    const steps = leg.steps.map((step: any) => ({
      instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
      distance: step.distance.value,
      duration: step.duration.value,
    }));

    return NextResponse.json({
      success: true,
      route: {
        polyline,
        distance: Math.round(distanceKm * 10) / 10,
        duration: durationMin,
        co2Emissions: co2,
        calories,
        steps,
      },
    } as DirectionsResponse);

  } catch (error) {
    console.error('Directions API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch directions',
    } as DirectionsResponse, { status: 500 });
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    success: true,
    configured: !!GOOGLE_MAPS_API_KEY,
    message: GOOGLE_MAPS_API_KEY ? 'Directions API ready' : 'Google Maps API key not configured',
  });
}
