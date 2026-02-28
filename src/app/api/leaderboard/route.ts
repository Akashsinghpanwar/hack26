import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, all
    const type = searchParams.get('type') || 'co2'; // co2, calories

    // Calculate date filter
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: monthAgo };
    }

    // Get aggregated stats per user
    const userStats = await prisma.journey.groupBy({
      by: ['userId'],
      where: period !== 'all' ? { createdAt: dateFilter } : {},
      _sum: {
        co2Saved: true,
        caloriesBurned: true
      },
      _count: true
    });

    // Get user details
    const userIds = userStats.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Sort by the selected metric
    const sorted = userStats
      .map(stat => ({
        userId: stat.userId,
        userName: userMap.get(stat.userId)?.name || 'Anonymous',
        userImage: userMap.get(stat.userId)?.image,
        co2Saved: Math.round((stat._sum.co2Saved || 0) * 100) / 100,
        caloriesBurned: Math.round(stat._sum.caloriesBurned || 0),
        journeyCount: stat._count,
        isCurrentUser: stat.userId === currentUserId
      }))
      .sort((a, b) => {
        if (type === 'calories') {
          return b.caloriesBurned - a.caloriesBurned;
        }
        return b.co2Saved - a.co2Saved;
      })
      .slice(0, 10)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: sorted,
        period,
        type
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
