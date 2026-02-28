import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateSustainabilityScore } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get aggregate stats
    const stats = await prisma.journey.aggregate({
      where: { userId },
      _sum: {
        distance: true,
        co2Saved: true,
        caloriesBurned: true
      },
      _count: true
    });

    // Get sustainable trips count
    const sustainableTrips = await prisma.journey.count({
      where: {
        userId,
        transportMode: { not: 'car' }
      }
    });

    // Calculate streak
    const streak = await calculateStreak(userId);

    // Calculate sustainability score
    const sustainabilityScore = calculateSustainabilityScore(
      stats._sum.co2Saved || 0,
      stats._sum.caloriesBurned || 0,
      sustainableTrips,
      streak
    );

    // Get achievements
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalJourneys: stats._count,
        totalDistance: Math.round((stats._sum.distance || 0) * 100) / 100,
        totalCo2Saved: Math.round((stats._sum.co2Saved || 0) * 100) / 100,
        totalCaloriesBurned: Math.round(stats._sum.caloriesBurned || 0),
        sustainableTrips,
        currentStreak: streak,
        sustainabilityScore,
        achievements: achievements.map(ua => ({
          ...ua.achievement,
          unlockedAt: ua.unlockedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

// Calculate current streak
async function calculateStreak(userId: string): Promise<number> {
  const journeys = await prisma.journey.findMany({
    where: {
      userId,
      transportMode: { not: 'car' }
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  if (journeys.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const journeyDates = new Set(
    journeys.map(j => {
      const d = new Date(j.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  while (journeyDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}
