import { NextRequest, NextResponse } from 'next/server';

interface ParkingSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  distanceToRoute: number;
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

        // Calculate distance from destination
        const distance = calculateDistance(lat, lon, elLat, elLon);

        // Determine if parking is free
        const fee = determineFee(element.tags);

        return {
          id: `osm-${element.id}`,
          name: element.tags?.name || getParkingName(element.tags, distance),
          lat: elLat,
          lon: elLon,
          distance: Math.round(distance),
          distanceToRoute: 0, // Will be calculated in POST method
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

// POST method - Search parking along a route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destinationLat, destinationLon, routeCoords, radius = 2000 } = body;

    if (!destinationLat || !destinationLon) {
      return NextResponse.json({ error: 'Missing destination parameters' }, { status: 400 });
    }

    // Query OpenStreetMap Overpass API for parking areas near destination
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="parking"](around:${radius},${destinationLat},${destinationLon});
        way["amenity"="parking"](around:${radius},${destinationLat},${destinationLon});
        node["amenity"="parking_space"](around:${radius},${destinationLat},${destinationLon});
        node["amenity"="parking_entrance"](around:${radius},${destinationLat},${destinationLon});
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

    // Process and filter parking spots based on route proximity
    let parkingSpots: ParkingSpot[] = data.elements
      .map((element: any) => {
        const elLat = element.lat || element.center?.lat;
        const elLon = element.lon || element.center?.lon;
        
        if (!elLat || !elLon) return null;

        // Calculate distance from destination
        const distanceToDestination = calculateDistance(destinationLat, destinationLon, elLat, elLon);

        // Calculate minimum distance to route polyline
        let distanceToRoute = distanceToDestination; // Default to destination distance
        if (routeCoords && routeCoords.length >= 2) {
          distanceToRoute = calculateMinDistanceToRoute(elLat, elLon, routeCoords);
        }

        // Determine if parking is free
        const fee = determineFee(element.tags);

        return {
          id: `osm-${element.id}`,
          name: element.tags?.name || getParkingName(element.tags, distanceToDestination),
          lat: elLat,
          lon: elLon,
          distance: Math.round(distanceToDestination),
          distanceToRoute: Math.round(distanceToRoute),
          fee,
          type: element.tags?.parking || 'surface',
          capacity: element.tags?.capacity ? parseInt(element.tags.capacity) : undefined,
          surface: element.tags?.surface,
        };
      })
      .filter((spot: ParkingSpot | null) => spot !== null);

    // Filter to only include parking spots within 300m of the route
    if (routeCoords && routeCoords.length >= 2) {
      const MAX_ROUTE_DISTANCE = 300; // meters from route
      parkingSpots = parkingSpots.filter((spot: ParkingSpot) => spot.distanceToRoute <= MAX_ROUTE_DISTANCE);
    }

    // Sort: free parking first, then by distance to route, then by distance to destination
    parkingSpots = parkingSpots
      .sort((a: ParkingSpot, b: ParkingSpot) => {
        // Free parking gets priority
        if (a.fee === 'free' && b.fee !== 'free') return -1;
        if (a.fee !== 'free' && b.fee === 'free') return 1;
        // Then sort by distance to route (closer to route is better)
        if (a.distanceToRoute !== b.distanceToRoute) {
          return a.distanceToRoute - b.distanceToRoute;
        }
        // Then by distance to destination
        return a.distance - b.distance;
      })
      .slice(0, 15); // Limit to 15 results

    return NextResponse.json({
      success: true,
      data: {
        parkingSpots,
        searchLocation: { lat: destinationLat, lon: destinationLon },
        radius,
        totalFound: parkingSpots.length,
        routeFiltered: routeCoords && routeCoords.length >= 2,
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

// Calculate minimum distance from a point to a route polyline
function calculateMinDistanceToRoute(lat: number, lon: number, routeCoords: [number, number][]): number {
  let minDistance = Infinity;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [lat1, lon1] = routeCoords[i];
    const [lat2, lon2] = routeCoords[i + 1];
    
    // Calculate distance from point to line segment
    const distance = pointToSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

// Calculate distance from a point to a line segment
function pointToSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) {
    // Segment is a point
    return calculateDistance(px, py, x1, y1);
  }

  // Calculate projection parameter
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  
  // Find closest point on segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  return calculateDistance(px, py, closestX, closestY);
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
