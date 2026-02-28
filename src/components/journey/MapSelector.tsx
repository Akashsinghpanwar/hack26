'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// Fix Leaflet default marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const StartIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const EndIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  onRouteCalculated: (distance: number, from: string, to: string) => void;
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
      map.fitBounds(bounds, { padding: [50, 50] });
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
  useMapEvents({
    click: (e) => {
      if (selectingStart || selectingEnd) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

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
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const location: Location = { lat, lng, address };

    if (selectingStart) {
      setStartLocation(location);
      setStartSearch(address.split(',')[0]);
      setSelectingStart(false);
    } else if (selectingEnd) {
      setEndLocation(location);
      setEndSearch(address.split(',')[0]);
      setSelectingEnd(false);
    }
  };

  // Calculate route using OSRM
  const calculateRoute = async () => {
    if (!startLocation || !endLocation) return;

    setIsLoading(true);
    try {
      // Using OSRM Demo server for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] // Swap lng,lat to lat,lng
        );
        setRouteCoords(coords);
        
        const distanceKm = route.distance / 1000;
        const durationMin = route.duration / 60;
        
        setDistance(distanceKm);
        setDuration(durationMin);
        
        // Notify parent component
        onRouteCalculated(
          Math.round(distanceKm * 10) / 10,
          startLocation.address.split(',')[0],
          endLocation.address.split(',')[0]
        );
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback to straight-line distance
      const dist = calculateStraightLineDistance(
        startLocation.lat, startLocation.lng,
        endLocation.lat, endLocation.lng
      );
      setDistance(dist);
      onRouteCalculated(
        Math.round(dist * 10) / 10,
        startLocation.address.split(',')[0],
        endLocation.address.split(',')[0]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate straight-line distance (Haversine formula)
  const calculateStraightLineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          setStartLocation({ lat: latitude, lng: longitude, address });
          setStartSearch(address.split(',')[0]);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Could not get your location. Please search manually.');
        }
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Select Your Route
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Location */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Start Location
            </Label>
            <div className="flex gap-2">
              <Input
                value={startSearch}
                onChange={(e) => handleSearchChange(e.target.value, true)}
                placeholder="Search start address..."
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={getCurrentLocation}
                title="Use my location"
              >
                📍
              </Button>
              <Button 
                variant={selectingStart ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectingStart(!selectingStart);
                  setSelectingEnd(false);
                }}
                title="Select on map"
              >
                🎯
              </Button>
            </div>
            {startResults.length > 0 && (
              <div className="absolute z-[1000] w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {startResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                    onClick={() => selectLocation(result, true)}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Location */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              Destination
            </Label>
            <div className="flex gap-2">
              <Input
                value={endSearch}
                onChange={(e) => handleSearchChange(e.target.value, false)}
                placeholder="Search destination..."
                className="flex-1"
              />
              <Button 
                variant={selectingEnd ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectingEnd(!selectingEnd);
                  setSelectingStart(false);
                }}
                title="Select on map"
              >
                🎯
              </Button>
            </div>
            {endResults.length > 0 && (
              <div className="absolute z-[1000] w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {endResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                    onClick={() => selectLocation(result, false)}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selection mode indicator */}
        {(selectingStart || selectingEnd) && (
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg text-sm text-center">
            Click on the map to select {selectingStart ? 'start' : 'destination'} location
          </div>
        )}

        {/* Map */}
        <div className="h-[400px] rounded-lg overflow-hidden border">
          <MapContainer
            center={[20.5937, 78.9629]} // India center
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler 
              onMapClick={handleMapClick}
              selectingStart={selectingStart}
              selectingEnd={selectingEnd}
            />
            
            <FitBounds start={startLocation} end={endLocation} />
            
            {startLocation && (
              <Marker position={[startLocation.lat, startLocation.lng]} icon={StartIcon}>
                <Popup>
                  <strong>Start:</strong><br />
                  {startLocation.address.split(',').slice(0, 2).join(', ')}
                </Popup>
              </Marker>
            )}
            
            {endLocation && (
              <Marker position={[endLocation.lat, endLocation.lng]} icon={EndIcon}>
                <Popup>
                  <strong>Destination:</strong><br />
                  {endLocation.address.split(',').slice(0, 2).join(', ')}
                </Popup>
              </Marker>
            )}
            
            {routeCoords.length > 0 && (
              <Polyline
                positions={routeCoords}
                color="#22c55e"
                weight={4}
                opacity={0.8}
              />
            )}
          </MapContainer>
        </div>

        {/* Calculate button and results */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={calculateRoute}
            disabled={!startLocation || !endLocation || isLoading}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Calculating...
              </>
            ) : (
              <>
                <span className="mr-2">📏</span>
                Calculate Route
              </>
            )}
          </Button>

          {distance !== null && (
            <div className="flex gap-6 items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{distance.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">km distance</div>
              </div>
              {duration !== null && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{Math.round(duration)}</div>
                  <div className="text-sm text-muted-foreground">min by car</div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
