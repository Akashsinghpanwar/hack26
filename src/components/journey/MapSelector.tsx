'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TransitOption, TransitStep } from '@/types';
import { TransitSchedulePanel } from './TransitSchedulePanel';
import { ParkingFinder } from './ParkingFinder';

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

// Component to fit map bounds to route with smooth animation
function FitBounds({ start, end, routeCoords, transitCoords, googleCoords }: { start: Location | null; end: Location | null; routeCoords: [number, number][]; transitCoords?: [number, number][]; googleCoords?: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    // Priority: google coords > transit coords > route coords > start/end points
    const coordsToFit = googleCoords && googleCoords.length > 0 ? googleCoords :
                        transitCoords && transitCoords.length > 0 ? transitCoords : routeCoords;
    
    if (coordsToFit.length > 0) {
      // Fit to entire route with smooth animation
      const bounds = L.latLngBounds(coordsToFit);
      map.flyToBounds(bounds, { 
        padding: [50, 50],
        duration: 1.2,
        easeLinearity: 0.25
      });
    } else if (start && end) {
      const bounds = L.latLngBounds([
        [start.lat, start.lng],
        [end.lat, end.lng]
      ]);
      map.flyToBounds(bounds, { 
        padding: [60, 60],
        duration: 1,
        easeLinearity: 0.25
      });
    } else if (start) {
      map.flyTo([start.lat, start.lng], 15, { duration: 0.8 });
    } else if (end) {
      map.flyTo([end.lat, end.lng], 15, { duration: 0.8 });
    }
  }, [start, end, routeCoords, transitCoords, googleCoords, map]);
  
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
  
  // New state for transport mode selection
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk' | 'bus' | 'train' | 'e-bike' | 'hybrid' | null>(null);
  const [transitOptions, setTransitOptions] = useState<TransitOption[]>([]);
  const [selectedTransitOption, setSelectedTransitOption] = useState<TransitOption | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [transitRouteCoords, setTransitRouteCoords] = useState<[number, number][]>([]);
  const [transitSteps, setTransitSteps] = useState<{ coords: [number, number][]; mode: string; color: string }[]>([]);
  
  // Google Maps route state (for car/bike/walk modes)
  const [googleRouteCoords, setGoogleRouteCoords] = useState<[number, number][]>([]);
  const [googleRouteDuration, setGoogleRouteDuration] = useState<number | null>(null);
  const [googleRouteCo2, setGoogleRouteCo2] = useState<number | null>(null);
  const [googleRouteCalories, setGoogleRouteCalories] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  
  // Parking state
  const [selectedParking, setSelectedParking] = useState<ParkingSpot | null>(null);
  const [allParkingSpots, setAllParkingSpots] = useState<ParkingSpot[]>([]);
  
  // Departure time state
  const [departureTime, setDepartureTime] = useState<string>('');
  const [useCustomDepartureTime, setUseCustomDepartureTime] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-calculate route when both locations are set
  useEffect(() => {
    if (startLocation && endLocation && routeCoords.length === 0 && !isLoading) {
      calculateRoute();
    }
  }, [startLocation, endLocation]);

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

  // All transport mode options for selection
  const allTransportModes = {
    car: { 
      label: 'Car', 
      icon: '🚗', 
      color: '#ef4444',
      bgColor: 'bg-red-500',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-500',
    },
    bike: { 
      label: 'Bicycle', 
      icon: '🚴', 
      color: '#22c55e',
      bgColor: 'bg-green-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-500',
    },
    walk: { 
      label: 'Walk', 
      icon: '🚶', 
      color: '#3b82f6',
      bgColor: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-500',
    },
    bus: { 
      label: 'Bus', 
      icon: '🚌', 
      color: '#f97316',
      bgColor: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-500',
    },
    train: { 
      label: 'Train', 
      icon: '🚆', 
      color: '#8b5cf6',
      bgColor: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
    'e-bike': { 
      label: 'E-Bike', 
      icon: '⚡🚴', 
      color: '#06b6d4',
      bgColor: 'bg-cyan-500',
      bgLight: 'bg-cyan-50',
      borderColor: 'border-cyan-500',
    },
    hybrid: { 
      label: 'Transit+Active', 
      icon: '🚌+🚶', 
      color: '#a855f7',
      bgColor: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
  };

  // Decode Google's encoded polyline format
  const decodePolyline = (encoded: string): [number, number][] => {
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
  };

  // Fetch transit options (bus/train)
  const fetchTransitOptions = async (mode: 'bus' | 'train') => {
    if (!startLocation || !endLocation) return;
    
    setTransitLoading(true);
    setTransitError(null);
    setTransitOptions([]);
    setSelectedTransitOption(null);
    setTransitRouteCoords([]);
    setTransitSteps([]);
    
    // Calculate departure time - use custom time or current time
    let depTime: number;
    if (useCustomDepartureTime && departureTime) {
      const [hours, minutes] = departureTime.split(':').map(Number);
      const now = new Date();
      now.setHours(hours, minutes, 0, 0);
      // If time is in past, use tomorrow
      if (now.getTime() < Date.now()) {
        now.setDate(now.getDate() + 1);
      }
      depTime = Math.floor(now.getTime() / 1000);
    } else {
      depTime = Math.floor(Date.now() / 1000);
    }
    
    try {
      const response = await fetch('/api/transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: startLocation.lat, lng: startLocation.lng },
          destination: { lat: endLocation.lat, lng: endLocation.lng },
          mode,
          departureTime: depTime,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTransitOptions(data.options);
        if (data.options.length === 0) {
          setTransitError(data.error || `No ${mode} routes found for this journey`);
        }
      } else {
        setTransitError(data.error || 'Failed to fetch transit options');
      }
    } catch (error) {
      console.error('Transit fetch error:', error);
      setTransitError('Failed to fetch transit schedules. Please try again.');
    } finally {
      setTransitLoading(false);
    }
  };

  // Fetch Google Maps directions for car/bike/walk/e-bike modes
  const fetchGoogleDirections = async (mode: 'car' | 'bike' | 'walk' | 'e-bike') => {
    if (!startLocation || !endLocation) return;
    
    setRouteLoading(true);
    setGoogleRouteCoords([]);
    setGoogleRouteDuration(null);
    setGoogleRouteCo2(null);
    setGoogleRouteCalories(null);
    
    try {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: startLocation.lat, lng: startLocation.lng },
          destination: { lat: endLocation.lat, lng: endLocation.lng },
          mode,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.route) {
        setGoogleRouteCoords(data.route.polyline);
        setGoogleRouteDuration(data.route.duration);
        setGoogleRouteCo2(data.route.co2Emissions);
        setGoogleRouteCalories(data.route.calories);
        setDistance(data.route.distance);
      } else {
        // Fallback to existing route if Google fails
        console.log('Google directions failed, using existing route');
      }
    } catch (error) {
      console.error('Google directions error:', error);
    } finally {
      setRouteLoading(false);
    }
  };

  // Handle transit option selection
  const handleTransitOptionSelect = (option: TransitOption) => {
    setSelectedTransitOption(option);
    
    // Decode the overall route polyline
    const coords = decodePolyline(option.polyline);
    setTransitRouteCoords(coords);
    
    // Decode individual step polylines for colored segments
    const steps: { coords: [number, number][]; mode: string; color: string }[] = [];
    for (const step of option.steps) {
      const stepCoords = decodePolyline(step.polyline);
      const color = step.mode === 'WALKING' ? '#3b82f6' : // Blue for walking
        option.serviceType === 'BUS' ? '#f97316' : // Orange for bus
        '#8b5cf6'; // Purple for train/rail
      steps.push({ coords: stepCoords, mode: step.mode, color });
    }
    setTransitSteps(steps);
  };

  // Handle transport mode selection
  const handleTransportModeSelect = (mode: typeof transportMode) => {
    setTransportMode(mode);
    
    // Clear all route-specific states
    setSelectedTransitOption(null);
    setTransitRouteCoords([]);
    setTransitSteps([]);
    setTransitOptions([]);
    setTransitError(null);
    setGoogleRouteCoords([]);
    setGoogleRouteDuration(null);
    setGoogleRouteCo2(null);
    setGoogleRouteCalories(null);
    setSelectedParking(null);
    setAllParkingSpots([]);
    
    // Fetch appropriate route based on mode
    if (mode === 'bus' || mode === 'train') {
      fetchTransitOptions(mode);
    } else if (mode === 'car' || mode === 'bike' || mode === 'walk' || mode === 'e-bike') {
      fetchGoogleDirections(mode);
    }
    // For hybrid mode, we use the existing OSRM route
  };

  // Handle parking selection
  const handleParkingSelect = (spot: ParkingSpot) => {
    setSelectedParking(spot);
  };

  // Smart algorithm to split route into Transit (Bus/Train) + Walk/Bike
  // Split Logic Table:
  // | Distance   | Walking Mode         | Cycling Mode          |
  // |------------|---------------------|-----------------------|
  // | < 5 km     | 40% walk (max 2km)  | 50% bike (max 4km)    |
  // | 5-10 km    | 25% walk (max 2.5km)| 40% bike (max 6km)    |
  // | 10-20 km   | 15% walk (max 2.5km)| 30% bike (max 8km)    |
  // | > 20 km    | Fixed ~2km walk     | Fixed ~8km bike       |
  
  const getHybridRouteSegments = () => {
    if (routeCoords.length < 4 || !distance) {
      return { 
        firstHalf: routeCoords, 
        secondHalf: [], 
        transitDistance: 0, 
        activeDistance: 0, 
        activeCalories: 0,
        activeMode: selectedMode as 'walk' | 'bike',
      };
    }

    let activeDistanceKm: number;
    
    if (selectedMode === 'walk') {
      // Walking Mode Split Logic
      if (distance < 5) {
        // < 5 km: 40% walk (max 2km)
        activeDistanceKm = Math.min(distance * 0.4, 2);
      } else if (distance <= 10) {
        // 5-10 km: 25% walk (max 2.5km)
        activeDistanceKm = Math.min(distance * 0.25, 2.5);
      } else if (distance <= 20) {
        // 10-20 km: 15% walk (max 2.5km)
        activeDistanceKm = Math.min(distance * 0.15, 2.5);
      } else {
        // > 20 km: Fixed ~2km walk
        activeDistanceKm = 2;
      }
    } else {
      // Cycling Mode Split Logic
      if (distance < 5) {
        // < 5 km: 50% bike (max 4km)
        activeDistanceKm = Math.min(distance * 0.5, 4);
      } else if (distance <= 10) {
        // 5-10 km: 40% bike (max 6km)
        activeDistanceKm = Math.min(distance * 0.4, 6);
      } else if (distance <= 20) {
        // 10-20 km: 30% bike (max 8km)
        activeDistanceKm = Math.min(distance * 0.3, 8);
      } else {
        // > 20 km: Fixed ~8km bike
        activeDistanceKm = 8;
      }
    }

    const transitDistanceKm = distance - activeDistanceKm;

    // Calculate the split point in the route coordinates
    // Transit comes first, then active mode at the end
    const transitRatio = transitDistanceKm / distance;
    
    // Find the index to split at (transit portion first)
    const splitIndex = Math.floor(routeCoords.length * transitRatio);
    const adjustedSplitIndex = Math.max(1, Math.min(splitIndex, routeCoords.length - 2));

    const transitDistance = Math.round(transitDistanceKm * 10) / 10;
    const activeDistance = Math.round(activeDistanceKm * 10) / 10;
    
    // Calculate calories burned for active portion
    // Walking: ~50 calories per km, Cycling: ~30 calories per km
    const caloriesPerKm = selectedMode === 'walk' ? 50 : 30;
    const activeCalories = Math.round(activeDistance * caloriesPerKm);

    return {
      firstHalf: routeCoords.slice(0, adjustedSplitIndex + 1), // Transit segment
      secondHalf: routeCoords.slice(adjustedSplitIndex),       // Walk/Bike segment
      transitDistance,
      activeDistance,
      activeCalories,
      activeMode: selectedMode as 'walk' | 'bike',
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

    // Reset route when location changes
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);

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
    
    // Reset route when location changes
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);
    
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
    <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icons.map />
          </div>
          <div>
            <span className="text-base sm:text-xl font-semibold">Route Planner</span>
            <p className="text-emerald-100 text-xs sm:text-sm font-normal mt-0.5">Select start and destination</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-5">
        {/* Search inputs */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {/* Start Location */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              Starting Point
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={startSearch}
                  onChange={(e) => handleSearchChange(e.target.value, true)}
                  placeholder="Enter starting address..."
                  className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icons.location />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600"
                onClick={getCurrentLocation}
                title="Use my location"
              >
                <Icons.navigation />
              </Button>
              <Button 
                variant={selectingStart ? "default" : "outline"}
                size="icon"
                className={`h-10 w-10 sm:h-11 sm:w-11 ${selectingStart ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600'}`}
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
              <div className="absolute z-[1000] w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-48 sm:max-h-52 overflow-y-auto">
                {startResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-emerald-50 text-xs sm:text-sm border-b border-slate-100 last:border-b-0 flex items-start gap-2 sm:gap-3 transition-colors"
                    onClick={() => selectLocation(result, true)}
                  >
                    <span className="text-emerald-500 mt-0.5"><Icons.location /></span>
                    <span className="text-slate-700 line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Location */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 ring-2 ring-red-200"></span>
              Destination
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={endSearch}
                  onChange={(e) => handleSearchChange(e.target.value, false)}
                  placeholder="Enter destination..."
                  className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm border-slate-200 focus:border-red-500 focus:ring-red-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icons.location />
                </div>
              </div>
              <Button 
                variant={selectingEnd ? "default" : "outline"}
                size="icon"
                className={`h-10 w-10 sm:h-11 sm:w-11 ${selectingEnd ? 'bg-red-500 hover:bg-red-600' : 'border-slate-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600'}`}
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
              <div className="absolute z-[1000] w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-48 sm:max-h-52 overflow-y-auto">
                {endResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-red-50 text-xs sm:text-sm border-b border-slate-100 last:border-b-0 flex items-start gap-2 sm:gap-3 transition-colors"
                    onClick={() => selectLocation(result, false)}
                  >
                    <span className="text-red-500 mt-0.5"><Icons.location /></span>
                    <span className="text-slate-700 line-clamp-2">{result.display_name}</span>
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

        {/* Transport Mode Selection - Show after route is calculated */}
        {distance !== null && (
          <div className="space-y-4">
            {/* Only show header and other modes if car is NOT selected */}
            {transportMode !== 'car' && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-slate-800">Select Transport Mode</Label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {distance.toFixed(1)} km
                  </span>
                </div>
                
                {/* Transport Mode Grid - Hide when car is selected */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.entries(allTransportModes) as [keyof typeof allTransportModes, typeof allTransportModes.car][]).map(([mode, config]) => {
                    const isSelected = transportMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => handleTransportModeSelect(mode)}
                        className={`relative p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected 
                            ? `${config.borderColor} ${config.bgLight} shadow-md scale-105` 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-xl sm:text-2xl mb-1">{config.icon}</div>
                        <div className="font-medium text-xs text-slate-800">{config.label}</div>
                        {isSelected && (
                          <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${config.bgColor} rounded-full flex items-center justify-center`}>
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Car Mode Selected - Show car info with CO2 and parking */}
            {transportMode === 'car' && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 text-white rounded-lg">
                      🚗
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Car Journey</div>
                      <div className="text-xs text-slate-500">{distance.toFixed(1)} km total distance</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransportMode(null)}
                    className="text-xs"
                  >
                    Change Mode
                  </Button>
                </div>
                
                {/* CO2 Stats Card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-red-100">
                    <div className="text-2xl font-bold text-slate-700">{distance.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">km</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                    <div className="text-2xl font-bold text-slate-700">{googleRouteDuration || Math.round(distance / 40 * 60)}</div>
                    <div className="text-xs text-slate-500">min</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-red-100">
                    <div className="text-2xl font-bold text-red-600">{((googleRouteCo2 || distance * 171) / 1000).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">kg CO₂</div>
                  </div>
                </div>

                {/* Parking Info */}
                {selectedParking && (
                  <div className={`flex items-center gap-2 rounded-lg p-3 border ${
                    selectedParking.fee === 'free' 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <span className="text-lg">🅿️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          selectedParking.fee === 'free' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>{selectedParking.name}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">AUTO</span>
                      </div>
                      <div className={`text-xs ${
                        selectedParking.fee === 'free' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {selectedParking.distance}m from destination • {selectedParking.fee === 'free' ? 'FREE' : selectedParking.fee === 'paid' ? 'PAID' : 'CHECK FEE'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Departure Time Picker - Show for bus/train */}
            {(transportMode === 'bus' || transportMode === 'train') && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 rounded-lg">
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">Departure Time</div>
                      <div className="text-xs text-slate-500">
                        {useCustomDepartureTime && departureTime ? `Searching for ${departureTime}` : 'Searching from now'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => {
                        setDepartureTime(e.target.value);
                        setUseCustomDepartureTime(!!e.target.value);
                      }}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {useCustomDepartureTime && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDepartureTime('');
                          setUseCustomDepartureTime(false);
                          if (transportMode === 'bus' || transportMode === 'train') {
                            fetchTransitOptions(transportMode);
                          }
                        }}
                        className="text-xs"
                      >
                        Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (transportMode === 'bus' || transportMode === 'train') {
                          fetchTransitOptions(transportMode);
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transit Schedule Panel - Show for bus/train */}
            {(transportMode === 'bus' || transportMode === 'train') && (
              <TransitSchedulePanel
                options={transitOptions}
                loading={transitLoading}
                error={transitError || undefined}
                selectedOption={selectedTransitOption}
                onSelectOption={handleTransitOptionSelect}
                mode={transportMode}
              />
            )}

            {/* Route Info for bike/walk/e-bike modes with CO2 data */}
            {googleRouteCoords.length > 0 && transportMode && ['bike', 'walk', 'e-bike'].includes(transportMode) && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                transportMode === 'bike' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                transportMode === 'walk' ? 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200' :
                'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
              }`}>
                {/* Mode Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                  <span className="text-xl">
                    {transportMode === 'bike' ? '🚴' : transportMode === 'walk' ? '🚶' : '⚡🚴'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {transportMode === 'bike' ? 'Bicycle' : transportMode === 'walk' ? 'Walking' : 'E-Bike'} Journey
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/70 rounded-lg p-3 border border-slate-100">
                    <div className="text-2xl font-bold text-slate-800">{distance?.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">km</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-slate-100">
                    <div className="text-2xl font-bold text-slate-700">{googleRouteDuration}</div>
                    <div className="text-xs text-slate-500">min</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-slate-100">
                    <div className={`text-2xl font-bold ${
                      transportMode === 'walk' || transportMode === 'bike' ? 'text-emerald-600' : 'text-purple-600'
                    }`}>
                      {((googleRouteCo2 || 0) / 1000).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">kg CO₂</div>
                  </div>
                </div>

                {/* Calories */}
                {googleRouteCalories && googleRouteCalories > 0 && (
                  <div className="text-center pt-2 border-t border-slate-200/50">
                    <span className="text-sm text-emerald-600 font-medium">
                      🔥 ~{googleRouteCalories} calories burned
                    </span>
                  </div>
                )}

                {/* Eco Badge for zero-emission modes */}
                {(transportMode === 'walk' || transportMode === 'bike') && (
                  <div className="flex items-center justify-center gap-2 bg-emerald-100 rounded-lg p-2 text-emerald-700 text-sm font-medium">
                    🌱 Zero Emission Journey!
                  </div>
                )}
              </div>
            )}

            {/* Loading indicator for route fetching */}
            {routeLoading && (
              <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-xl">
                <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-slate-600">Finding best route...</span>
              </div>
            )}

            {/* Silent Parking Finder - runs in background for car mode */}
            {transportMode === 'car' && endLocation && (
              <ParkingFinder
                destinationLat={endLocation.lat}
                destinationLon={endLocation.lng}
                routeCoords={googleRouteCoords.length > 0 ? googleRouteCoords : routeCoords}
                onSelectParking={handleParkingSelect}
                onParkingSpotsFound={setAllParkingSpots}
                autoSearch={true}
              />
            )}
          </div>
        )}

        {/* Transport Mode Selector - Hybrid Journey (only show when hybrid mode selected) */}
        {transportMode === 'hybrid' && distance !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Transit + Active Mode</Label>
            <span className="text-xs bg-gradient-to-r from-orange-500 to-green-500 text-transparent bg-clip-text font-semibold">
              🚌 Transit + {selectedMode === 'walk' ? '🚶 Walk' : '🚴 Bike'}
            </span>
          </div>
          
          {/* Journey Split Visual - Transit + Walk/Bike */}
          <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-xl p-4 border border-slate-200">
            {(() => {
              const { transitDistance, activeDistance, activeCalories } = getHybridRouteSegments();
              const transitPercent = distance ? Math.round((transitDistance / distance) * 100) : 80;
              const activePercent = 100 - transitPercent;
              // CO2 for hybrid mode: transit portion emits 89 g/km, active portion emits 0
              const hybridCo2 = Math.round(transitDistance * 89);
              return (
                <>
                  <div className="flex items-center gap-1 mb-3">
                    <div 
                      className="h-4 bg-gradient-to-r from-orange-500 to-orange-400 rounded-l-full transition-all duration-500" 
                      style={{ width: `${transitPercent}%` }}
                    ></div>
                    <div 
                      className={`h-4 rounded-r-full transition-all duration-500 ${selectedMode === 'walk' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-green-400 to-green-500'}`}
                      style={{ width: `${activePercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-orange-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                      🚌 Transit: {transitPercent}% (~{transitDistance}km)
                    </span>
                    <span className={`flex items-center gap-1.5 font-medium ${selectedMode === 'walk' ? 'text-blue-600' : 'text-green-600'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${selectedMode === 'walk' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                      {selectedMode === 'walk' ? '🚶 Walk' : '🚴 Bike'}: {activePercent}% (~{activeDistance}km)
                    </span>
                  </div>
                  
                  {/* Calorie Burn & CO2 Saved Display */}
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-3">
                    <div className="bg-white rounded-lg px-4 py-2 border border-orange-200 flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      <div>
                        <div className="text-lg font-bold text-orange-600">{activeCalories} cal</div>
                        <div className="text-[10px] text-slate-500">Burned from {selectedMode === 'walk' ? 'walking' : 'cycling'}</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg px-4 py-2 border border-emerald-200 flex items-center gap-2">
                      <span className="text-xl">🌱</span>
                      <div>
                        <div className="text-lg font-bold text-emerald-600">{hybridCo2} g</div>
                        <div className="text-[10px] text-slate-500">CO₂ emitted</div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Smart Split Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>Last Mile:</strong> {selectedMode === 'walk' 
                  ? 'Walking capped at ~2km for comfortable last mile' 
                  : 'Cycling capped at ~5km to burn calories while commuting'}
              </div>
            </div>
          </div>

          {/* Second Half Mode Selection - Walk or Bike */}
          <div>
            <Label className="text-xs font-medium text-slate-500 mb-2 block">Choose Last Mile Mode:</Label>
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
                      <span className={`font-semibold block ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400">{mode === 'walk' ? '50 cal/km' : '30 cal/km'}</span>
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
              <span className="w-5 h-1.5 rounded bg-orange-500"></span> Transit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded bg-blue-500"></span> Walk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded bg-green-500"></span> Bicycle
            </span>
          </div>
        </div>
        )}

        {/* Hybrid Travel Button - Above Map */}
        {distance !== null && (
          <div className="flex justify-center">
            <Button
              onClick={() => handleTransportModeSelect('hybrid')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                transportMode === 'hybrid'
                  ? 'bg-gradient-to-r from-orange-500 via-purple-500 to-green-500 text-white scale-105'
                  : 'bg-gradient-to-r from-orange-100 via-purple-100 to-green-100 text-slate-700 hover:from-orange-200 hover:via-purple-200 hover:to-green-200 border border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🚌</span>
                <span>+</span>
                <span>{selectedMode === 'walk' ? '🚶' : '🚴'}</span>
                <span className="ml-2">Hybrid Travel</span>
                {transportMode === 'hybrid' && (
                  <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </Button>
          </div>
        )}

        {/* Map Container - Standing Rectangle */}
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[500px] min-h-[350px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200">
          {/* Map overlay gradient */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/10 to-transparent z-[400] pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent z-[400] pointer-events-none"></div>
          
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            {/* Esri World Street Map - Professional detailed street map */}
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, FAO, NOAA, USGS'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            />
            
            <MapClickHandler 
              onMapClick={handleMapClick}
              selectingStart={selectingStart}
              selectingEnd={selectingEnd}
            />
            
            <FitBounds start={startLocation} end={endLocation} routeCoords={routeCoords} transitCoords={transitRouteCoords} googleCoords={googleRouteCoords} />
            
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
            
            {/* Default Route Preview - show when no mode selected yet */}
            {routeCoords.length > 0 && !transportMode && (
              <>
                <Polyline
                  positions={routeCoords}
                  color="#94a3b8"
                  weight={5}
                  opacity={0.6}
                  dashArray="10, 10"
                  lineCap="round"
                />
              </>
            )}
            
            {/* Google Maps Route - for car/bike/walk/e-bike modes */}
            {googleRouteCoords.length > 0 && transportMode && ['car', 'bike', 'walk', 'e-bike'].includes(transportMode) && (
              <>
                {/* Shadow */}
                <Polyline
                  positions={googleRouteCoords}
                  color="#000"
                  weight={12}
                  opacity={0.1}
                />
                {/* Glow */}
                <Polyline
                  positions={googleRouteCoords}
                  color={allTransportModes[transportMode as keyof typeof allTransportModes]?.color || '#3b82f6'}
                  weight={9}
                  opacity={0.25}
                />
                {/* Main route */}
                <Polyline
                  positions={googleRouteCoords}
                  color={allTransportModes[transportMode as keyof typeof allTransportModes]?.color || '#3b82f6'}
                  weight={6}
                  opacity={1}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}
            
            {/* Fallback Route - when Google fails, use OSRM route with mode color */}
            {routeCoords.length > 0 && googleRouteCoords.length === 0 && transportMode && ['car', 'bike', 'walk', 'e-bike'].includes(transportMode) && !routeLoading && (
              <>
                {/* Shadow */}
                <Polyline
                  positions={routeCoords}
                  color="#000"
                  weight={12}
                  opacity={0.1}
                />
                {/* Main route with mode color */}
                <Polyline
                  positions={routeCoords}
                  color={allTransportModes[transportMode as keyof typeof allTransportModes]?.color || '#3b82f6'}
                  weight={6}
                  opacity={1}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}
            
            {/* Hybrid Route (OSRM-based split route) - only for hybrid mode */}
            {routeCoords.length > 0 && transportMode === 'hybrid' && (
              <>
                {/* Get split segments */}
                {(() => {
                  const { firstHalf, secondHalf } = getHybridRouteSegments();
                  const secondColor = transportModes[selectedMode].color;
                  return (
                    <>
                      {/* === FIRST HALF: TRANSIT (ORANGE) === */}
                      {/* Shadow for transit segment */}
                      <Polyline
                        positions={firstHalf}
                        color="#000"
                        weight={12}
                        opacity={0.1}
                      />
                      {/* Glow for transit segment */}
                      <Polyline
                        positions={firstHalf}
                        color="#f97316"
                        weight={9}
                        opacity={0.25}
                      />
                      {/* Main transit route - ORANGE */}
                      <Polyline
                        positions={firstHalf}
                        color="#f97316"
                        weight={6}
                        opacity={1}
                        lineCap="round"
                        lineJoin="round"
                      />

                      {/* === SECOND HALF: WALK/BIKE (BLUE/GREEN) - PROMINENT === */}
                      {secondHalf.length > 1 && (
                        <>
                          {/* White border for contrast */}
                          <Polyline
                            positions={secondHalf}
                            color="#fff"
                            weight={12}
                            opacity={1}
                          />
                          {/* Animated dashed pattern for walk/bike */}
                          <Polyline
                            positions={secondHalf}
                            color={secondColor}
                            weight={8}
                            opacity={1}
                            dashArray="12, 8"
                            lineCap="round"
                            lineJoin="round"
                          />
                          {/* Inner highlight line */}
                          <Polyline
                            positions={secondHalf}
                            color={selectedMode === 'walk' ? '#93c5fd' : '#86efac'}
                            weight={4}
                            opacity={0.8}
                            dashArray="12, 8"
                            lineCap="round"
                          />
                        </>
                      )}

                      {/* Transition point marker - Transit Stop */}
                      {firstHalf.length > 0 && secondHalf.length > 0 && (
                        <Marker 
                          position={firstHalf[firstHalf.length - 1]} 
                          icon={L.divIcon({
                            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
                              <circle cx="16" cy="16" r="14" fill="#f97316" stroke="white" stroke-width="2"/>
                              <text x="16" y="21" text-anchor="middle" font-size="12" fill="white">🚌</text>
                            </svg>`,
                            className: 'custom-marker',
                            iconSize: [28, 28],
                            iconAnchor: [14, 14],
                          })}
                        >
                          <Popup>
                            <div className="font-semibold text-orange-600">Transit Stop</div>
                            <div className="text-sm text-slate-500">Get off here & {selectedMode === 'walk' ? 'walk' : 'cycle'} to destination</div>
                          </Popup>
                        </Marker>
                      )}
                    </>
                  );
                })()}
              </>
            )}
            
            {/* Transit Route Visualization */}
            {transitSteps.length > 0 && selectedTransitOption && (
              <>
                {transitSteps.map((step, index) => (
                  <Polyline
                    key={`transit-step-${index}`}
                    positions={step.coords}
                    color={step.color}
                    weight={step.mode === 'WALKING' ? 4 : 6}
                    opacity={1}
                    lineCap="round"
                    lineJoin="round"
                    dashArray={step.mode === 'WALKING' ? '8, 12' : undefined}
                  />
                ))}
                
                {/* Bus/Train stop markers for transit steps */}
                {selectedTransitOption.steps
                  .filter(step => step.transitDetails)
                  .map((step, index) => (
                    <React.Fragment key={`transit-stops-${index}`}>
                      {/* Departure stop */}
                      <Marker
                        position={[step.startLocation.lat, step.startLocation.lng]}
                        icon={L.divIcon({
                          html: `<div class="w-4 h-4 rounded-full bg-white border-2 ${
                            selectedTransitOption.serviceType === 'BUS' ? 'border-orange-500' : 'border-purple-500'
                          } shadow-md"></div>`,
                          className: 'custom-marker',
                          iconSize: [16, 16],
                          iconAnchor: [8, 8],
                        })}
                      >
                        <Popup>
                          <div className="font-semibold">{step.transitDetails?.departureStop}</div>
                          <div className="text-sm text-slate-500">
                            {step.transitDetails?.lineName} - Departs {step.transitDetails?.departureTime}
                          </div>
                        </Popup>
                      </Marker>
                      
                      {/* Arrival stop */}
                      <Marker
                        position={[step.endLocation.lat, step.endLocation.lng]}
                        icon={L.divIcon({
                          html: `<div class="w-4 h-4 rounded-full bg-white border-2 ${
                            selectedTransitOption.serviceType === 'BUS' ? 'border-orange-500' : 'border-purple-500'
                          } shadow-md"></div>`,
                          className: 'custom-marker',
                          iconSize: [16, 16],
                          iconAnchor: [8, 8],
                        })}
                      >
                        <Popup>
                          <div className="font-semibold">{step.transitDetails?.arrivalStop}</div>
                          <div className="text-sm text-slate-500">
                            {step.transitDetails?.lineName} - Arrives {step.transitDetails?.arrivalTime}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  ))}
              </>
            )}

            {/* All Parking Spots Markers - Show all spots for car mode */}
            {transportMode === 'car' && allParkingSpots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lon]}
                icon={L.divIcon({
                  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="10" fill="${spot.fee === 'free' ? '#10b981' : spot.fee === 'paid' ? '#f59e0b' : '#94a3b8'}" stroke="white" stroke-width="2" opacity="${selectedParking?.id === spot.id ? '1' : '0.8'}"/>
                    <text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="white">P</text>
                  </svg>`,
                  className: 'parking-marker',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
                eventHandlers={{
                  click: () => setSelectedParking(spot),
                }}
              >
                <Popup>
                  <div className="font-semibold text-slate-800">{spot.name}</div>
                  <div className="text-sm text-slate-500">{spot.distance}m from destination</div>
                  <div className={`text-xs font-bold mt-1 ${spot.fee === 'free' ? 'text-emerald-600' : spot.fee === 'paid' ? 'text-amber-600' : 'text-slate-500'}`}>
                    {spot.fee === 'free' ? 'FREE PARKING' : spot.fee === 'paid' ? 'PAID PARKING' : 'CHECK FEE'}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Selected Parking Marker - Only show for car mode */}
            {selectedParking && transportMode === 'car' && (
              <Marker
                position={[selectedParking.lat, selectedParking.lon]}
                icon={L.divIcon({
                  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
                    <circle cx="16" cy="16" r="14" fill="${selectedParking.fee === 'free' ? '#10b981' : '#f59e0b'}" stroke="white" stroke-width="2"/>
                    <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="white">P</text>
                  </svg>`,
                  className: 'custom-marker',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })}
              >
                <Popup>
                  <div className="font-semibold text-slate-800">{selectedParking.name}</div>
                  <div className="text-sm text-slate-500">{selectedParking.distance}m from destination</div>
                  <div className={`text-xs font-bold mt-1 ${selectedParking.fee === 'free' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedParking.fee === 'free' ? 'FREE PARKING' : selectedParking.fee === 'paid' ? 'PAID PARKING' : 'CHECK FEE'}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Calculate button and results */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Button
            onClick={calculateRoute}
            disabled={!startLocation || !endLocation || isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg h-12 px-8 text-base"
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
                <span className="ml-2">Calculate Route</span>
              </>
            )}
          </Button>

          {/* Hybrid Mode Results - Transit + Walk/Bike split */}
          {distance !== null && transportMode === 'hybrid' && (
            <div className="flex flex-col gap-3 bg-gradient-to-r from-orange-50 to-green-50 rounded-xl px-5 py-4 w-full">
              {(() => {
                const { transitDistance, activeDistance, activeCalories } = getHybridRouteSegments();
                const hybridCo2Bottom = Math.round(transitDistance * 89);
                return (
                  <>
                    {/* Split Journey Header */}
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700">🚌 Transit</span>
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={`px-2 py-0.5 rounded ${selectedMode === 'walk' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {selectedMode === 'walk' ? '🚶 Walk' : '🚴 Bicycle'}
                      </span>
                    </div>
                    
                    {/* Distance Breakdown with Smart Split */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Transit Distance */}
                      <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
                        <div className="text-2xl font-bold text-orange-600">{transitDistance}</div>
                        <div className="text-xs text-slate-500">km Transit</div>
                      </div>
                      
                      {/* Walk/Bike Distance */}
                      <div className={`bg-white rounded-lg p-3 text-center border ${selectedMode === 'walk' ? 'border-blue-100' : 'border-green-100'}`}>
                        <div className={`text-2xl font-bold ${selectedMode === 'walk' ? 'text-blue-600' : 'text-green-600'}`}>
                          {activeDistance}
                        </div>
                        <div className="text-xs text-slate-500">km {selectedMode === 'walk' ? 'Walk' : 'Bike'}</div>
                      </div>
                      
                      {/* Total */}
                      <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                        <div className="text-2xl font-bold text-slate-700">{distance.toFixed(1)}</div>
                        <div className="text-xs text-slate-500">km Total</div>
                      </div>
                    </div>

                    {/* Time, Calorie & CO2 Estimates */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                        <Icons.clock />
                        <span>
                          ~{Math.round(transitDistance / 25 * 60 + activeDistance / (selectedMode === 'walk' ? 5 : 15) * 60)} min
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                        <span className="text-lg">🔥</span>
                        <span>
                          ~{activeCalories} cal
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                        <span className="text-lg">🌱</span>
                        <span>
                          ~{hybridCo2Bottom} g CO₂
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Other Modes Results (Walk, Bike, E-Bike) */}
          {distance !== null && transportMode && !['car', 'hybrid', 'bus', 'train'].includes(transportMode) && (
            <div className="flex flex-col gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl px-5 py-4 w-full">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  {transportMode === 'walk' ? '🚶 Walking' : transportMode === 'bike' ? '🚴 Cycling' : '⚡🚴 E-Bike'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-600">{distance.toFixed(1)}</div>
                  <div className="text-xs text-slate-500">km</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                  <div className="text-2xl font-bold text-slate-700">{googleRouteDuration || Math.round(distance / (transportMode === 'walk' ? 5 : 15) * 60)}</div>
                  <div className="text-xs text-slate-500">min</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">{googleRouteCalories || Math.round(distance * (transportMode === 'walk' ? 50 : 30))}</div>
                  <div className="text-xs text-slate-500">🔥 cal</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
