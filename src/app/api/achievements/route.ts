import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [
        { type: 'asc' },
        { threshold: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
