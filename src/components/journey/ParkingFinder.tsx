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

// Icons
const Icons = {
  parking: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  arrow: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

const typeIcons: Record<string, React.ReactNode> = {
  'surface': <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="white">P</text></svg>,
  'underground': <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/><text x="12" y="15" textAnchor="middle" fontSize="8" fill="white">P</text></svg>,
  'multi-storey': <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1"/><line x1="4" y1="10" x2="20" y2="10" stroke="white" strokeWidth="1"/><line x1="4" y1="14" x2="20" y2="14" stroke="white" strokeWidth="1"/><text x="12" y="20" textAnchor="middle" fontSize="6" fill="white">P</text></svg>,
  'street_side': <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="1"/><text x="12" y="14" textAnchor="middle" fontSize="8" fill="white">P</text></svg>,
};

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

  const freeSpots = parkingSpots.filter(s => s.fee === 'free');
  const otherSpots = parkingSpots.filter(s => s.fee !== 'free');

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-sky-100">
        <CardTitle className="flex items-center gap-3 text-sky-800">
          <div className="p-2 bg-sky-500 text-white rounded-xl">
            <Icons.parking />
          </div>
          <div>
            <span className="text-lg font-semibold">Find Parking</span>
            <p className="text-sky-600 text-sm font-normal">Near your destination</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {!searched ? (
          <div className="text-center py-6">
            <Button
              onClick={searchParking}
              disabled={loading || !destinationLat}
              className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Icons.search />
                  <span className="ml-2">Search Free Parking</span>
                </>
              )}
            </Button>
            {!destinationLat && (
              <p className="text-sm text-slate-500 mt-3">
                Select a destination on the map first
              </p>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {parkingSpots.length === 0 && !error && (
              <div className="text-center py-6 text-slate-500">
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                  <Icons.parking />
                </div>
                No parking spots found within 2km
              </div>
            )}

            {/* Free Parking Section */}
            {freeSpots.length > 0 && (
              <div>
                <h3 className="font-semibold text-emerald-700 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
                  <Icons.check />
                  Free Parking ({freeSpots.length})
                </h3>
                <div className="space-y-2">
                  {freeSpots.slice(0, 5).map((spot) => (
                    <div
                      key={spot.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => onSelectParking?.(spot)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          {typeIcons[spot.type] || typeIcons['surface']}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{spot.name}</div>
                          <div className="text-sm text-slate-500">
                            {spot.distance}m away
                            {spot.capacity && ` • ${spot.capacity} spots`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          FREE
                        </span>
                        <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">
                          <Icons.arrow />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Parking */}
            {otherSpots.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-slate-600 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
                  Other Options
                </h3>
                <div className="space-y-2">
                  {otherSpots.slice(0, 3).map((spot) => (
                    <div
                      key={spot.id}
                      className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all"
                      onClick={() => onSelectParking?.(spot)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                          {typeIcons[spot.type] || typeIcons['surface']}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-700">{spot.name}</div>
                          <div className="text-xs text-slate-500">{spot.distance}m away</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        spot.fee === 'paid' 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {spot.fee === 'paid' ? 'PAID' : 'CHECK'}
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
              className="w-full mt-3 border-sky-200 text-sky-700 hover:bg-sky-50"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Again'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
