'use client';

import { TransportMode, TRANSPORT_DATA } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface TransportSelectorProps {
  selected: TransportMode;
  onSelect: (mode: TransportMode) => void;
  disabled?: boolean;
}

export function TransportSelector({ selected, onSelect, disabled }: TransportSelectorProps) {
  const modes: TransportMode[] = ['car', 'bus', 'train', 'bike', 'walk', 'ebike'];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {modes.map((mode) => {
        const data = TRANSPORT_DATA[mode];
        const isSelected = selected === mode;
        
        return (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
              "hover:border-primary/50 hover:bg-accent/50",
              isSelected ? "border-primary bg-primary/10" : "border-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-2xl mb-1">{data.icon}</span>
            <span className="text-sm font-medium">{data.label}</span>
            <span className="text-xs text-muted-foreground">
              {data.co2PerKm === 0 ? 'Zero CO2' : `${data.co2PerKm} kg/km`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
