import { NextRequest, NextResponse } from 'next/server';
import { TransitOption, TransitStep, TransitRouteResponse } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// CO2 emissions per km for different transit types (in grams per passenger)
// Sources: European Environment Agency, US Dept of Energy
const TRANSIT_CO2_PER_KM: Record<string, number> = {
  BUS: 89,           // Average diesel bus emissions per passenger
  BUS_ELECTRIC: 25,  // Electric bus (battery-powered)
  INTERCITY_BUS: 95, // Longer diesel buses, often less efficient
  RAIL: 41,          // Train emissions per passenger
  SUBWAY: 30,        // Metro/subway emissions (electric)
  TRAM: 35,          // Tram emissions (electric)
  LIGHT_RAIL: 32,    // Light rail (electric)
  FERRY: 120,        // Ferry emissions
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

// Format time from timestamp
function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Map Google vehicle type to our service type
function mapVehicleType(googleType: string): 'BUS' | 'RAIL' | 'SUBWAY' | 'TRAM' | 'FERRY' {
  const mapping: Record<string, 'BUS' | 'RAIL' | 'SUBWAY' | 'TRAM' | 'FERRY'> = {
    BUS: 'BUS',
    INTERCITY_BUS: 'BUS',
    RAIL: 'RAIL',
    HEAVY_RAIL: 'RAIL',
    COMMUTER_TRAIN: 'RAIL',
    HIGH_SPEED_TRAIN: 'RAIL',
    LONG_DISTANCE_TRAIN: 'RAIL',
    METRO_RAIL: 'SUBWAY',
    SUBWAY: 'SUBWAY',
    TRAM: 'TRAM',
    LIGHT_RAIL: 'TRAM',
    MONORAIL: 'RAIL',
    FERRY: 'FERRY',
    CABLE_CAR: 'TRAM',
    GONDOLA_LIFT: 'TRAM',
    FUNICULAR: 'RAIL',
  };
  return mapping[googleType] || 'BUS';
}

// Get CO2 emissions key for specific vehicle type
function getCO2EmissionKey(googleType: string): string {
  // Check for specific types with their own emission rates
  if (TRANSIT_CO2_PER_KM[googleType]) {
    return googleType;
  }
  // Map to general category
  const generalMapping: Record<string, string> = {
    BUS: 'BUS',
    INTERCITY_BUS: 'INTERCITY_BUS',
    RAIL: 'RAIL',
    HEAVY_RAIL: 'RAIL',
    COMMUTER_TRAIN: 'RAIL',
    HIGH_SPEED_TRAIN: 'RAIL',
    LONG_DISTANCE_TRAIN: 'RAIL',
    METRO_RAIL: 'SUBWAY',
    SUBWAY: 'SUBWAY',
    TRAM: 'TRAM',
    LIGHT_RAIL: 'LIGHT_RAIL',
    MONORAIL: 'RAIL',
    FERRY: 'FERRY',
    CABLE_CAR: 'TRAM',
    GONDOLA_LIFT: 'TRAM',
    FUNICULAR: 'RAIL',
  };
  return generalMapping[googleType] || 'BUS';
}

// Determine if a vehicle is electric based on type
function isElectricVehicle(googleType: string): boolean {
  const electricTypes = ['SUBWAY', 'METRO_RAIL', 'TRAM', 'LIGHT_RAIL', 'CABLE_CAR', 'GONDOLA_LIFT', 'FUNICULAR'];
  return electricTypes.includes(googleType);
}

// Parse Google Directions API response into our TransitOption format
function parseGoogleResponse(route: any, index: number): TransitOption | null {
  try {
    const leg = route.legs[0];
    const steps: TransitStep[] = [];
    let totalStops = 0;
    let walkingDuration = 0;
    let mainServiceName = '';
    let mainServiceType: 'BUS' | 'RAIL' | 'SUBWAY' | 'TRAM' | 'FERRY' = 'BUS';
    let totalDistance = 0;
    let mainVehicleGoogleType = 'BUS';
    let isElectric = false;
    
    // Track emissions per segment for more accurate calculation
    let totalCo2 = 0;

    for (const step of leg.steps) {
      const transitStep: TransitStep = {
        mode: step.travel_mode === 'WALKING' ? 'WALKING' : 'TRANSIT',
        instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
        htmlInstruction: step.html_instructions,
        duration: step.duration.value,
        distance: step.distance.value,
        polyline: step.polyline.points,
        startLocation: step.start_location,
        endLocation: step.end_location,
      };

      totalDistance += step.distance.value;

      if (step.travel_mode === 'WALKING') {
        walkingDuration += Math.round(step.duration.value / 60);
        // Walking has zero emissions
      }

      if (step.travel_mode === 'TRANSIT' && step.transit_details) {
        const td = step.transit_details;
        const googleVehicleType = td.line.vehicle.type;
        const vehicleType = mapVehicleType(googleVehicleType);
        const co2Key = getCO2EmissionKey(googleVehicleType);
        const stepIsElectric = isElectricVehicle(googleVehicleType);
        
        // Calculate CO2 for this transit segment
        const segmentDistanceKm = step.distance.value / 1000;
        const co2PerKm = TRANSIT_CO2_PER_KM[co2Key] || 89;
        totalCo2 += segmentDistanceKm * co2PerKm;
        
        // Set main service name from first transit step
        if (!mainServiceName) {
          mainServiceName = `${td.line.agencies?.[0]?.name || ''} ${td.line.short_name || td.line.name}`.trim();
          mainServiceType = vehicleType;
          mainVehicleGoogleType = googleVehicleType;
          isElectric = stepIsElectric;
        }

        totalStops += td.num_stops;

        transitStep.transitDetails = {
          lineName: td.line.name || td.line.short_name,
          lineShortName: td.line.short_name || td.line.name,
          lineColor: td.line.color,
          vehicleType: googleVehicleType,
          vehicleIcon: td.line.vehicle.icon,
          agencyName: td.line.agencies?.[0]?.name || 'Unknown',
          departureStop: td.departure_stop.name,
          arrivalStop: td.arrival_stop.name,
          departureTime: formatTime(td.departure_time.value),
          arrivalTime: formatTime(td.arrival_time.value),
          numStops: td.num_stops,
          headsign: td.headsign,
          isElectric: stepIsElectric,
        };
      }

      steps.push(transitStep);
    }

    return {
      id: `transit-${index}-${Date.now()}`,
      serviceName: mainServiceName || 'Public Transit',
      serviceType: mainServiceType,
      vehicleGoogleType: mainVehicleGoogleType,
      isElectric,
      departureTime: formatTime(leg.departure_time.value),
      arrivalTime: formatTime(leg.arrival_time.value),
      departureTimestamp: leg.departure_time.value,
      arrivalTimestamp: leg.arrival_time.value,
      duration: Math.round(leg.duration.value / 60),
      distance: totalDistance,
      stops: totalStops,
      walkingDuration,
      fare: route.fare?.text,
      polyline: route.overview_polyline.points,
      steps,
      co2Emissions: Math.round(totalCo2),
    };
  } catch (error) {
    console.error('Error parsing transit route:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({
        success: false,
        options: [],
        error: 'Google Maps API key not configured',
      } as TransitRouteResponse, { status: 500 });
    }

    const body = await request.json();
    const { origin, destination, mode, departureTime } = body;

    if (!origin || !destination) {
      return NextResponse.json({
        success: false,
        options: [],
        error: 'Origin and destination are required',
      } as TransitRouteResponse, { status: 400 });
    }

    // Build transit_mode parameter based on mode selection
    let transitMode = '';
    if (mode === 'bus') {
      transitMode = '&transit_mode=bus';
    } else if (mode === 'train') {
      transitMode = '&transit_mode=rail|subway|train|tram';
    }
    // If mode is 'all', don't restrict transit_mode

    // Use current time if no departure time specified
    const depTime = departureTime || Math.floor(Date.now() / 1000);

    // Call Google Maps Directions API
    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&mode=transit` +
      `&departure_time=${depTime}` +
      `&alternatives=true` +
      transitMode +
      `&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      // Handle specific error cases
      if (data.status === 'ZERO_RESULTS') {
        return NextResponse.json({
          success: true,
          options: [],
          error: 'No transit routes found for this journey. Try a different time or location.',
        } as TransitRouteResponse);
      }
      
      return NextResponse.json({
        success: false,
        options: [],
        error: `Google Maps API error: ${data.status}`,
      } as TransitRouteResponse, { status: 500 });
    }

    // Parse all route alternatives
    const options: TransitOption[] = [];
    for (let i = 0; i < data.routes.length; i++) {
      const parsed = parseGoogleResponse(data.routes[i], i);
      if (parsed) {
        options.push(parsed);
      }
    }

    // Sort by departure time
    options.sort((a, b) => a.departureTimestamp - b.departureTimestamp);

    return NextResponse.json({
      success: true,
      options,
    } as TransitRouteResponse);

  } catch (error) {
    console.error('Transit API error:', error);
    return NextResponse.json({
      success: false,
      options: [],
      error: 'Failed to fetch transit routes',
    } as TransitRouteResponse, { status: 500 });
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    success: true,
    configured: !!GOOGLE_MAPS_API_KEY,
    message: GOOGLE_MAPS_API_KEY ? 'Transit API ready' : 'Google Maps API key not configured',
  });
}
