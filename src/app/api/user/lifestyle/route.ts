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

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        walkingGoal: walkingGoal ?? 0,
        cyclingGoal: cyclingGoal ?? 0,
        publicTransitGoal: publicTransitGoal ?? 0,
        maxDrivingDays: maxDrivingDays ?? 7,
        fitnessGoal: fitnessGoal ?? 'stay_active',
        weeklyCalorieTarget: weeklyCalorieTarget ?? 1000,
        setupCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
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
      where: { email: session.user.email },
      select: {
        walkingGoal: true,
        cyclingGoal: true,
        publicTransitGoal: true,
        maxDrivingDays: true,
        fitnessGoal: true,
        weeklyCalorieTarget: true,
        setupCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching lifestyle preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
