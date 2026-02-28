import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateMetrics, isSustainableMode, TransportMode } from '@/lib/calculations';

// GET - Fetch user's journeys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const journeys = await prisma.journey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.journey.count({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        journeys,
        total,
        hasMore: offset + journeys.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching journeys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journeys' },
      { status: 500 }
    );
  }
}

// POST - Log a new journey
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { distance, transportMode, fromLocation, toLocation } = await request.json();

    if (!distance || !transportMode) {
      return NextResponse.json(
        { error: 'Distance and transport mode are required' },
        { status: 400 }
      );
    }

    // Calculate metrics
    const metrics = calculateMetrics(distance, transportMode as TransportMode);

    // Create journey
    const journey = await prisma.journey.create({
      data: {
        userId: session.user.id,
        distance,
        transportMode,
        travelTime: metrics.travelTime,
        co2Emissions: metrics.co2Emissions,
        caloriesBurned: metrics.caloriesBurned,
        co2Saved: metrics.co2Saved,
        fromLocation,
        toLocation
      }
    });

    // Check for achievements
    await checkAndUnlockAchievements(session.user.id);

    return NextResponse.json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error creating journey:', error);
    return NextResponse.json(
      { error: 'Failed to create journey' },
      { status: 500 }
    );
  }
}

// Check and unlock achievements
async function checkAndUnlockAchievements(userId: string) {
  try {
    // Get user stats
    const stats = await prisma.journey.aggregate({
      where: { userId },
      _sum: {
        co2Saved: true,
        caloriesBurned: true
      },
      _count: true
    });

    const totalCo2Saved = stats._sum.co2Saved || 0;
    const totalCalories = stats._sum.caloriesBurned || 0;
    const journeyCount = stats._count;

    // Get sustainable trips count
    const sustainableTrips = await prisma.journey.count({
      where: {
        userId,
        transportMode: { not: 'car' }
      }
    });

    // Calculate streak
    const streak = await calculateStreak(userId);

    // Get all achievements
    const achievements = await prisma.achievement.findMany();

    // Check each achievement
    for (const achievement of achievements) {
      let earned = false;

      switch (achievement.type) {
        case 'co2':
          earned = totalCo2Saved >= achievement.threshold;
          break;
        case 'calories':
          earned = totalCalories >= achievement.threshold;
          break;
        case 'journeys':
          earned = journeyCount >= achievement.threshold;
          break;
        case 'streak':
          earned = streak >= achievement.threshold;
          break;
      }

      if (earned) {
        // Check if already unlocked
        const existing = await prisma.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id
            }
          }
        });

        if (!existing) {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
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
