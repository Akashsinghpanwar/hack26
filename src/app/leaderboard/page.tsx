'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Medal,
  Flame,
  TrendingUp,
  Zap,
  Crown,
  ChevronUp,
  ArrowUp,
  Leaf,
  Target,
  Footprints,
  Bike,
  Bus,
  Sparkles,
  Copy,
  Check,
  Users,
  Star,
  Award,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ─── Level System ───────────────────────────────────────────────
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

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);

  return <>{display}</>;
}

// ─── Leaderboard Row ────────────────────────────────────────────
function LeaderboardRow({
  entry,
  type,
  isCurrentUser,
  animDelay,
}: {
  entry: any;
  type: 'co2' | 'calories';
  isCurrentUser: boolean;
  animDelay: number;
}) {
  const level = getLevel(entry.co2Saved * 10);
  const score = entry.co2Saved * 10;
  const nextLvl = getNextLevel(score);
  const progress = nextLvl
    ? ((score - getLevel(score).minScore) / (nextLvl.minScore - getLevel(score).minScore)) * 100
    : 100;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300 group',
        'animate-[fadeSlideUp_0.5s_ease-out_both]',
        isCurrentUser
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-100'
          : 'bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-md'
      )}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Rank */}
      <div className={cn(
        'min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm',
        entry.rank <= 3
          ? entry.rank === 1
            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-200'
            : entry.rank === 2
              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md'
              : 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md'
          : 'bg-slate-100 text-slate-500'
      )}>
        {entry.rank <= 3
          ? ['🥇', '🥈', '🥉'][entry.rank - 1]
          : `#${entry.rank}`}
      </div>

      {/* Level icon */}
      <div className={cn(
        'w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0',
        level.color
      )}>
        {level.icon}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm sm:text-base text-slate-800 truncate">{entry.userName}</span>
          {isCurrentUser && (
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm shrink-0">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-[10px] sm:text-xs font-semibold bg-gradient-to-r bg-clip-text text-transparent', level.color)}>
            Lv.{level.level} {level.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] sm:text-xs text-slate-400">{entry.journeyCount} trips</span>
        </div>
        {/* Level progress bar */}
        <div className="mt-1.5 h-1 w-full max-w-[120px] bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', level.color)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <div className="font-black text-base sm:text-lg text-slate-800 tabular-nums">
          {type === 'co2' ? entry.co2Saved?.toFixed(1) : Math.round(entry.caloriesBurned)}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
          {type === 'co2' ? 'kg CO₂' : 'kcal'}
        </div>
      </div>
    </div>
  );
}

