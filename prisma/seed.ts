import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import 'dotenv/config';

// Use better-sqlite3 adapter for Prisma 7 - db is in project root
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const achievements = [
  {
    code: 'first_steps',
    name: 'First Steps',
    description: 'Log your first journey',
    icon: '🎯',
    threshold: 1,
    type: 'journeys'
  },
  {
    code: 'regular_commuter',
    name: 'Regular Commuter',
    description: 'Log 5 journeys',
    icon: '🚀',
    threshold: 5,
    type: 'journeys'
  },
  {
    code: 'journey_master',
    name: 'Journey Master',
    description: 'Log 20 journeys',
    icon: '🏆',
    threshold: 20,
    type: 'journeys'
  },
  {
    code: 'green_champion',
    name: 'Green Champion',
    description: 'Save 20 kg of CO2',
    icon: '🌱',
    threshold: 20,
    type: 'co2'
  },
  {
    code: 'carbon_hero',
    name: 'Carbon Hero',
    description: 'Save 100 kg of CO2',
    icon: '🌍',
    threshold: 100,
    type: 'co2'
  },
  {
    code: 'climate_champion',
    name: 'Climate Champion',
    description: 'Save 500 kg of CO2',
    icon: '🌳',
    threshold: 500,
    type: 'co2'
  },
  {
    code: 'calorie_crusher',
    name: 'Calorie Crusher',
    description: 'Burn 1000 calories',
    icon: '🔥',
    threshold: 1000,
    type: 'calories'
  },
  {
    code: 'fitness_fanatic',
    name: 'Fitness Fanatic',
    description: 'Burn 5000 calories',
    icon: '💪',
    threshold: 5000,
    type: 'calories'
  },
  {
    code: 'streak_starter',
    name: 'Streak Starter',
    description: '3-day sustainable streak',
    icon: '⚡',
    threshold: 3,
    type: 'streak'
  },
  {
    code: 'streak_master',
    name: 'Streak Master',
    description: '7-day sustainable streak',
    icon: '🔥',
    threshold: 7,
    type: 'streak'
  },
  {
    code: 'green_habit',
    name: 'Green Habit',
    description: '30-day sustainable streak',
    icon: '🏅',
    threshold: 30,
    type: 'streak'
  }
];

async function main() {
  console.log('Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement
    });
  }

  console.log('Seeded', achievements.length, 'achievements');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
