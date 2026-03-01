'use client';

import { useState, useEffect } from 'react';

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
  routeCoords?: [number, number][]; // Route polyline coordinates for filtering
  onSelectParking?: (spot: ParkingSpot) => void;
  autoSearch?: boolean; // Auto-search on mount
}

// Silent parking finder - runs in background, no UI
export function ParkingFinder({ destinationLat, destinationLon, routeCoords, onSelectParking, autoSearch = false }: ParkingFinderProps) {
  const [searched, setSearched] = useState(false);

  const searchParking = async () => {
    if (!destinationLat || !destinationLon) {
      return;
    }

    try {
      // Use POST API with route coordinates to find parking along the route
      const response = await fetch('/api/parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationLat,
          destinationLon,
          routeCoords: routeCoords || [],
          radius: 2000,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSearched(true);
        
        // Auto-select nearest parking on the route (prioritize free, otherwise nearest any)
        const allSpots = data.data.parkingSpots as ParkingSpot[];
        if (allSpots.length > 0 && onSelectParking) {
          const freeSpots = allSpots.filter((s: ParkingSpot) => s.fee === 'free');
          // Select nearest free parking if available, otherwise nearest any parking
          const selectedSpot = freeSpots.length > 0 ? freeSpots[0] : allSpots[0];
          onSelectParking(selectedSpot);
        }
      }
    } catch (err) {
      console.error('Failed to search for parking:', err);
    }
  };

  // Auto-search when car mode is selected and route coords are available
  useEffect(() => {
    // Only auto-search when we have destination AND route coordinates
    const hasRouteCoords = routeCoords && routeCoords.length >= 2;
    if (autoSearch && destinationLat && destinationLon && hasRouteCoords && !searched) {
      searchParking();
    }
  }, [autoSearch, destinationLat, destinationLon, routeCoords]);

  // No UI - this component runs silently in the background
  return null;
}
