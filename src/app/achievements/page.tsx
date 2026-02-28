'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import { AchievementsGrid } from '@/components/gamification/AchievementBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AchievementsPage() {
  const { status } = useSession();
  const router = useRouter();

  const { data: statsData, isLoading: statsLoading } = useSWR(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher
  );

  const { data: allAchievementsData, isLoading: achievementsLoading } = useSWR(
    '/api/achievements',
    fetcher
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || statsLoading || achievementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userAchievements = statsData?.data?.achievements || [];
  const allAchievements = allAchievementsData?.data || [];

  // Merge achievements with unlocked status
  const mergedAchievements = allAchievements.map((achievement: any) => {
    const unlocked = userAchievements.find((ua: any) => ua.id === achievement.id);
    return {
      ...achievement,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt
    };
  });

  const unlockedCount = mergedAchievements.filter((a: any) => a.unlocked).length;
  const totalCount = mergedAchievements.length;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>🎖️</span> Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and unlock badges for sustainable travel milestones.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Your Progress</h3>
                <p className="text-muted-foreground">
                  Keep traveling sustainably to unlock more achievements!
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {unlockedCount}/{totalCount}
                </div>
                <div className="text-sm text-muted-foreground">achievements unlocked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {mergedAchievements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-6xl mb-4 block">🎯</span>
              <h3 className="text-xl font-semibold mb-2">No achievements available</h3>
              <p className="text-muted-foreground">
                Check back later for achievements to unlock!
              </p>
            </CardContent>
          </Card>
        ) : (
          <AchievementsGrid achievements={mergedAchievements} />
        )}
      </main>
    </div>
  );
}
