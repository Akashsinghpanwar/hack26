import { NextRequest, NextResponse } from 'next/server';

interface ParkingSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  fee: 'free' | 'paid' | 'unknown';
  type: string;
  capacity?: number;
  surface?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');
    const radius = parseInt(searchParams.get('radius') || '2000'); // meters

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Missing lat/lon parameters' }, { status: 400 });
    }

    // Query OpenStreetMap Overpass API for parking areas
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="parking"](around:${radius},${lat},${lon});
        way["amenity"="parking"](around:${radius},${lat},${lon});
        node["amenity"="parking_space"](around:${radius},${lat},${lon});
        node["amenity"="parking_entrance"](around:${radius},${lat},${lon});
      );
      out body center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch parking data from OpenStreetMap');
    }

    const data = await response.json();

    // Process and format parking spots
    const parkingSpots: ParkingSpot[] = data.elements
      .map((element: any) => {
        const elLat = element.lat || element.center?.lat;
        const elLon = element.lon || element.center?.lon;
        
        if (!elLat || !elLon) return null;

        // Calculate distance from search point
        const distance = calculateDistance(lat, lon, elLat, elLon);

        // Determine if parking is free
        const fee = determineFee(element.tags);

        return {
          id: `osm-${element.id}`,
          name: element.tags?.name || getParkingName(element.tags, distance),
          lat: elLat,
          lon: elLon,
          distance: Math.round(distance),
          fee,
          type: element.tags?.parking || 'surface',
          capacity: element.tags?.capacity ? parseInt(element.tags.capacity) : undefined,
          surface: element.tags?.surface,
        };
      })
      .filter((spot: ParkingSpot | null) => spot !== null)
      .sort((a: ParkingSpot, b: ParkingSpot) => {
        // Sort: free parking first, then by distance
        if (a.fee === 'free' && b.fee !== 'free') return -1;
        if (a.fee !== 'free' && b.fee === 'free') return 1;
        return a.distance - b.distance;
      })
      .slice(0, 15); // Limit to 15 results

    return NextResponse.json({
      success: true,
      data: {
        parkingSpots,
        searchLocation: { lat, lon },
        radius,
        totalFound: parkingSpots.length,
      }
    });
  } catch (error) {
    console.error('Error fetching parking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parking data' },
      { status: 500 }
    );
  }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Determine if parking is free based on OSM tags
function determineFee(tags: any): 'free' | 'paid' | 'unknown' {
  if (!tags) return 'unknown';
  
  // Check explicit fee tags
  if (tags.fee === 'no' || tags.fee === 'free') return 'free';
  if (tags.fee === 'yes' || tags.fee === 'paid') return 'paid';
  
  // Check access tags
  if (tags.access === 'customers' || tags.access === 'private') return 'unknown';
  if (tags.access === 'yes' || tags.access === 'public') {
    // Public access with no fee tag often means free
    if (!tags.fee) return 'free';
  }
  
  // Check parking type
  if (tags.parking === 'street_side' || tags.parking === 'lane') return 'free';
  
  return 'unknown';
}

// Generate a name for unnamed parking
function getParkingName(tags: any, distance: number): string {
  if (!tags) return `Parking (${Math.round(distance)}m away)`;
  
  const type = tags.parking || 'parking';
  const typeNames: Record<string, string> = {
    'surface': 'Surface Parking',
    'underground': 'Underground Parking',
    'multi-storey': 'Multi-storey Parking',
    'rooftop': 'Rooftop Parking',
    'street_side': 'Street Parking',
    'lane': 'Lane Parking',
    'garage': 'Parking Garage',
  };
  
  return typeNames[type] || `Parking Area`;
}
