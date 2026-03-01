import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DAILY_LOGIN_COINS = 10;
const COINS_FOR_TREE = 100;

// Streak rewards: leaves earned per day
const STREAK_REWARDS = [5, 10, 15, 20, 30, 40, 50]; // Day 1-7

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
    const coins = (user as any).coins || 0;
    
    // Calculate current streak (check if it's still valid)
    let currentStreak = (user as any).streak || 0;
    const lastStreakDate = (user as any).lastStreakDate ? new Date((user as any).lastStreakDate) : null;
    
    if (lastStreakDate) {
      lastStreakDate.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If last streak was today, keep streak as is
      // If last streak was yesterday, streak is valid
      // Otherwise, streak should reset (but we show current for display)
      if (lastStreakDate.getTime() !== today.getTime() && lastStreakDate.getTime() !== yesterday.getTime()) {
        currentStreak = 0; // Streak broken, will reset to 1 on next claim
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        coins: coins,
        treesPlanted: (user as any).treesPlanted || 0,
        totalCoinsEarned: (user as any).totalCoinsEarned || 0,
        canClaimReward: !alreadyClaimed,
        dailyRewardAmount: DAILY_LOGIN_COINS,
        coinsForTree: COINS_FOR_TREE,
        coinsToNextTree: COINS_FOR_TREE - (coins % COINS_FOR_TREE),
        // Streak data
        streak: currentStreak || 1,
        totalLeaves: (user as any).totalLeaves || 0,
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
    
    // Calculate leaves earned based on streak day
    const leavesEarned = STREAK_REWARDS[newStreak - 1] || 5;
    const currentTotalLeaves = (user as any).totalLeaves || 0;
    const newTotalLeaves = currentTotalLeaves + leavesEarned;

    // Calculate new coins and check for tree planting
    const currentCoins = (user as any).coins || 0;
    const currentTreesPlanted = (user as any).treesPlanted || 0;
    const currentTotalCoinsEarned = (user as any).totalCoinsEarned || 0;
    
    const newCoins = currentCoins + DAILY_LOGIN_COINS;
    const treesToPlant = Math.floor(newCoins / COINS_FOR_TREE) - Math.floor(currentCoins / COINS_FOR_TREE);
    const finalCoins = newCoins % COINS_FOR_TREE;

    // Update user using Prisma update
    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: finalCoins,
        lastLoginDate: new Date(),
        treesPlanted: currentTreesPlanted + treesToPlant,
        totalCoinsEarned: currentTotalCoinsEarned + DAILY_LOGIN_COINS,
        // Streak updates
        streak: newStreak,
        totalLeaves: newTotalLeaves,
        lastStreakDate: new Date(),
      } as any
    });

    const finalTreesPlanted = currentTreesPlanted + treesToPlant;
    const finalTotalCoinsEarned = currentTotalCoinsEarned + DAILY_LOGIN_COINS;

    return NextResponse.json({
      success: true,
      data: {
        coinsEarned: DAILY_LOGIN_COINS,
        currentCoins: finalCoins,
        treesPlanted: finalTreesPlanted,
        newTreesPlanted: treesToPlant,
        totalCoinsEarned: finalTotalCoinsEarned,
        coinsToNextTree: COINS_FOR_TREE - (finalCoins % COINS_FOR_TREE),
        // Streak data
        streak: newStreak,
        leavesEarned: leavesEarned,
        totalLeaves: newTotalLeaves,
        message: treesToPlant > 0 
          ? `🌳 You planted ${treesToPlant} tree(s)! +${leavesEarned}🍃 Day ${newStreak} streak!` 
          : `+${DAILY_LOGIN_COINS} coins & +${leavesEarned}🍃 Day ${newStreak} streak!`
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
