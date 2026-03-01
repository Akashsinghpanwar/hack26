import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const COINS_FOR_TREE = 5000;

// Streak rewards: coins earned per day (Day 1-7, then resets)
const STREAK_REWARDS = [5, 10, 15, 20, 30, 40, 50];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = (user as any).lastLoginDate ? new Date((user as any).lastLoginDate) : null;
    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);
    }

    // Check if user already claimed today's reward
    const alreadyClaimed = lastLogin && lastLogin.getTime() === today.getTime();
    const totalCoins = (user as any).totalCoinsEarned || 0;
    
    // Calculate current streak (check if it's still valid)
    let currentStreak = (user as any).streak || 0;
    const lastStreakDate = (user as any).lastStreakDate ? new Date((user as any).lastStreakDate) : null;
    
    if (lastStreakDate) {
      lastStreakDate.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastStreakDate.getTime() !== today.getTime() && lastStreakDate.getTime() !== yesterday.getTime()) {
        currentStreak = 0;
      }
    }

    // Calculate next reward amount based on streak
    const nextStreak = currentStreak >= 7 ? 1 : (currentStreak || 0) + 1;
    const nextRewardAmount = STREAK_REWARDS[nextStreak - 1] || 5;

    return NextResponse.json({
      success: true,
      data: {
        totalCoins: totalCoins,
        treesPlanted: (user as any).treesPlanted || 0,
        canClaimReward: !alreadyClaimed,
        coinsForTree: COINS_FOR_TREE,
        coinsToNextTree: COINS_FOR_TREE - (totalCoins % COINS_FOR_TREE),
        streak: currentStreak || 0,
        nextRewardAmount: nextRewardAmount,
        streakRewards: STREAK_REWARDS,
      }
    });
  } catch (error) {
    console.error('Error fetching daily reward status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = (user as any).lastLoginDate ? new Date((user as any).lastLoginDate) : null;
    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);
    }

    // Check if already claimed today
    if (lastLogin && lastLogin.getTime() === today.getTime()) {
      return NextResponse.json(
        { error: 'Daily reward already claimed today' },
        { status: 400 }
      );
    }

    // Calculate streak
    let currentStreak = (user as any).streak || 0;
    const lastStreakDate = (user as any).lastStreakDate ? new Date((user as any).lastStreakDate) : null;
    let newStreak = 1; // Default to day 1
    
    if (lastStreakDate) {
      lastStreakDate.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastStreakDate.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak (max 7, then reset to 1)
        newStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
      }
      // Otherwise, streak resets to 1
    }
    
    // Calculate coins earned based on streak day
    const coinsEarned = STREAK_REWARDS[newStreak - 1] || 5;
    const currentTotalCoins = (user as any).totalCoinsEarned || 0;
    const newTotalCoins = currentTotalCoins + coinsEarned;
    
    // Calculate tree planting
    const currentTreesPlanted = (user as any).treesPlanted || 0;
    const treesToPlant = Math.floor(newTotalCoins / COINS_FOR_TREE) - Math.floor(currentTotalCoins / COINS_FOR_TREE);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginDate: new Date(),
        totalCoinsEarned: newTotalCoins,
        treesPlanted: currentTreesPlanted + treesToPlant,
        streak: newStreak,
        lastStreakDate: new Date(),
      } as any
    });

    const finalTreesPlanted = currentTreesPlanted + treesToPlant;

    return NextResponse.json({
      success: true,
      data: {
        coinsEarned: coinsEarned,
        totalCoins: newTotalCoins,
        treesPlanted: finalTreesPlanted,
        newTreesPlanted: treesToPlant,
        coinsForTree: COINS_FOR_TREE,
        coinsToNextTree: COINS_FOR_TREE - (newTotalCoins % COINS_FOR_TREE),
        streak: newStreak,
        message: treesToPlant > 0 
          ? `You planted ${treesToPlant} tree(s)! +${coinsEarned} coins (Day ${newStreak})` 
          : `+${coinsEarned} coins! Day ${newStreak} streak`
      }
    });
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    );
  }
}
