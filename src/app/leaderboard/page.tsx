'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Level System
const LEVELS = [
  { level: 1, name: 'Seedling', minScore: 0, icon: '🌱', color: 'from-green-400 to-green-500' },
  { level: 2, name: 'Sprout', minScore: 100, icon: '🌿', color: 'from-green-500 to-emerald-500' },
  { level: 3, name: 'Sapling', minScore: 300, icon: '🪴', color: 'from-emerald-500 to-teal-500' },
  { level: 4, name: 'Tree', minScore: 600, icon: '🌳', color: 'from-teal-500 to-cyan-500' },
  { level: 5, name: 'Forest', minScore: 1000, icon: '🌲', color: 'from-cyan-500 to-blue-500' },
  { level: 6, name: 'Eco Warrior', minScore: 1500, icon: '⚡', color: 'from-blue-500 to-indigo-500' },
  { level: 7, name: 'Planet Saver', minScore: 2500, icon: '🌍', color: 'from-indigo-500 to-purple-500' },
  { level: 8, name: 'Legend', minScore: 5000, icon: '👑', color: 'from-purple-500 to-pink-500' },
];

function getLevel(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(score: number) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (score < LEVELS[i].minScore) return LEVELS[i];
  }
  return null;
}

// Simple World Map with dots
function WorldMap({ participants }: { participants: { name: string; lat: number; lng: number; score: number }[] }) {
  // Simplified world map coordinates (normalized 0-100)
  const cities = [
    { name: 'New York', lat: 35, lng: 25 },
    { name: 'London', lat: 30, lng: 50 },
    { name: 'Tokyo', lat: 35, lng: 85 },
    { name: 'Sydney', lat: 75, lng: 85 },
    { name: 'Mumbai', lat: 45, lng: 68 },
    { name: 'Dubai', lat: 42, lng: 62 },
    { name: 'Paris', lat: 32, lng: 51 },
    { name: 'Singapore', lat: 55, lng: 77 },
    { name: 'Berlin', lat: 30, lng: 53 },
    { name: 'Toronto', lat: 33, lng: 22 },
  ];

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl overflow-hidden">
      {/* Simple continent shapes */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse cx="25" cy="35" rx="15" ry="20" fill="#22c55e" /> {/* Americas */}
        <ellipse cx="52" cy="35" rx="12" ry="15" fill="#22c55e" /> {/* Europe/Africa */}
        <ellipse cx="75" cy="40" rx="18" ry="20" fill="#22c55e" /> {/* Asia */}
        <ellipse cx="82" cy="70" rx="8" ry="10" fill="#22c55e" /> {/* Australia */}
      </svg>
      
      {/* Participant dots */}
      {participants.slice(0, 10).map((p, idx) => {
        const city = cities[idx % cities.length];
        return (
          <div 
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${city.lng}%`, top: `${city.lat}%` }}
          >
            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${idx < 3 ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'} animate-pulse shadow-lg`} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {p.name}
            </div>
          </div>
        );
      })}
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 text-xs text-slate-600 bg-white/80 px-2 py-1 rounded-lg">
        {participants.length} eco travelers worldwide
      </div>
    </div>
  );
}

