'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ParkingSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  fee: 'free' | 'paid' | 'unknown';
  type: string;
  capacity?: number;
}

interface ParkingFinderProps {
  destinationLat?: number;
  destinationLon?: number;
  onSelectParking?: (spot: ParkingSpot) => void;
}

export function ParkingFinder({ destinationLat, destinationLon, onSelectParking }: ParkingFinderProps) {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchParking = async () => {
    if (!destinationLat || !destinationLon) {
      setError('Please select a destination first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/parking?lat=${destinationLat}&lon=${destinationLon}&radius=2000`
      );
      const data = await response.json();

      if (data.success) {
        setParkingSpots(data.data.parkingSpots);
        setSearched(true);
      } else {
        setError(data.error || 'Failed to find parking');
      }
    } catch (err) {
      setError('Failed to search for parking');
    } finally {
      setLoading(false);
    }
  };

  const feeColors = {
    free: 'bg-green-100 text-green-800 border-green-300',
    paid: 'bg-red-100 text-red-800 border-red-300',
    unknown: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const feeLabels = {
    free: 'FREE',
    paid: 'PAID',
    unknown: 'Check',
  };

  const typeIcons: Record<string, string> = {
    'surface': '🅿️',
    'underground': '🚇',
    'multi-storey': '🏢',
    'rooftop': '🔝',
    'street_side': '🛣️',
    'lane': '📍',
    'garage': '🏠',
  };

  const freeSpots = parkingSpots.filter(s => s.fee === 'free');
  const otherSpots = parkingSpots.filter(s => s.fee !== 'free');

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Find Free Parking
          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
            Near Destination
          </span>
        </CardTitle>
        <p className="text-sm text-blue-600 mt-1">
          Park for free and complete your journey sustainably
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!searched ? (
          <div className="text-center py-4">
            <Button
              onClick={searchParking}
              disabled={loading || !destinationLat}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Parking Near Destination
                </>
              )}
            </Button>
            {!destinationLat && (
              <p className="text-sm text-muted-foreground mt-2">
                Select a destination on the map first
              </p>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {parkingSpots.length === 0 && !error && (
              <div className="text-center py-4 text-muted-foreground">
                <span className="text-3xl mb-2 block">🚫</span>
                No parking spots found within 2km
              </div>
            )}

            {/* Free Parking Section */}
            {freeSpots.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                  <span className="text-lg">🆓</span>
                  Free Parking ({freeSpots.length} found)
                </h3>
                <div className="grid gap-2">
                  {freeSpots.slice(0, 5).map((spot) => (
                    <div
                      key={spot.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 cursor-pointer transition-all hover:shadow-sm"
                      onClick={() => onSelectParking?.(spot)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeIcons[spot.type] || '🅿️'}</span>
                        <div>
                          <div className="font-medium">{spot.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {spot.distance}m away
                            {spot.capacity && ` • ${spot.capacity} spots`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${feeColors[spot.fee]}`}>
                          {feeLabels[spot.fee]}
                        </span>
                        <Button size="sm" variant="ghost" className="text-green-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Parking */}
            {otherSpots.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <span className="text-lg">🅿️</span>
                  Other Parking Options
                </h3>
                <div className="grid gap-2">
                  {otherSpots.slice(0, 3).map((spot) => (
                    <div
                      key={spot.id}
                      className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-gray-200 hover:border-gray-400 cursor-pointer transition-all"
                      onClick={() => onSelectParking?.(spot)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{typeIcons[spot.type] || '🅿️'}</span>
                        <div>
                          <div className="font-medium text-sm">{spot.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {spot.distance}m away
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${feeColors[spot.fee]}`}>
                        {feeLabels[spot.fee]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Again Button */}
            <Button
              onClick={searchParking}
              variant="outline"
              size="sm"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Again'}
            </Button>

            {/* Pro Tip */}
            <div className="flex items-start gap-2 p-3 bg-blue-100 rounded-lg text-sm">
              <span className="text-lg">💡</span>
              <div className="text-blue-800">
                <strong>Pro tip:</strong> Park at a free spot and walk/bike the last stretch to save money and get exercise!
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
