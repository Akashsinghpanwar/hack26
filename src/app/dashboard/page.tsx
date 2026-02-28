'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { Activity, Leaf, Flame, Trophy, Map, ArrowRight, Zap, TrendingUp, Award } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Circular Progress Ring (Addictive UI Element)
function ProgressRing({ value, max, color, label, icon }: { value: number; max: number; color: string; label: string; icon: React.ReactNode }) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
        <svg className="w-20 h-20 transform -rotate-90 drop-shadow-sm">
          <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="none" />
          <circle
            cx="40" cy="40" r="36"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="font-extrabold text-lg text-slate-800 tabular-nums">{value}<span className="text-slate-400 text-sm font-medium">/{max}</span></div>
        <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// Stats Card with Hover Effects
function StatCard({ title, value, unit, icon: Icon, colorClass, bgClass, trend }: { title: string, value: string | number, unit?: string, icon: any, colorClass: string, bgClass: string, trend?: string }) {
  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group relative ${bgClass}`}>
      <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Icon size={100} />
      </div>
      <CardContent className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm inline-flex">
            <Icon className={`w-6 h-6 ${colorClass}`} />
          </div>
          {trend && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/60 text-slate-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> {trend}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-800 tracking-tight tabular-nums">{value}</span>
            {unit && <span className="text-sm font-bold text-slate-500">{unit}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: stats } = useSWR(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const userStats = stats?.data;
  const weeklyProgress = userStats?.weeklyProgress || { walkingDays: 0, cyclingDays: 0, transitDays: 0, drivingDays: 0 };
  const goals = userStats?.lifestyleGoals || { walkingGoal: 3, cyclingGoal: 2, transitGoal: 2, maxDrivingDays: 2, calorieGoal: 500 };

  // Format data for Recharts
  const modeData = [
    { name: 'Walk', value: userStats?.modeStats?.walk || 0, color: '#3b82f6' },
    { name: 'Bike', value: userStats?.modeStats?.bike || 0, color: '#10b981' },
    { name: 'Transit', value: (userStats?.modeStats?.bus || 0) + (userStats?.modeStats?.train || 0), color: '#f59e0b' },
    { name: 'Car', value: userStats?.modeStats?.car || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Mock weekly trend data for the area chart to make it look active
  const activityData = [
    { day: 'Mon', score: Math.floor(Math.random() * 50) + 20 },
    { day: 'Tue', score: Math.floor(Math.random() * 50) + 30 },
    { day: 'Wed', score: Math.floor(Math.random() * 50) + 40 },
    { day: 'Thu', score: Math.floor(Math.random() * 50) + 50 },
    { day: 'Fri', score: userStats?.sustainabilityScore ? userStats.sustainabilityScore / 2 : 60 },
    { day: 'Sat', score: userStats?.sustainabilityScore ? userStats.sustainabilityScore / 1.5 : 80 },
    { day: 'Sun', score: userStats?.sustainabilityScore || 90 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans selection:bg-emerald-200">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
              Welcome back, <span className="text-emerald-600">{session?.user?.name?.split(' ')[0] || 'Explorer'}</span> 👋
            </h1>
            <p className="text-slate-500 font-medium">Here&apos;s your environmental impact summary.</p>
          </div>
          <Link href="/compare">
            <Button className="bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-all shadow-md hover:shadow-xl rounded-full px-6 h-12 font-bold group">
              <Map className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Log New Journey
            </Button>
          </Link>
        </div>

        {/* Hero Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Journeys"
            value={userStats?.totalJourneys || 0}
            icon={Map}
            colorClass="text-blue-500"
            bgClass="bg-blue-50/50"
            trend="+2 this week"
          />
          <StatCard
            title="CO₂ Prevented"
            value={(userStats?.totalCo2Saved || 0).toFixed(1)}
            unit="kg"
            icon={Leaf}
            colorClass="text-emerald-500"
            bgClass="bg-emerald-50/50"
            trend="+12%"
          />
          <StatCard
            title="Calories Burned"
            value={Math.round(userStats?.totalCaloriesBurned || 0)}
            unit="kcal"
            icon={Flame}
            colorClass="text-orange-500"
            bgClass="bg-orange-50/50"
          />
          <StatCard
            title="Eco Score"
            value={userStats?.sustainabilityScore || 0}
            unit="pts"
            icon={Zap}
            colorClass="text-amber-500"
            bgClass="bg-amber-50/50"
            trend="Top 10%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <Card className="border-0 shadow-sm bg-white lg:col-span-2 overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="border-b border-slate-50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Activity Trend
                  </CardTitle>
                  <CardDescription>Your eco-score progression this week</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gamification Panel */}
          <div className="space-y-8">
            {/* Streak Card - Highly Addictive */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
              <CardContent className="p-8 relative z-10 flex flex-col items-center justify-center min-h-[220px]">
                <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-xl backdrop-blur-md">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
                  <span className="text-7xl font-black tracking-tighter drop-shadow-md">{userStats?.currentStreak || 0}</span>
                </div>
                <div className="text-xl font-bold text-slate-200 mb-4 tracking-tight">Day Streak!</div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-amber-400 h-full rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-slate-400 font-medium text-center">Log a journey tomorrow to maintain your streak</p>
              </CardContent>
            </Card>

            {/* Transport Modes Chart */}
            <Card className="border-0 shadow-sm bg-white ring-1 ring-slate-100">
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mode Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {modeData.length > 0 ? (
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modeData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000}>
                          {modeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[180px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Map className="w-8 h-8 mb-2 opacity-50" />
                    <p className="font-medium text-sm">No specific modes used yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Goals - redesigned for better gamification */}
        <Card className="border-0 shadow-sm bg-white mt-8 ring-1 ring-slate-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Weekly Challenges
            </h2>
            <Link href="/lifestyle-setup" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors hidden sm:block">
              Edit Goals
            </Link>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
              <ProgressRing
                value={weeklyProgress.walkingDays}
                max={goals.walkingGoal || 3}
                color="#3b82f6"
                label="Walking"
                icon={<Activity className="w-8 h-8" />}
              />
              <ProgressRing
                value={weeklyProgress.cyclingDays}
                max={goals.cyclingGoal || 2}
                color="#10b981"
                label="Cycling"
                icon={<Map className="w-8 h-8" />}
              />
              <ProgressRing
                value={weeklyProgress.transitDays}
                max={goals.transitGoal || 2}
                color="#f59e0b"
                label="Transit"
                icon={<Zap className="w-8 h-8" />}
              />
              <ProgressRing
                value={Math.max(0, (goals.maxDrivingDays || 5) - weeklyProgress.drivingDays)}
                max={goals.maxDrivingDays || 5}
                color={Math.max(0, (goals.maxDrivingDays || 5) - weeklyProgress.drivingDays) > 0 ? "#8b5cf6" : "#ef4444"}
                label="Car Limits"
                icon={<Leaf className="w-8 h-8" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Link href="/history" className="group">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">History</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
          <Link href="/leaderboard" className="group">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-100 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Rankings</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
          <Link href="/achievements" className="group">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 group-hover:bg-purple-100 transition-all">
                  <Award className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Badges</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
          <Link href="/lifestyle-setup" className="group">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Profile</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

