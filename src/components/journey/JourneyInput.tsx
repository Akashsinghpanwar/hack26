'use client';

import { useState } from 'react';
import { TransportMode } from '@/lib/calculations';
import { TransportSelector } from './TransportSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JourneyInputProps {
  onCalculate: (distance: number, mode: TransportMode) => void;
  onSave?: (distance: number, mode: TransportMode, from?: string, to?: string) => void;
  isLoading?: boolean;
  showSaveButton?: boolean;
}

export function JourneyInput({ onCalculate, onSave, isLoading, showSaveButton = true }: JourneyInputProps) {
  const [distance, setDistance] = useState<string>('10');
  const [selectedMode, setSelectedMode] = useState<TransportMode>('bike');
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');

  const handleCalculate = () => {
    const dist = parseFloat(distance);
    if (dist > 0) {
      onCalculate(dist, selectedMode);
    }
  };

  const handleSave = () => {
    const dist = parseFloat(distance);
    if (dist > 0 && onSave) {
      onSave(dist, selectedMode, fromLocation || undefined, toLocation || undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Journey Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              min="0.1"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="Enter distance"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From (optional)</Label>
            <Input
              id="from"
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="Starting point"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To (optional)</Label>
            <Input
              id="to"
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="Destination"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Select Transport Mode</Label>
          <TransportSelector
            selected={selectedMode}
            onSelect={setSelectedMode}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleCalculate} 
            disabled={isLoading || !distance}
            className="flex-1"
            size="lg"
          >
            {isLoading ? 'Calculating...' : 'Calculate Impact'}
          </Button>
          {showSaveButton && onSave && (
            <Button 
              onClick={handleSave}
              disabled={isLoading || !distance}
              variant="outline"
              size="lg"
            >
              Save Journey
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
