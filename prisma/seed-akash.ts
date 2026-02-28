import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import 'dotenv/config';

// Use better-sqlite3 adapter for Prisma 7 - db is in project root
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const transportModes = [
    { mode: 'bike', co2PerKm: 0, calPerKm: 30, speed: 15 },
    { mode: 'walk', co2PerKm: 0, calPerKm: 60, speed: 5 },
    { mode: 'ebike', co2PerKm: 0.006, calPerKm: 15, speed: 20 },
    { mode: 'bus', co2PerKm: 0.089, calPerKm: 0, speed: 25 },
    { mode: 'train', co2PerKm: 0.041, calPerKm: 0, speed: 60 },
    { mode: 'car', co2PerKm: 0.21, calPerKm: 0, speed: 40 }, // Added car to explicitly seed it
];

const carCo2PerKm = 0.21;

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function getRandomDate(daysBack: number) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    date.setHours(Math.floor(Math.random() * 14) + 7); // 7 AM to 9 PM
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
}

async function main() {
    console.log('🌱 Seeding database for Akash...');

    // Find users
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: 'akash' } },
                { email: { contains: 'akash' } }
            ]
        }
    });

    if (users.length === 0) {
        console.log('❌ Could not find a user matching "akash"');
        return;
    }

    const user = users[0];
    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Clear existing journeys for this user to avoid duplicates if run multiple times
    await prisma.journey.deleteMany({
        where: { userId: user.id }
    });
    console.log(`🗑️ Cleared existing journeys for user`);

    // Update user goals to make the dashboard look active
    await prisma.user.update({
        where: { id: user.id },
        data: {
            walkingGoal: 5,
            cyclingGoal: 4,
            publicTransitGoal: 3,
            maxDrivingDays: 2,
            fitnessGoal: 'stay_active',
            weeklyCalorieTarget: 1500,
        }
    });

    // Add ~50 dummy journeys over the last 30 days
    const numJourneys = 50;
    console.log(`📦 Adding ${numJourneys} journeys...`);

    let totalCo2Saved = 0;
    let totalCalories = 0;

    for (let i = 0; i < numJourneys; i++) {
        // Bias towards eco-friendly modes
        const modeRoll = Math.random();
        let modeName = 'walk';
        if (modeRoll > 0.8) modeName = 'car';
        else if (modeRoll > 0.6) modeName = 'train';
        else if (modeRoll > 0.4) modeName = 'bus';
        else if (modeRoll > 0.2) modeName = 'bike';

        const transport = transportModes.find(t => t.mode === modeName) || transportModes[0];

        // Random distance 1-30km
        const distance = Math.round(randomBetween(1, 30) * 10) / 10;
        const travelTime = Math.round((distance / transport.speed) * 60);
        const co2Emissions = Math.round(distance * transport.co2PerKm * 100) / 100;
        const caloriesBurned = Math.round(distance * transport.calPerKm);
        const co2Saved = Math.round((carCo2PerKm * distance - co2Emissions) * 100) / 100;

        totalCo2Saved += Math.max(0, co2Saved);
        totalCalories += caloriesBurned;

        await prisma.journey.create({
            data: {
                userId: user.id,
                distance,
                transportMode: transport.mode,
                travelTime,
                co2Emissions,
                caloriesBurned,
                co2Saved: Math.max(0, co2Saved), // Don't allow negative savings if car is used
                fromLocation: ['Home', 'Office', 'Market', 'Gym', 'Station'][Math.floor(Math.random() * 5)],
                toLocation: ['Office', 'Home', 'Cafe', 'Mall', 'College'][Math.floor(Math.random() * 5)],
                createdAt: getRandomDate(30),
            }
        });
    }

    console.log(`✅ Added ${numJourneys} journeys`);

    // Grant some achievements
    const allAchievements = await prisma.achievement.findMany();
    if (allAchievements.length > 0) {
        // Give 3 random achievements
        for (let i = 0; i < 3; i++) {
            const ach = allAchievements[Math.floor(Math.random() * allAchievements.length)];
            try {
                await prisma.userAchievement.create({
                    data: {
                        userId: user.id,
                        achievementId: ach.id,
                    }
                });
            } catch (e) {
                // Ignore unique constraint errors
            }
        }
        console.log(`🏆 Granted some achievements`);
    }

    console.log('🎉 Done seeding dummy data for Akash!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
