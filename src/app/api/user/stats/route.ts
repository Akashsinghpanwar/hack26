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

    // Get user with lifestyle goals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walkingGoal: true,
        cyclingGoal: true,
        publicTransitGoal: true,
        maxDrivingDays: true,
        fitnessGoal: true,
        weeklyCalorieTarget: true,
        setupCompleted: true,
      }
    });

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

    // Get weekly progress (journeys from this week)
    const weekStart = getWeekStart();
    const weeklyProgress = await calculateWeeklyProgress(userId, weekStart);

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
        })),
        // Lifestyle goals
        lifestyleGoals: user ? {
          walkingGoal: user.walkingGoal,
          cyclingGoal: user.cyclingGoal,
          publicTransitGoal: user.publicTransitGoal,
          maxDrivingDays: user.maxDrivingDays,
          fitnessGoal: user.fitnessGoal || 'stay_active',
          weeklyCalorieTarget: user.weeklyCalorieTarget,
          setupCompleted: user.setupCompleted,
        } : null,
        // Weekly progress
        weeklyProgress,
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

// Get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Calculate weekly progress for goals
async function calculateWeeklyProgress(userId: string, weekStart: Date) {
  const journeys = await prisma.journey.findMany({
    where: {
      userId,
      createdAt: { gte: weekStart }
    },
    select: {
      transportMode: true,
      caloriesBurned: true,
      createdAt: true
    }
  });

  // Count unique days for each transport mode
  const walkingDays = new Set<string>();
  const cyclingDays = new Set<string>();
  const transitDays = new Set<string>();
  const drivingDays = new Set<string>();
  let totalCalories = 0;

  journeys.forEach(journey => {
    const dateKey = journey.createdAt.toISOString().split('T')[0];
    totalCalories += journey.caloriesBurned;

    switch (journey.transportMode) {
      case 'walk':
        walkingDays.add(dateKey);
        break;
      case 'bike':
      case 'ebike':
        cyclingDays.add(dateKey);
        break;
      case 'bus':
      case 'train':
        transitDays.add(dateKey);
        break;
      case 'car':
        drivingDays.add(dateKey);
        break;
    }
  });

  return {
    walkingDays: walkingDays.size,
    cyclingDays: cyclingDays.size,
    transitDays: transitDays.size,
    drivingDays: drivingDays.size,
    caloriesBurned: Math.round(totalCalories),
  };
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