// ─── Your Rank Card ─────────────────────────────────────────────
function YourRankCard({ currentUser, totalParticipants }: { currentUser: any; totalParticipants: number }) {
  if (!currentUser) return null;
  const score = currentUser.co2Saved * 10;
  const level = getLevel(score);
  const nextLvl = getNextLevel(score);
  const progress = nextLvl
    ? ((score - level.minScore) / (nextLvl.minScore - level.minScore)) * 100
    : 100;
  const percentile = totalParticipants > 0 ? Math.round(((totalParticipants - currentUser.rank + 1) / totalParticipants) * 100) : 0;

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
      {/* BG decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10" />

      <CardContent className="p-5 sm:p-6 relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-slate-300">Your Standing</span>
        </div>

        {/* Rank number */}
        <div className="text-center mb-5">
          <div className="text-6xl sm:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            #{currentUser.rank}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-3xl">{level.icon}</span>
            <span className="text-lg font-bold text-slate-200">{level.name}</span>
          </div>
        </div>

        {/* Percentile */}
        {percentile > 0 && (
          <div className="bg-white/10 rounded-xl px-4 py-2.5 text-center mb-4 backdrop-blur-sm">
            <span className="text-emerald-400 font-bold text-sm">Top {100 - percentile || 1}%</span>
            <span className="text-slate-400 text-sm"> of all travelers</span>
          </div>
        )}

        {/* Level progress */}
        {nextLvl && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Level Progress</span>
              <span className="text-emerald-400 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{level.icon} {level.name}</span>
              <span>{nextLvl.icon} {nextLvl.name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Challenge Card ─────────────────────────────────────────────
function ChallengeCard({
  currentUser,
  leader,
  nextPerson,
}: {
  currentUser: any;
  leader: any;
  nextPerson: any;
}) {
  if (!currentUser || !leader) return null;
  const pointsToLeader = (leader.co2Saved - currentUser.co2Saved).toFixed(1);
  const pointsToNext = nextPerson ? (nextPerson.co2Saved - currentUser.co2Saved).toFixed(1) : 0;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8" />
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-violet-200" />
          <span className="font-bold text-base">Your Challenge</span>
        </div>

        {currentUser.rank === 1 ? (
          <div className="text-center py-3">
            <Crown className="w-10 h-10 text-amber-300 mx-auto mb-2" />
            <div className="text-xl font-bold">You're #1!</div>
            <div className="text-violet-200 text-sm mt-1">Keep going to stay on top</div>
          </div>
        ) : (
          <div className="space-y-3">
            {nextPerson && currentUser.rank > 1 && (
              <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold mb-1">
                  To reach #{nextPerson.rank}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{nextPerson.userName}</span>
                  <div className="flex items-center gap-1">
                    <ChevronUp className="w-3.5 h-3.5 text-violet-200" />
                    <span className="text-lg font-bold">{pointsToNext}</span>
                    <span className="text-xs text-violet-300">kg</span>
                  </div>
                </div>
                <div className="text-xs text-violet-300 mt-1.5 flex items-center gap-1">
                  <Footprints className="w-3 h-3" />
                  ≈ {Math.ceil(Number(pointsToNext) / 0.15)} km of walking
                </div>
              </div>
            )}

            {currentUser.rank > 2 && (
              <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold mb-1">
                  To reach #1
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span className="font-medium text-sm">{leader.userName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChevronUp className="w-3.5 h-3.5 text-violet-200" />
                    <span className="text-lg font-bold">{pointsToLeader}</span>
                    <span className="text-xs text-violet-300">kg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Scoring Tips Card ──────────────────────────────────────────
function ScoringTipsCard() {
  const tips = [
    { icon: <Footprints className="w-4 h-4" />, label: 'Walk 1 km', points: '~0.15 kg CO₂', color: 'bg-blue-100 text-blue-600' },
    { icon: <Bike className="w-4 h-4" />, label: 'Bike 1 km', points: '~0.12 kg CO₂', color: 'bg-green-100 text-green-600' },
    { icon: <Bus className="w-4 h-4" />, label: 'Bus/Train 1 km', points: '~0.08 kg CO₂', color: 'bg-amber-100 text-amber-600' },
    { icon: <Flame className="w-4 h-4" />, label: 'Daily Streak', points: '2× bonus!', color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <span className="font-bold text-sm text-slate-800">How to Earn Points</span>
        </div>
        <div className="space-y-2.5">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className={cn('p-2 rounded-lg group-hover:scale-110 transition-transform', tip.color)}>
                {tip.icon}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-700">{tip.label}</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {tip.points}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Invite Card ────────────────────────────────────────────────
function InviteCard() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white overflow-hidden relative">
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-emerald-100" />
          <span className="font-bold text-sm">Invite Friends</span>
        </div>
        <p className="text-emerald-100 text-xs mb-4">
          Challenge your friends to eco-travel. More competition = more motivation!
        </p>
        <Button
          onClick={handleCopy}
          className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-sm border-0"
        >
          {copied ? (
            <><Check className="w-4 h-4 mr-2" /> Copied!</>
          ) : (
            <><Copy className="w-4 h-4 mr-2" /> Copy Invite Link</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Level Guide ────────────────────────────────────────────────
function LevelGuide({ currentScore }: { currentScore: number }) {
  const currentLevel = getLevel(currentScore);

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Level Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-4 gap-2">
          {LEVELS.map((lvl) => {
            const isActive = lvl.level === currentLevel.level;
            const isPast = lvl.level < currentLevel.level;
            return (
              <div
                key={lvl.level}
                className={cn(
                  'text-center p-2 rounded-xl transition-all group cursor-default',
                  isActive && 'bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-400 shadow-sm',
                  isPast && 'opacity-60',
                  !isActive && !isPast && 'hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-9 h-9 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center text-lg shadow-sm transition-transform',
                  isActive ? 'scale-110' : 'group-hover:scale-110',
                  lvl.color
                )}>
                  {lvl.icon}
                </div>
                <div className="text-[10px] mt-1 font-bold text-slate-600">Lv.{lvl.level}</div>
                <div className="text-[9px] text-slate-400 truncate">{lvl.name}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [type, setType] = useState<'co2' | 'calories'>('co2');
  const [scope, setScope] = useState<'global' | 'friends'>('global');

  const { data, isLoading } = useSWR(
    `/api/leaderboard?period=${period}&type=${type}&scope=${scope}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              <Trophy className="absolute inset-0 m-auto w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-slate-400 font-medium animate-pulse">Loading rankings...</p>
          </div>
        </main>
      </div>
    );
  }

  const entries = data?.data?.leaderboard || [];
  const currentUser = entries.find((e: any) => e.isCurrentUser);
  const leader = entries[0];
  const nextPerson = currentUser && currentUser.rank > 1 ? entries[currentUser.rank - 2] : null;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      {/* CSS for custom animation */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Leaderboard
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 ml-12">
              Compete, climb the ranks, and make an impact
            </p>
          </div>
          {entries.length > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              {entries.length} participants
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Scope Filter - Friends/Global */}
          <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm ring-1 ring-slate-100">
            {(['global', 'friends'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  'px-3.5 sm:px-5 py-2 text-xs sm:text-sm rounded-full transition-all duration-200 font-medium flex items-center gap-1.5',
                  scope === s
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {s === 'global' ? <><Trophy className="w-3.5 h-3.5" /> Global</> : <><Users className="w-3.5 h-3.5" /> Friends</>}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm ring-1 ring-slate-100">
            {(['week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3.5 sm:px-5 py-2 text-xs sm:text-sm rounded-full transition-all duration-200 font-medium',
                  period === p
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm ring-1 ring-slate-100">
            {(['co2', 'calories'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'px-3.5 sm:px-5 py-2 text-xs sm:text-sm rounded-full transition-all duration-200 font-medium flex items-center gap-1.5',
                  type === t
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {t === 'co2' ? <><Leaf className="w-3.5 h-3.5" /> CO₂ Saved</> : <><Flame className="w-3.5 h-3.5" /> Calories</>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Main Leaderboard Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Rankings List */}
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm ring-1 ring-slate-100/50">
              <CardHeader className="pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Full Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-4 space-y-2">
                {scope === 'friends' ? (
                  // Dummy friends data
                  [
                    { rank: 1, userId: 'f1', userName: 'Sarah Johnson', co2Saved: 18.5, caloriesBurned: 2450, isCurrentUser: false },
                    { rank: 2, userId: 'f2', userName: 'Mike Chen', co2Saved: 15.2, caloriesBurned: 1890, isCurrentUser: false },
                    { rank: 3, userId: 'f3', userName: 'You', co2Saved: 12.8, caloriesBurned: 1650, isCurrentUser: true },
                    { rank: 4, userId: 'f4', userName: 'Emma Wilson', co2Saved: 10.4, caloriesBurned: 1420, isCurrentUser: false },
                    { rank: 5, userId: 'f5', userName: 'David Park', co2Saved: 8.9, caloriesBurned: 1180, isCurrentUser: false },
                  ].map((entry, idx) => (
                    <LeaderboardRow
                      key={entry.userId}
                      entry={entry}
                      type={type}
                      isCurrentUser={entry.isCurrentUser}
                      animDelay={idx * 60}
                    />
                  ))
                ) : entries.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600 text-lg">No rankings yet</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                      Be the first to log an eco journey and claim the top spot!
                    </p>
                  </div>
                ) : (
                  entries.map((entry: any, idx: number) => (
                    <LeaderboardRow
                      key={entry.userId}
                      entry={entry}
                      type={type}
                      isCurrentUser={entry.isCurrentUser}
                      animDelay={idx * 60}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Level Guide */}
            <LevelGuide currentScore={currentUser ? currentUser.co2Saved * 10 : 0} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <YourRankCard currentUser={currentUser} totalParticipants={entries.length} />
            <ChallengeCard currentUser={currentUser} leader={leader} nextPerson={nextPerson} />
            <ScoringTipsCard />
            <InviteCard />
          </div>
        </div>
      </main>
    </div>
  );
}
