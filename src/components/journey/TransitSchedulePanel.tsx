'use client';

import { useState } from 'react';
import { TransitOption } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Train, Clock, MapPin, Footprints, ChevronRight, Loader2, AlertCircle, Zap, Fuel } from 'lucide-react';

interface TransitSchedulePanelProps {
  options: TransitOption[];
  loading: boolean;
  error?: string;
  selectedOption: TransitOption | null;
  onSelectOption: (option: TransitOption) => void;
  mode: 'bus' | 'train';
}

// Get icon based on service type
function getServiceIcon(type: string, isElectric?: boolean) {
  if (type === 'BUS') {
    return <Bus className="w-5 h-5" />;
  }
  if (['RAIL', 'SUBWAY', 'TRAM'].includes(type)) {
    return <Train className="w-5 h-5" />;
  }
  return <Bus className="w-5 h-5" />;
}

// Get color based on service type and if electric
function getServiceColor(type: string, isElectric?: boolean): string {
  if (isElectric) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  switch (type) {
    case 'BUS':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'RAIL':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'SUBWAY':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'TRAM':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

// Get vehicle type display name
function getVehicleTypeName(googleType?: string, isElectric?: boolean): string {
  if (!googleType) return '';
  
  const names: Record<string, string> = {
    'BUS': 'Diesel Bus',
    'INTERCITY_BUS': 'Intercity Bus',
    'RAIL': 'Train',
    'HEAVY_RAIL': 'Train',
    'COMMUTER_TRAIN': 'Commuter Train',
    'SUBWAY': 'Metro',
    'METRO_RAIL': 'Metro',
    'TRAM': 'Tram',
    'LIGHT_RAIL': 'Light Rail',
    'FERRY': 'Ferry',
  };
  
  return names[googleType] || googleType;
}

export function TransitSchedulePanel({
  options,
  loading,
  error,
  selectedOption,
  onSelectOption,
  mode,
}: TransitSchedulePanelProps) {
  const title = mode === 'bus' ? 'Available Buses' : 'Available Trains';
  const icon = mode === 'bus' ? <Bus className="w-5 h-5" /> : <Train className="w-5 h-5" />;

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-slate-500 font-medium">
              Finding {mode === 'bus' ? 'buses' : 'trains'}...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">No routes found</p>
              <p className="text-sm text-orange-600 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (options.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-400">
            {icon}
            <p className="text-sm font-medium">
              No {mode === 'bus' ? 'buses' : 'trains'} available for this route
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100/50">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
          {icon}
          {title}
          <span className="text-xs sm:text-sm font-normal text-slate-500 ml-auto">
            {options.length} option{options.length > 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {options.map((option) => {
            const isSelected = selectedOption?.id === option.id;
            const vehicleTypeName = getVehicleTypeName(option.vehicleGoogleType, option.isElectric);
            
            return (
              <button
                key={option.id}
                onClick={() => onSelectOption(option)}
                className={`w-full text-left p-3 sm:p-4 transition-all hover:bg-slate-50 ${
                  isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Service Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Service Type Icon */}
                    <div className={`p-2 rounded-lg shrink-0 ${getServiceColor(option.serviceType, option.isElectric)}`}>
                      {getServiceIcon(option.serviceType, option.isElectric)}
                    </div>
                    
                    {/* Service Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm sm:text-base truncate">
                          {option.serviceName}
                        </span>
                        {/* Electric indicator badge */}
                        {option.isElectric && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <Zap className="w-3 h-3" />
                            Electric
                          </span>
                        )}
                        {option.fare && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {option.fare}
                          </span>
                        )}
                      </div>
                      
                      {/* Vehicle type */}
                      {vehicleTypeName && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          {option.isElectric ? (
                            <Zap className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Fuel className="w-3 h-3 text-slate-400" />
                          )}
                          {vehicleTypeName}
                        </div>
                      )}
                      
                      {/* Route preview from first transit step */}
                      {option.steps.find(s => s.transitDetails) && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-slate-500">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {option.steps.find(s => s.transitDetails)?.transitDetails?.departureStop}
                          </span>
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {option.steps.find(s => s.transitDetails)?.transitDetails?.arrivalStop}
                          </span>
                        </div>
                      )}
                      
                      {/* Walking info */}
                      {option.walkingDuration > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <Footprints className="w-3 h-3" />
                          <span>{option.walkingDuration} min walk total</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Time Info */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        {option.departureTime}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Arr: {option.arrivalTime}
                    </div>
                    <div className="text-xs font-medium text-emerald-600 mt-1">
                      {option.duration} min
                    </div>
                    {option.stops > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {option.stops} stop{option.stops > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selected indicator with detailed emissions */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-medium">Route selected</span>
                      <div className="flex items-center gap-2">
                        {option.isElectric && (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Low emissions
                          </span>
                        )}
                        <span className="text-slate-500">
                          CO₂: {(option.co2Emissions / 1000).toFixed(2)} kg
                          {!option.isElectric && option.serviceType === 'BUS' && (
                            <span className="text-[10px] text-slate-400 ml-1">(diesel est.)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
