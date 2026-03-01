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

    // Get user data (all fields)
    const user = await prisma.user.findUnique({
      where: { id: userId }
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

    // Calculate daily CO2 comparison (today vs yesterday)
    const dailyCo2Comparison = await calculateDailyCo2Comparison(userId);

    // Get mode distribution for all journeys
    const modeStats = await calculateModeStats(userId);

    // Extract lifestyle goals from user if available
    const lifestyleGoals = user ? {
      walkingGoal: (user as any).walkingGoal ?? 0,
      cyclingGoal: (user as any).cyclingGoal ?? 0,
      publicTransitGoal: (user as any).publicTransitGoal ?? 0,
      maxDrivingDays: (user as any).maxDrivingDays ?? 7,
      fitnessGoal: (user as any).fitnessGoal ?? 'stay_active',
      weeklyCalorieTarget: (user as any).weeklyCalorieTarget ?? 1000,
      setupCompleted: (user as any).setupCompleted ?? false,
    } : null;

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
        lifestyleGoals,
        weeklyProgress,
        dailyCo2Comparison,
        modeStats,
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
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
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

// Calculate daily CO2 comparison (today vs yesterday)
async function calculateDailyCo2Comparison(userId: string) {
  const now = new Date();
  
  // Today's start and end
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  // Yesterday's start and end
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(-1);

  // Get today's CO2 saved
  const todayStats = await prisma.journey.aggregate({
    where: {
      userId,
      createdAt: { gte: todayStart, lte: todayEnd }
    },
    _sum: { co2Saved: true }
  });

  // Get yesterday's CO2 saved
  const yesterdayStats = await prisma.journey.aggregate({
    where: {
      userId,
      createdAt: { gte: yesterdayStart, lte: yesterdayEnd }
    },
    _sum: { co2Saved: true }
  });

  const todayCo2 = todayStats._sum.co2Saved || 0;
  const yesterdayCo2 = yesterdayStats._sum.co2Saved || 0;
  const difference = todayCo2 - yesterdayCo2;

  return {
    todayCo2Saved: Math.round(todayCo2 * 100) / 100,
    yesterdayCo2Saved: Math.round(yesterdayCo2 * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    message: difference > 0 
      ? `You saved ${Math.abs(difference).toFixed(1)}kg more CO₂ today than yesterday!`
      : difference < 0
      ? `You saved ${Math.abs(difference).toFixed(1)}kg less CO₂ than yesterday`
      : 'Same CO₂ savings as yesterday'
  };
}

// Calculate mode distribution stats
async function calculateModeStats(userId: string) {
  const journeys = await prisma.journey.groupBy({
    by: ['transportMode'],
    where: { userId },
    _count: true,
    _sum: { distance: true }
  });

  const result: Record<string, number> = {};
  journeys.forEach(j => {
    result[j.transportMode] = j._count;
  });

  return result;
}
