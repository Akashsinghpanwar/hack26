import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        carPlateNumber: user.carPlateNumber,
        carType: user.carType,
        carEmissionFactor: user.carEmissionFactor,
      },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { carPlateNumber, carType, carEmissionFactor } = await request.json();

    const emissionFactors: Record<string, number> = {
      petrol: 171,
      diesel: 171,
      hybrid: 92,
      electric: 0,
    };

    const emission = carEmissionFactor ?? emissionFactors[carType] ?? 171;

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        carPlateNumber: carPlateNumber || null,
        carType: carType || null,
        carEmissionFactor: emission,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
