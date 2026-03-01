'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CAR_TYPES = [
  { value: 'petrol', label: 'Petrol', icon: '⛽', emission: 171, color: 'border-orange-500 bg-orange-50 text-orange-700' },
  { value: 'diesel', label: 'Diesel', icon: '🛢️', emission: 171, color: 'border-amber-500 bg-amber-50 text-amber-700' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔋', emission: 92, color: 'border-cyan-500 bg-cyan-50 text-cyan-700' },
  { value: 'electric', label: 'Electric', icon: '⚡', emission: 0, color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
];

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const { data: settingsData, isLoading } = useSWR(
    status === 'authenticated' ? '/api/user/settings' : null,
    fetcher
  );

  const [carPlateNumber, setCarPlateNumber] = useState('');
  const [carType, setCarType] = useState('petrol');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (settingsData?.data) {
      setCarPlateNumber(settingsData.data.carPlateNumber || '');
      setCarType(settingsData.data.carType || 'petrol');
    }
  }, [settingsData]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carPlateNumber, carType }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const selectedType = CAR_TYPES.find((t) => t.value === carType);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <main className="w-full max-w-2xl mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Manage your vehicle details</p>
          </div>
        </div>

        {/* Vehicle Settings Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Car className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Vehicle Details</CardTitle>
                <CardDescription className="text-slate-300 text-xs sm:text-sm">
                  Update your car registration and type for accurate CO₂ calculations
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Car Registration */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Car Registration Number</Label>
              <div className="flex items-stretch border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
                <div className="bg-blue-600 text-white px-3 flex items-center justify-center text-xs font-bold shrink-0">
                  GB
                </div>
                <Input
                  value={carPlateNumber}
                  onChange={(e) => setCarPlateNumber(e.target.value.toUpperCase())}
                  placeholder="AB12 CDE"
                  className="border-0 text-lg font-bold tracking-widest font-mono bg-yellow-50/50 rounded-none focus-visible:ring-0"
                  maxLength={8}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400">Enter your UK vehicle registration plate</p>
            </div>

            {/* Car Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Car Type</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {CAR_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setCarType(type.value)}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                      carType === type.value
                        ? type.color + ' ring-2 ring-offset-1'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1">{type.icon}</div>
                    <div className="font-semibold text-sm">{type.label}</div>
                    <div className="text-[10px] sm:text-xs opacity-70">{type.emission} g CO₂/km</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Emission Display */}
            {selectedType && (
              <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Your car&apos;s CO₂ emission</span>
                  <span className={`text-lg font-black ${
                    selectedType.emission === 0 ? 'text-emerald-600' :
                    selectedType.emission <= 100 ? 'text-cyan-600' : 'text-orange-600'
                  }`}>
                    {selectedType.emission} g/km
                  </span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-5 sm:py-6 text-base font-bold rounded-xl transition-all ${
                saved
                  ? 'bg-emerald-500 hover:bg-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {saved ? (
                <><CheckCircle className="w-5 h-5 mr-2" /> Saved!</>
              ) : saving ? (
                'Saving...'
              ) : (
                <><Save className="w-5 h-5 mr-2" /> Save Changes</>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
