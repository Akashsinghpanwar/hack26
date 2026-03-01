'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Car, Leaf, Zap, Fuel, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { getSampleRegistrations } from '@/lib/vehicle-database';

interface VehicleData {
    registrationNumber: string;
    make: string;
    model: string;
    fuelType: string;
    co2Emissions: number;
    co2PerKm: number;
    engineCapacity?: number;
    yearOfManufacture?: number;
    colour?: string;
}

interface VehicleLookupProps {
    onVehicleFound: (co2PerKm: number, vehicleInfo: VehicleData) => void;
}

function getFuelIcon(fuelType: string) {
    switch (fuelType) {
        case 'ELECTRIC': return <Zap className="w-4 h-4" />;
        case 'HYBRID':
        case 'PLUG-IN HYBRID': return <Leaf className="w-4 h-4" />;
        default: return <Fuel className="w-4 h-4" />;
    }
}

function getFuelColor(fuelType: string) {
    switch (fuelType) {
        case 'ELECTRIC': return 'bg-green-100 text-green-700 border-green-200';
        case 'HYBRID': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'PLUG-IN HYBRID': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'PETROL': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'DIESEL': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

function getCo2Rating(co2: number): { label: string; color: string; bg: string } {
    if (co2 === 0) return { label: 'Zero Emission', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    if (co2 <= 50) return { label: 'Ultra Low', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    if (co2 <= 100) return { label: 'Very Low', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    if (co2 <= 130) return { label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    if (co2 <= 160) return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    if (co2 <= 200) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    return { label: 'Very High', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
}

export function VehicleLookup({ onVehicleFound }: VehicleLookupProps) {
    const [regNumber, setRegNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [vehicle, setVehicle] = useState<VehicleData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSamples, setShowSamples] = useState(false);

    const handleLookup = async () => {
        if (!regNumber.trim()) return;

        setLoading(true);
        setError(null);
        setVehicle(null);

        try {
            const response = await fetch('/api/vehicle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationNumber: regNumber }),
            });

            const data = await response.json();

            if (response.ok) {
                setVehicle(data.data);
                onVehicleFound(data.data.co2PerKm, data.data);
            } else {
                setError(data.message || data.error || 'Vehicle not found');
            }
        } catch (e) {
            setError('Failed to look up vehicle. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSampleClick = (reg: string) => {
        setRegNumber(reg);
        setShowSamples(false);
    };

    const samples = getSampleRegistrations().slice(0, 8);
    const co2Rating = vehicle ? getCo2Rating(vehicle.co2Emissions) : null;

    return (
        <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 bg-gradient-to-r from-slate-50 to-slate-100/50">
                <CardTitle className="text-sm sm:text-lg font-bold flex items-center gap-2">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                    <span className="hidden sm:inline">Your Vehicle&apos;s CO₂ Rating</span>
                    <span className="sm:hidden">Vehicle CO₂</span>
                    <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-auto">UK Reg</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                {/* Input Row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        {/* UK-style plate input */}
                        <div className="flex items-stretch border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-400 transition-colors">
                            <div className="bg-blue-600 text-white px-2 sm:px-2.5 flex items-center justify-center text-xs font-bold shrink-0">
                                <span className="text-[10px] leading-tight text-center">GB</span>
                            </div>
                            <input
                                type="text"
                                value={regNumber}
                                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                placeholder="SA19 HBK"
                                className="flex-1 px-2 sm:px-3 py-2.5 sm:py-3 text-base sm:text-lg font-bold tracking-widest text-slate-800 placeholder:text-slate-300 placeholder:tracking-widest focus:outline-none bg-yellow-50/50 font-mono"
                                maxLength={8}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleLookup}
                        disabled={loading || !regNumber.trim()}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-5 rounded-lg shrink-0 h-auto"
                    >
                        {loading ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                    </Button>
                </div>

                {/* Demo plates dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSamples(!showSamples)}
                        className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                    >
                        <ChevronDown className={`w-3 h-3 transition-transform ${showSamples ? 'rotate-180' : ''}`} />
                        Try a demo registration
                    </button>

                    {showSamples && (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {samples.map((s) => (
                                <button
                                    key={s.reg}
                                    onClick={() => handleSampleClick(s.reg)}
                                    className="text-left px-2.5 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-xs border border-transparent hover:border-slate-200 group"
                                >
                                    <div className="font-mono font-bold text-slate-700 group-hover:text-blue-600">{s.reg}</div>
                                    <div className="text-slate-400 truncate">{s.info.make} {s.info.model.split(' ')[0]}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Vehicle Result */}
                {vehicle && (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        {/* Header with car info */}
                        <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-slate-300 mb-0.5">Vehicle Identified</div>
                                    <div className="text-xl font-bold">{vehicle.make} {vehicle.model}</div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {vehicle.yearOfManufacture && (
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{vehicle.yearOfManufacture}</span>
                                        )}
                                        {vehicle.colour && (
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{vehicle.colour}</span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${vehicle.fuelType === 'ELECTRIC' ? 'bg-green-500/20 text-green-300' :
                                                vehicle.fuelType.includes('HYBRID') ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-amber-500/20 text-amber-300'
                                            }`}>
                                            {getFuelIcon(vehicle.fuelType)}
                                            {vehicle.fuelType}
                                        </span>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                        </div>

                        {/* CO2 rating */}
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Official CO₂ Emission</div>
                                    <div className="flex items-baseline gap-1.5 mt-0.5">
                                        <span className="text-4xl font-black text-slate-800 tabular-nums">{vehicle.co2Emissions}</span>
                                        <span className="text-sm font-bold text-slate-500">g/km</span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${co2Rating?.bg}`}>
                                    <span className={co2Rating?.color}>{co2Rating?.label}</span>
                                </div>
                            </div>

                            {/* Visual CO2 bar */}
                            <div className="mt-3">
                                <div className="w-full h-2.5 bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500 rounded-full relative">
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-slate-700 shadow-md transition-all"
                                        style={{ left: `${Math.min((vehicle.co2Emissions / 300) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                    <span>0 g/km</span>
                                    <span>150 g/km</span>
                                    <span>300 g/km</span>
                                </div>
                            </div>

                            {/* Comparison with generic */}
                            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Generic car average</span>
                                    <span className="font-bold text-slate-500">210 g/km</span>
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-slate-600 font-medium">Your car</span>
                                    <span className={`font-bold ${vehicle.co2Emissions < 210 ? 'text-green-600' : 'text-red-600'}`}>
                                        {vehicle.co2Emissions} g/km
                                        {vehicle.co2Emissions < 210
                                            ? ` (${Math.round(((210 - vehicle.co2Emissions) / 210) * 100)}% cleaner!)`
                                            : ` (${Math.round(((vehicle.co2Emissions - 210) / 210) * 100)}% higher)`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
