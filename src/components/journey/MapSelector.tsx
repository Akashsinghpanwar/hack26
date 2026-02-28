'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// Custom SVG markers - professional look
const createCustomIcon = (color: string, type: 'start' | 'end') => {
  const svg = type === 'start' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`;
  
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: type === 'start' ? [32, 32] : [28, 42],
    iconAnchor: type === 'start' ? [16, 16] : [14, 42],
    popupAnchor: [0, type === 'start' ? -16 : -42],
  });
};

const StartIcon = createCustomIcon('#10b981', 'start'); // Emerald green
const EndIcon = createCustomIcon('#ef4444', 'end'); // Red

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapSelectorProps {
  onRouteCalculated: (distance: number, from: string, to: string, destLat?: number, destLon?: number) => void;
}

// Component to fit map bounds to route
function FitBounds({ start, end }: { start: Location | null; end: Location | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (start && end) {
      const bounds = L.latLngBounds([
        [start.lat, start.lng],
        [end.lat, end.lng]
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (start) {
      map.setView([start.lat, start.lng], 14);
    } else if (end) {
      map.setView([end.lat, end.lng], 14);
    }
  }, [start, end, map]);
  
  return null;
}

// Component to handle map clicks
function MapClickHandler({ 
  onMapClick, 
  selectingStart,
  selectingEnd 
}: { 
  onMapClick: (lat: number, lng: number) => void;
  selectingStart: boolean;
  selectingEnd: boolean;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (selectingStart || selectingEnd) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [selectingStart, selectingEnd, map]);

  useMapEvents({
    click: (e) => {
      if (selectingStart || selectingEnd) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Icons as SVG components
const Icons = {
  location: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  crosshair: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={2}/>
      <line x1="12" y1="2" x2="12" y2="6" strokeWidth={2}/>
      <line x1="12" y1="18" x2="12" y2="22" strokeWidth={2}/>
      <line x1="2" y1="12" x2="6" y2="12" strokeWidth={2}/>
      <line x1="18" y1="12" x2="22" y2="12" strokeWidth={2}/>
    </svg>
  ),
  route: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  map: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  navigation: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
    </svg>
  ),
  clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function MapSelector({ onRouteCalculated }: MapSelectorProps) {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [startResults, setStartResults] = useState<SearchResult[]>([]);
  const [endResults, setEndResults] = useState<SearchResult[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectingStart, setSelectingStart] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'car' | 'walk' | 'bike'>('walk');
  const [hybridMode, setHybridMode] = useState(true); // Enable hybrid split by default
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transport mode colors and config
  const transportModes = {
    car: { 
      color: '#ef4444', // Red
      label: 'Car',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
        </svg>
      ),
      bgColor: 'bg-red-500',
      bgHover: 'hover:bg-red-600',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-600',
    },
    walk: { 
      color: '#3b82f6', // Blue
      label: 'Walk',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      ),
      bgColor: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
    },
    bike: { 
      color: '#22c55e', // Green
      label: 'Bicycle',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="5.5" cy="17.5" r="3.5" strokeWidth={2}/>
          <circle cx="18.5" cy="17.5" r="3.5" strokeWidth={2}/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.5l-3-6h6l3 6M9 11.5l3-6 3 6"/>
        </svg>
      ),
      bgColor: 'bg-green-500',
      bgHover: 'hover:bg-green-600',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-600',
    },
  };

  // Smart algorithm to split route intelligently
  const getHybridRouteSegments = () => {
    if (routeCoords.length < 4 || !distance) {
      return { firstHalf: routeCoords, secondHalf: [], carDistance: 0, activeDistance: 0 };
    }

    // Intelligent split based on mode and total distance
    let activeDistanceKm: number;
    
    if (selectedMode === 'walk') {
      // Walking limits: max 2.5km, or 20% of trip, whichever is smaller
      // For short trips, walk more; for long trips, cap walking distance
      if (distance <= 5) {
        activeDistanceKm = Math.min(distance * 0.4, 2); // 40% but max 2km for short trips
      } else if (distance <= 10) {
        activeDistanceKm = Math.min(distance * 0.25, 2.5); // 25% but max 2.5km
      } else if (distance <= 20) {
        activeDistanceKm = Math.min(distance * 0.15, 2.5); // 15% but max 2.5km
      } else {
        activeDistanceKm = 2; // Just last 2km for very long trips
      }
    } else {
      // Cycling limits: more generous, max 8km or 40% of trip
      if (distance <= 8) {
        activeDistanceKm = Math.min(distance * 0.5, 4); // 50% but max 4km for short trips
      } else if (distance <= 15) {
        activeDistanceKm = Math.min(distance * 0.4, 6); // 40% but max 6km
      } else if (distance <= 30) {
        activeDistanceKm = Math.min(distance * 0.3, 8); // 30% but max 8km
      } else {
        activeDistanceKm = 8; // Last 8km for very long trips
      }
    }

    // Calculate the split point in the route coordinates
    const activeRatio = activeDistanceKm / distance;
    const carRatio = 1 - activeRatio;
    
    // Find the index to split at (car portion first)
    const splitIndex = Math.floor(routeCoords.length * carRatio);
    const adjustedSplitIndex = Math.max(1, Math.min(splitIndex, routeCoords.length - 2));

    const carDistance = Math.round((distance * carRatio) * 10) / 10;
    const activeDistance = Math.round((distance * activeRatio) * 10) / 10;

    return {
      firstHalf: routeCoords.slice(0, adjustedSplitIndex + 1), // Car segment
      secondHalf: routeCoords.slice(adjustedSplitIndex),       // Walk/Bike segment
      carDistance,
      activeDistance,
    };
  };

  // Search for address using Nominatim
  const searchAddress = async (query: string, isStart: boolean) => {
    if (query.length < 3) {
      isStart ? setStartResults([]) : setEndResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data: SearchResult[] = await response.json();
      isStart ? setStartResults(data) : setEndResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Debounced search
  const handleSearchChange = (value: string, isStart: boolean) => {
    if (isStart) {
      setStartSearch(value);
    } else {
      setEndSearch(value);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value, isStart);
    }, 500);
  };

  // Select location from search results
  const selectLocation = (result: SearchResult, isStart: boolean) => {
    const location: Location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    };

    if (isStart) {
      setStartLocation(location);
      setStartSearch(result.display_name.split(',')[0]);
      setStartResults([]);
      setSelectingStart(false);
    } else {
      setEndLocation(location);
      setEndSearch(result.display_name.split(',')[0]);
      setEndResults([]);
      setSelectingEnd(false);
    }
  };

  // Reverse geocode from map click
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    
    if (selectingStart) {
      setStartLocation({ lat, lng, address });
      setStartSearch(address.split(',')[0]);
      setSelectingStart(false);
    } else if (selectingEnd) {
      setEndLocation({ lat, lng, address });
      setEndSearch(address.split(',')[0]);
      setSelectingEnd(false);
    }
  };

  // Calculate route using OSRM
  const calculateRoute = async () => {
    if (!startLocation || !endLocation) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        setRouteCoords(coords);
        
        const distanceKm = route.distance / 1000;
        const durationMin = route.duration / 60;
        
        setDistance(distanceKm);
        setDuration(durationMin);
        
        onRouteCalculated(
          Math.round(distanceKm * 10) / 10,
          startLocation.address.split(',')[0],
          endLocation.address.split(',')[0],
          endLocation.lat,
          endLocation.lng
        );
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      const dist = calculateStraightLineDistance(
        startLocation.lat, startLocation.lng,
        endLocation.lat, endLocation.lng
      );
      setDistance(dist);
      onRouteCalculated(
        Math.round(dist * 10) / 10,
        startLocation.address.split(',')[0],
        endLocation.address.split(',')[0],
        endLocation.lat,
        endLocation.lng
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate straight-line distance (Haversine formula)
  const calculateStraightLineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        setStartLocation({ lat: latitude, lng: longitude, address });
        setStartSearch(address.split(',')[0]);
      },
      (error) => {
        let message = 'Could not get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location unavailable.';
            break;
          case error.TIMEOUT:
            message += 'Request timed out.';
            break;
        }
        alert(message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <Card className="w-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icons.map />
          </div>
          <div>
            <span className="text-xl font-semibold">Route Planner</span>
            <p className="text-emerald-100 text-sm font-normal mt-0.5">Select start and destination</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Search inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Start Location */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              Starting Point
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={startSearch}
                  onChange={(e) => handleSearchChange(e.target.value, true)}
                  placeholder="Enter starting address..."
                  className="pl-10 h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icons.location />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                className="h-11 w-11 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600"
                onClick={getCurrentLocation}
                title="Use my location"
              >
                <Icons.navigation />
              </Button>
              <Button 
                variant={selectingStart ? "default" : "outline"}
                size="icon"
                className={`h-11 w-11 ${selectingStart ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600'}`}
                onClick={() => {
                  setSelectingStart(!selectingStart);
                  setSelectingEnd(false);
                }}
                title="Select on map"
              >
                <Icons.crosshair />
              </Button>
            </div>
            {startResults.length > 0 && (
              <div className="absolute z-[1000] w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto">
                {startResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm border-b border-slate-100 last:border-b-0 flex items-start gap-3 transition-colors"
                    onClick={() => selectLocation(result, true)}
                  >
                    <span className="text-emerald-500 mt-0.5"><Icons.location /></span>
                    <span className="text-slate-700">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Location */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200"></span>
              Destination
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={endSearch}
                  onChange={(e) => handleSearchChange(e.target.value, false)}
                  placeholder="Enter destination..."
                  className="pl-10 h-11 border-slate-200 focus:border-red-500 focus:ring-red-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icons.location />
                </div>
              </div>
              <Button 
                variant={selectingEnd ? "default" : "outline"}
                size="icon"
                className={`h-11 w-11 ${selectingEnd ? 'bg-red-500 hover:bg-red-600' : 'border-slate-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600'}`}
                onClick={() => {
                  setSelectingEnd(!selectingEnd);
                  setSelectingStart(false);
                }}
                title="Select on map"
              >
                <Icons.crosshair />
              </Button>
            </div>
            {endResults.length > 0 && (
              <div className="absolute z-[1000] w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto">
                {endResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm border-b border-slate-100 last:border-b-0 flex items-start gap-3 transition-colors"
                    onClick={() => selectLocation(result, false)}
                  >
                    <span className="text-red-500 mt-0.5"><Icons.location /></span>
                    <span className="text-slate-700">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selection mode indicator */}
        {(selectingStart || selectingEnd) && (
          <div className={`p-3 rounded-xl text-sm text-center font-medium flex items-center justify-center gap-2 ${
            selectingStart 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <Icons.crosshair />
            Click anywhere on the map to set {selectingStart ? 'starting point' : 'destination'}
          </div>
        )}

        {/* Transport Mode Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Hybrid Journey Mode</Label>
            <span className="text-xs bg-gradient-to-r from-red-500 to-blue-500 text-transparent bg-clip-text font-semibold">
              Smart Car + {selectedMode === 'walk' ? 'Walk' : 'Bike'} Split
            </span>
          </div>
          
          {/* Journey Split Visual - Dynamic based on algorithm */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            {(() => {
              const { carDistance, activeDistance } = getHybridRouteSegments();
              const carPercent = distance ? Math.round((carDistance / distance) * 100) : 80;
              const activePercent = 100 - carPercent;
              return (
                <>
                  <div className="flex items-center gap-1 mb-3">
                    <div 
                      className="h-4 bg-gradient-to-r from-red-500 to-red-400 rounded-l-full transition-all duration-500" 
                      style={{ width: `${carPercent}%` }}
                    ></div>
                    <div 
                      className={`h-4 rounded-r-full transition-all duration-500 ${selectedMode === 'walk' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-green-400 to-green-500'}`}
                      style={{ width: `${activePercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-red-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Car: {carPercent}% {distance ? `(~${carDistance}km)` : ''}
                    </span>
                    <span className={`flex items-center gap-1.5 font-medium ${selectedMode === 'walk' ? 'text-blue-600' : 'text-green-600'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${selectedMode === 'walk' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                      {selectedMode === 'walk' ? 'Walk' : 'Bike'}: {activePercent}% {distance ? `(~${activeDistance}km)` : ''}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Smart Split Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>Smart Split:</strong> {selectedMode === 'walk' 
                  ? 'Walking capped at ~2.5km (25-30 min walk) for practicality' 
                  : 'Cycling capped at ~8km (20-25 min ride) for comfortable commute'}
              </div>
            </div>
          </div>

          {/* Second Half Mode Selection */}
          <div>
            <Label className="text-xs font-medium text-slate-500 mb-2 block">Choose Second Half Mode:</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['walk', 'bike'] as const).map((mode) => {
                const config = transportModes[mode];
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? `${config.borderColor} ${config.bgLight} shadow-lg` 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-2.5 rounded-full ${isSelected ? config.bgColor : 'bg-slate-100'} ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                      {config.icon}
                    </div>
                    <div className="text-left">
                      <span className={`font-semibold block ${isSelected ? config.textColor : 'text-slate-600'}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400">Second half</span>
                    </div>
                    {isSelected && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route color legend */}
          <div className="flex items-center justify-center gap-6 pt-1 text-xs text-slate-500 border-t border-slate-100 mt-2 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded bg-red-500"></span> Car (First Half)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded bg-blue-500"></span> Walk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded bg-green-500"></span> Bicycle
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200">
          {/* Map overlay gradient */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/10 to-transparent z-[400] pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent z-[400] pointer-events-none"></div>
          
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            {/* Modern map tiles - CartoDB Voyager */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <MapClickHandler 
              onMapClick={handleMapClick}
              selectingStart={selectingStart}
              selectingEnd={selectingEnd}
            />
            
            <FitBounds start={startLocation} end={endLocation} />
            
            {startLocation && (
              <Marker position={[startLocation.lat, startLocation.lng]} icon={StartIcon}>
                <Popup className="custom-popup">
                  <div className="font-semibold text-emerald-600">Start</div>
                  <div className="text-sm text-slate-600">{startLocation.address.split(',').slice(0, 2).join(', ')}</div>
                </Popup>
              </Marker>
            )}
            
            {endLocation && (
              <Marker position={[endLocation.lat, endLocation.lng]} icon={EndIcon}>
                <Popup className="custom-popup">
                  <div className="font-semibold text-red-600">Destination</div>
                  <div className="text-sm text-slate-600">{endLocation.address.split(',').slice(0, 2).join(', ')}</div>
                </Popup>
              </Marker>
            )}
            
            {routeCoords.length > 0 && (
              <>
                {/* Get split segments */}
                {(() => {
                  const { firstHalf, secondHalf } = getHybridRouteSegments();
                  const secondColor = transportModes[selectedMode].color;
                  return (
                    <>
                      {/* === FIRST HALF: CAR (RED) === */}
                      {/* Shadow for car segment */}
                      <Polyline
                        positions={firstHalf}
                        color="#000"
                        weight={12}
                        opacity={0.1}
                      />
                      {/* Glow for car segment */}
                      <Polyline
                        positions={firstHalf}
                        color="#ef4444"
                        weight={9}
                        opacity={0.25}
                      />
                      {/* Main car route - RED */}
                      <Polyline
                        positions={firstHalf}
                        color="#ef4444"
                        weight={6}
                        opacity={1}
                        lineCap="round"
                        lineJoin="round"
                      />

                      {/* === SECOND HALF: WALK/BIKE (BLUE/GREEN) === */}
                      {secondHalf.length > 1 && (
                        <>
                          {/* Shadow for second segment */}
                          <Polyline
                            positions={secondHalf}
                            color="#000"
                            weight={12}
                            opacity={0.1}
                          />
                          {/* Glow for second segment */}
                          <Polyline
                            positions={secondHalf}
                            color={secondColor}
                            weight={9}
                            opacity={0.25}
                          />
                          {/* Main walk/bike route */}
                          <Polyline
                            positions={secondHalf}
                            color={secondColor}
                            weight={6}
                            opacity={1}
                            lineCap="round"
                            lineJoin="round"
                          />
                        </>
                      )}

                      {/* Transition point marker */}
                      {firstHalf.length > 0 && secondHalf.length > 0 && (
                        <Marker 
                          position={firstHalf[firstHalf.length - 1]} 
                          icon={L.divIcon({
                            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
                              <circle cx="16" cy="16" r="14" fill="white" stroke="#374151" stroke-width="2"/>
                              <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="#374151">P</text>
                            </svg>`,
                            className: 'custom-marker',
                            iconSize: [28, 28],
                            iconAnchor: [14, 14],
                          })}
                        >
                          <Popup>
                            <div className="font-semibold text-slate-700">Parking Point</div>
                            <div className="text-sm text-slate-500">Switch from Car to {selectedMode === 'walk' ? 'Walking' : 'Bicycle'}</div>
                          </Popup>
                        </Marker>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </MapContainer>
        </div>

        {/* Calculate button and results */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Button
            onClick={calculateRoute}
            disabled={!startLocation || !endLocation || isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-purple-600 hover:to-blue-600 text-white shadow-lg h-12 px-8 text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating Route...
              </>
            ) : (
              <>
                <Icons.route />
                <span className="ml-2">Calculate Hybrid Route</span>
              </>
            )}
          </Button>

          {distance !== null && (
            <div className="flex flex-col gap-3 bg-slate-50 rounded-xl px-5 py-4 w-full">
              {(() => {
                const { carDistance, activeDistance } = getHybridRouteSegments();
                return (
                  <>
                    {/* Split Journey Header */}
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">Car</span>
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={`px-2 py-0.5 rounded ${selectedMode === 'walk' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {selectedMode === 'walk' ? 'Walk' : 'Bicycle'}
                      </span>
                    </div>
                    
                    {/* Distance Breakdown with Smart Split */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Car Distance */}
                      <div className="bg-white rounded-lg p-3 text-center border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{carDistance}</div>
                        <div className="text-xs text-slate-500">km by Car</div>
                      </div>
                      
                      {/* Walk/Bike Distance */}
                      <div className={`bg-white rounded-lg p-3 text-center border ${selectedMode === 'walk' ? 'border-blue-100' : 'border-green-100'}`}>
                        <div className={`text-2xl font-bold ${selectedMode === 'walk' ? 'text-blue-600' : 'text-green-600'}`}>
                          {activeDistance}
                        </div>
                        <div className="text-xs text-slate-500">km by {selectedMode === 'walk' ? 'Walk' : 'Bike'}</div>
                      </div>
                      
                      {/* Total */}
                      <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                        <div className="text-2xl font-bold text-slate-700">{distance.toFixed(1)}</div>
                        <div className="text-xs text-slate-500">km Total</div>
                      </div>
                    </div>

                    {/* Time & Calorie Estimates */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                        <Icons.clock />
                        <span>
                          ~{Math.round(carDistance / 40 * 60 + activeDistance / (selectedMode === 'walk' ? 5 : 15) * 60)} min total
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        <span>
                          ~{Math.round(activeDistance * (selectedMode === 'walk' ? 50 : 30))} cal burned
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
