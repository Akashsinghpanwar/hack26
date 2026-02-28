import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      walkingGoal,
      cyclingGoal,
      publicTransitGoal,
      maxDrivingDays,
      fitnessGoal,
      weeklyCalorieTarget,
    } = body;

    // Use raw update to avoid type issues with new fields
    const user = await prisma.$executeRawUnsafe(`
      UPDATE User SET 
        walkingGoal = ${walkingGoal ?? 0},
        cyclingGoal = ${cyclingGoal ?? 0},
        publicTransitGoal = ${publicTransitGoal ?? 0},
        maxDrivingDays = ${maxDrivingDays ?? 7},
        fitnessGoal = '${fitnessGoal ?? 'stay_active'}',
        weeklyCalorieTarget = ${weeklyCalorieTarget ?? 1000},
        setupCompleted = 1
      WHERE email = '${session.user.email}'
    `);

    return NextResponse.json({
      success: true,
      message: 'Preferences saved'
    });
  } catch (error) {
    console.error('Error saving lifestyle preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        walkingGoal: (user as any).walkingGoal ?? 0,
        cyclingGoal: (user as any).cyclingGoal ?? 0,
        publicTransitGoal: (user as any).publicTransitGoal ?? 0,
        maxDrivingDays: (user as any).maxDrivingDays ?? 7,
        fitnessGoal: (user as any).fitnessGoal ?? 'stay_active',
        weeklyCalorieTarget: (user as any).weeklyCalorieTarget ?? 1000,
        setupCompleted: (user as any).setupCompleted ?? false,
      }
    });
  } catch (error) {
    console.error('Error fetching lifestyle preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
