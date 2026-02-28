import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Use better-sqlite3 adapter for Prisma 7 - db is in project root
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const achievements = [
  { code: 'first_steps', name: 'First Steps', description: 'Log your first journey', icon: '🎯', threshold: 1, type: 'journeys' },
  { code: 'regular_commuter', name: 'Regular Commuter', description: 'Log 5 journeys', icon: '🚀', threshold: 5, type: 'journeys' },
  { code: 'journey_master', name: 'Journey Master', description: 'Log 20 journeys', icon: '🏆', threshold: 20, type: 'journeys' },
  { code: 'green_champion', name: 'Green Champion', description: 'Save 20 kg of CO2', icon: '🌱', threshold: 20, type: 'co2' },
  { code: 'carbon_hero', name: 'Carbon Hero', description: 'Save 100 kg of CO2', icon: '🌍', threshold: 100, type: 'co2' },
  { code: 'climate_champion', name: 'Climate Champion', description: 'Save 500 kg of CO2', icon: '🌳', threshold: 500, type: 'co2' },
  { code: 'calorie_crusher', name: 'Calorie Crusher', description: 'Burn 1000 calories', icon: '🔥', threshold: 1000, type: 'calories' },
  { code: 'fitness_fanatic', name: 'Fitness Fanatic', description: 'Burn 5000 calories', icon: '💪', threshold: 5000, type: 'calories' },
  { code: 'streak_starter', name: 'Streak Starter', description: '3-day sustainable streak', icon: '⚡', threshold: 3, type: 'streak' },
  { code: 'streak_master', name: 'Streak Master', description: '7-day sustainable streak', icon: '🔥', threshold: 7, type: 'streak' },
  { code: 'green_habit', name: 'Green Habit', description: '30-day sustainable streak', icon: '🏅', threshold: 30, type: 'streak' }
];

const demoUsers = [
  { name: 'Priya Sharma', email: 'priya@demo.com' },
  { name: 'Rahul Kumar', email: 'rahul@demo.com' },
  { name: 'Ananya Singh', email: 'ananya@demo.com' },
  { name: 'Vikram Patel', email: 'vikram@demo.com' },
  { name: 'Neha Gupta', email: 'neha@demo.com' },
  { name: 'Arjun Reddy', email: 'arjun@demo.com' },
  { name: 'Kavita Joshi', email: 'kavita@demo.com' },
  { name: 'Amit Verma', email: 'amit@demo.com' },
  { name: 'Sneha Nair', email: 'sneha@demo.com' },
  { name: 'Rohan Das', email: 'rohan@demo.com' },
];

const transportModes = [
  { mode: 'bike', co2PerKm: 0, calPerKm: 30, speed: 15 },
  { mode: 'walk', co2PerKm: 0, calPerKm: 60, speed: 5 },
  { mode: 'ebike', co2PerKm: 0.006, calPerKm: 15, speed: 20 },
  { mode: 'bus', co2PerKm: 0.089, calPerKm: 0, speed: 25 },
  { mode: 'train', co2PerKm: 0.041, calPerKm: 0, speed: 60 },
];

const carCo2PerKm = 0.21;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomDate(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 14) + 7);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Seed achievements
  console.log('📦 Seeding achievements...');
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement
    });
  }
  console.log(`✅ Seeded ${achievements.length} achievements\n`);

  // Create demo users with journeys
  console.log('👥 Creating demo users with journeys...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  for (const demoUser of demoUsers) {
    let user = await prisma.user.findUnique({ where: { email: demoUser.email } });

    if (!user) {
      // Use raw create without the new fields to avoid type errors
      user = await prisma.user.create({
        data: {
          email: demoUser.email,
          name: demoUser.name,
          password: hashedPassword,
        }
      });
      console.log(`  Created user: ${demoUser.name}`);
    } else {
      console.log(`  User exists: ${demoUser.name}`);
    }

    // Create random journeys
    const existingJourneys = await prisma.journey.count({ where: { userId: user.id } });

    if (existingJourneys === 0) {
      const numJourneys = Math.floor(randomBetween(5, 15));
      
      for (let i = 0; i < numJourneys; i++) {
        const transport = transportModes[Math.floor(Math.random() * transportModes.length)];
        const distance = Math.round(randomBetween(2, 25) * 10) / 10;
        const travelTime = Math.round((distance / transport.speed) * 60);
        const co2Emissions = Math.round(distance * transport.co2PerKm * 100) / 100;
        const caloriesBurned = Math.round(distance * transport.calPerKm);
        const co2Saved = Math.round((carCo2PerKm * distance - co2Emissions) * 100) / 100;

        await prisma.journey.create({
          data: {
            userId: user.id,
            distance,
            transportMode: transport.mode,
            travelTime,
            co2Emissions,
            caloriesBurned,
            co2Saved,
            fromLocation: ['Home', 'Office', 'Market', 'Park', 'Station'][Math.floor(Math.random() * 5)],
            toLocation: ['Office', 'Home', 'Gym', 'Mall', 'College'][Math.floor(Math.random() * 5)],
            createdAt: getRandomDate(30),
          }
        });
      }
      console.log(`    Added ${numJourneys} journeys`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('📊 Demo accounts (password: demo123):');
  demoUsers.forEach(u => console.log(`   - ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