// Level Badge Component
function LevelBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const level = getLevel(score);
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg`}>
      {level.icon}
    </div>
  );
}

// Competition Card
function CompetitionCard({ 
  currentUser, 
  leader, 
  nextPerson 
}: { 
  currentUser: { rank: number; score: number; name: string } | null;
  leader: { name: string; score: number } | null;
  nextPerson: { name: string; score: number; rank: number } | null;
}) {
  if (!currentUser || !leader) return null;
  
  const pointsToLeader = leader.score - currentUser.score;
  const pointsToNext = nextPerson ? nextPerson.score - currentUser.score : 0;
  
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎯</span>
          <span className="font-bold text-lg">Your Challenge</span>
        </div>
        
        {currentUser.rank === 1 ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">👑</div>
            <div className="text-xl font-bold">You're the Leader!</div>
            <div className="text-violet-200 text-sm mt-1">Keep going to maintain your position</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* To beat next person */}
            {nextPerson && currentUser.rank > 1 && (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-violet-200 mb-1">To reach #{nextPerson.rank}</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{nextPerson.name}</span>
                  <span className="text-xl font-bold">+{pointsToNext} pts</span>
                </div>
                <div className="mt-2 text-xs text-violet-200">
                  = {Math.ceil(pointsToNext / 10)} eco journeys away
                </div>
              </div>
            )}
            
            {/* To beat leader */}
            {currentUser.rank > 2 && (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-violet-200 mb-1">To reach #1</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{leader.name} 👑</span>
                  <span className="text-xl font-bold">+{pointsToLeader} pts</span>
                </div>
              </div>
            )}
            
            {/* Tip */}
            <div className="text-center text-sm text-violet-200 pt-2 border-t border-white/20">
              💡 Log 1 bike ride = +15 points | 1 walk = +20 points
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Friend Invite Card
function InviteFriendsCard() {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText('https://ecotravel.app/join?ref=friend');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">👥</span>
          <span className="font-bold">Invite Friends</span>
        </div>
        <p className="text-sm text-amber-100 mb-4">
          Challenge your friends to join the eco-travel movement!
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handleCopy}
            className="flex-1 bg-white text-amber-600 hover:bg-amber-50"
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </Button>
          <Button className="bg-white/20 hover:bg-white/30">
            📧
          </Button>
          <Button className="bg-white/20 hover:bg-white/30">
            💬
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Leaderboard Entry
function LeaderboardEntry({ 
  entry, 
  type, 
  isCurrentUser,
  showConnect 
}: { 
  entry: any; 
  type: 'co2' | 'calories';
  isCurrentUser: boolean;
  showConnect: boolean;
}) {
  const level = getLevel(entry.score || entry.co2Saved * 10);
  const score = entry.score || (type === 'co2' ? entry.co2Saved * 10 : entry.caloriesBurned / 10);
  
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-200';
      case 2: return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl transition-all",
      isCurrentUser 
        ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow-lg" 
        : "bg-white hover:shadow-md"
    )}>
      {/* Rank */}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", getRankStyle(entry.rank))}>
        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
      </div>
      
      {/* Level Badge */}
      <LevelBadge score={score} size="sm" />
      
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 truncate">{entry.userName}</span>
          {isCurrentUser && (
            <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">You</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`bg-gradient-to-r ${level.color} bg-clip-text text-transparent font-medium`}>
            Lv.{level.level} {level.name}
          </span>
          <span>•</span>
          <span>{entry.journeyCount} trips</span>
        </div>
      </div>
      
      {/* Score */}
      <div className="text-right">
        <div className="font-bold text-lg text-slate-800">
          {type === 'co2' ? entry.co2Saved?.toFixed(1) : Math.round(entry.caloriesBurned)}
        </div>
        <div className="text-xs text-slate-500">
          {type === 'co2' ? 'kg CO2' : 'kcal'}
        </div>
      </div>
      
      {/* Connect Button */}
      {showConnect && !isCurrentUser && (
        <Button size="sm" variant="outline" className="text-xs">
          Connect
        </Button>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [type, setType] = useState<'co2' | 'calories'>('co2');

  const { data, isLoading } = useSWR(
    `/api/leaderboard?period=${period}&type=${type}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        </main>
      </div>
    );
  }

  const entries = data?.data?.leaderboard || [];
  const currentUser = entries.find((e: any) => e.isCurrentUser);
  const leader = entries[0];
  const nextPerson = currentUser && currentUser.rank > 1 ? entries[currentUser.rank - 2] : null;
  
  // Mock participant locations for map
  const mapParticipants = entries.map((e: any, idx: number) => ({
    name: e.userName,
    lat: 20 + Math.random() * 40,
    lng: 10 + Math.random() * 80,
    score: e.co2Saved * 10,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Leaderboard</h1>
            <p className="text-slate-500 text-sm">Compete with eco travelers worldwide</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-4">
            {/* World Map */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>🌍</span> Global Eco Travelers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorldMap participants={mapParticipants} />
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm">
                {(['week', 'month', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-full transition-all",
                      period === p 
                        ? "bg-emerald-500 text-white shadow-md" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm">
                {(['co2', 'calories'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-full transition-all",
                      type === t 
                        ? "bg-emerald-500 text-white shadow-md" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {t === 'co2' ? '🌍 CO2 Saved' : '🔥 Calories'}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard List */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 space-y-2">
                {entries.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-5xl mb-3">🏆</div>
                    <p className="font-medium">No rankings yet</p>
                    <p className="text-sm">Be the first to log an eco journey!</p>
                  </div>
                ) : (
                  entries.map((entry: any) => (
                    <LeaderboardEntry
                      key={entry.userId}
                      entry={entry}
                      type={type}
                      isCurrentUser={entry.isCurrentUser}
                      showConnect={true}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Level Guide */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>📊</span> Level System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {LEVELS.map((level) => (
                    <div key={level.level} className="text-center group">
                      <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
                        {level.icon}
                      </div>
                      <div className="text-xs mt-1 font-medium text-slate-700">Lv.{level.level}</div>
                      <div className="text-xs text-slate-400 truncate">{level.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Your Rank Card */}
            {currentUser && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-5 text-center">
                  <div className="text-sm text-emerald-100 mb-2">Your Rank</div>
                  <div className="text-5xl font-bold">#{currentUser.rank}</div>
                  <div className="mt-3">
                    <LevelBadge score={currentUser.co2Saved * 10} size="lg" />
                  </div>
                  <div className="mt-2 text-emerald-100">
                    {getLevel(currentUser.co2Saved * 10).name}
                  </div>
                  {getNextLevel(currentUser.co2Saved * 10) && (
                    <div className="mt-3 pt-3 border-t border-white/20 text-sm">
                      <span className="text-emerald-200">Next level: </span>
                      <span className="font-medium">{getNextLevel(currentUser.co2Saved * 10)?.minScore - currentUser.co2Saved * 10} pts</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Competition Card */}
            <CompetitionCard 
              currentUser={currentUser ? { rank: currentUser.rank, score: currentUser.co2Saved * 10, name: currentUser.userName } : null}
              leader={leader ? { name: leader.userName, score: leader.co2Saved * 10 } : null}
              nextPerson={nextPerson ? { name: nextPerson.userName, score: nextPerson.co2Saved * 10, rank: nextPerson.rank } : null}
            />

            {/* Invite Friends */}
            <InviteFriendsCard />

            {/* Tips Card */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💡</span>
                  <span className="font-semibold text-slate-800">Quick Tips</span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <span>🚶</span>
                    <span>Walk 1km = 20 eco points</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🚲</span>
                    <span>Bike 1km = 15 eco points</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🚌</span>
                    <span>Bus/Train = 10 eco points</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🔥</span>
                    <span>Daily streak = 2x bonus!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
