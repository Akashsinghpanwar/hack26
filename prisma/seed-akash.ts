import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import 'dotenv/config';

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

// ─── Real Aberdeen Locations from AB Postcode Area ───────────────────────────
// Each entry: [name, postcode, lat, lng] (approx coords for realism)
const aberdeenLocations = [
    // City centre & nearby
    { name: 'Union Square, Aberdeen', postcode: 'AB11 5RG', area: 'Ferryhill' },
    { name: 'Marischal College, Aberdeen', postcode: 'AB10 1AB', area: 'City Centre' },
    { name: 'Aberdeen Train Station', postcode: 'AB11 6LX', area: 'City Centre' },
    { name: 'Aberdeen Royal Infirmary', postcode: 'AB25 2ZN', area: 'Kittybrewster' },
    { name: 'Robert Gordon University', postcode: 'AB10 7QE', area: 'Garthdee' },
    { name: 'University of Aberdeen', postcode: 'AB24 3FX', area: 'Old Aberdeen' },
    { name: 'Hazlehead Park', postcode: 'AB15 8BE', area: 'Hazlehead' },
    { name: 'Cults Primary School', postcode: 'AB15 9QY', area: 'Cults' },
    { name: 'Bridge of Don Retail Park', postcode: 'AB22 8HH', area: 'Bridge of Don' },
    { name: 'Dyce Shopping Centre', postcode: 'AB21 7FE', area: 'Dyce' },
    { name: 'Aberdeen Airport', postcode: 'AB21 7DU', area: 'Dyce' },
    { name: 'Torry Community Hub', postcode: 'AB11 8DH', area: 'Torry' },

    // Suburbs & satellite towns
    { name: 'Cove Bay Beach', postcode: 'AB12 3GE', area: 'Cove Bay' },
    { name: 'Kingswells Park & Ride', postcode: 'AB15 8UH', area: 'Kingswells' },
    { name: 'Westhill Shopping Centre', postcode: 'AB32 6JQ', area: 'Westhill' },
    { name: 'Peterculter Post Office', postcode: 'AB14 0RQ', area: 'Peterculter' },
    { name: 'Milltimber Village', postcode: 'AB13 0ES', area: 'Milltimber' },
    { name: 'Balmedie Country Park', postcode: 'AB23 8YL', area: 'Balmedie' },
    { name: 'Portlethen Academy', postcode: 'AB12 4QL', area: 'Portlethen' },
    { name: 'Northfield Swimming Pool', postcode: 'AB16 7AW', area: 'Northfield' },

    // Aberdeenshire towns
    { name: 'Stonehaven Harbour', postcode: 'AB39 2JU', area: 'Stonehaven' },
    { name: 'Inverurie Town Centre', postcode: 'AB51 3QA', area: 'Inverurie' },
    { name: 'Banchory High Street', postcode: 'AB31 5SS', area: 'Banchory' },
    { name: 'Ellon Tesco', postcode: 'AB41 9AA', area: 'Ellon' },
    { name: 'Peterhead Town Centre', postcode: 'AB42 1BT', area: 'Peterhead' },
    { name: 'Fraserburgh Leisure Centre', postcode: 'AB43 9TT', area: 'Fraserburgh' },
    { name: 'Huntly Swimming Pool', postcode: 'AB54 8DN', area: 'Huntly' },
    { name: 'Newtonhill Village', postcode: 'AB39 3RP', area: 'Newtonhill' },
    { name: 'Laurencekirk Square', postcode: 'AB30 1BJ', area: 'Laurencekirk' },
    { name: 'Aboyne Village Green', postcode: 'AB34 5HT', area: 'Aboyne' },
];

// Realistic distance matrix (approx km between common Aberdeen routes)
const routeTemplates = [
    // City centre commutes (short, 2-8km)
    { from: 'Union Square, Aberdeen', to: 'University of Aberdeen', dist: 3.2, mode: 'bus' },
    { from: 'Aberdeen Train Station', to: 'Robert Gordon University', dist: 4.1, mode: 'bike' },
    { from: 'Marischal College, Aberdeen', to: 'Aberdeen Royal Infirmary', dist: 2.8, mode: 'walk' },
    { from: 'Torry Community Hub', to: 'Union Square, Aberdeen', dist: 1.9, mode: 'walk' },
    { from: 'Aberdeen Royal Infirmary', to: 'Hazlehead Park', dist: 4.5, mode: 'bike' },
    { from: 'Marischal College, Aberdeen', to: 'Bridge of Don Retail Park', dist: 5.6, mode: 'bus' },
    { from: 'Union Square, Aberdeen', to: 'Northfield Swimming Pool', dist: 4.8, mode: 'bus' },

    // Suburban commutes (8-15km)
    { from: 'Kingswells Park & Ride', to: 'Union Square, Aberdeen', dist: 10.2, mode: 'bus' },
    { from: 'Cove Bay Beach', to: 'Aberdeen Train Station', dist: 8.5, mode: 'car' },
    { from: 'Westhill Shopping Centre', to: 'Marischal College, Aberdeen', dist: 12.4, mode: 'car' },
    { from: 'Dyce Shopping Centre', to: 'Union Square, Aberdeen', dist: 9.8, mode: 'bus' },
    { from: 'Milltimber Village', to: 'Robert Gordon University', dist: 7.2, mode: 'ebike' },
    { from: 'Peterculter Post Office', to: 'Hazlehead Park', dist: 8.1, mode: 'bike' },
    { from: 'Portlethen Academy', to: 'Union Square, Aberdeen', dist: 11.3, mode: 'train' },
    { from: 'Cults Primary School', to: 'Marischal College, Aberdeen', dist: 6.5, mode: 'bike' },
    { from: 'Balmedie Country Park', to: 'Bridge of Don Retail Park', dist: 8.9, mode: 'car' },
    { from: 'Aberdeen Airport', to: 'Aberdeen Train Station', dist: 10.5, mode: 'bus' },

    // Longer Aberdeenshire trips (15-50km)
    { from: 'Stonehaven Harbour', to: 'Aberdeen Train Station', dist: 24.8, mode: 'train' },
    { from: 'Inverurie Town Centre', to: 'Union Square, Aberdeen', dist: 27.3, mode: 'train' },
    { from: 'Banchory High Street', to: 'Robert Gordon University', dist: 28.5, mode: 'car' },
    { from: 'Ellon Tesco', to: 'Bridge of Don Retail Park', dist: 22.1, mode: 'car' },
    { from: 'Newtonhill Village', to: 'Union Square, Aberdeen', dist: 16.4, mode: 'train' },
    { from: 'Laurencekirk Square', to: 'Stonehaven Harbour', dist: 19.7, mode: 'car' },
    { from: 'Aboyne Village Green', to: 'Banchory High Street', dist: 17.5, mode: 'bus' },
    { from: 'Peterhead Town Centre', to: 'Aberdeen Train Station', dist: 51.2, mode: 'train' },
    { from: 'Fraserburgh Leisure Centre', to: 'Aberdeen Train Station', dist: 65.3, mode: 'car' },
    { from: 'Huntly Swimming Pool', to: 'Inverurie Town Centre', dist: 39.4, mode: 'car' },
];

const transportModes: Record<string, { co2PerKm: number; calPerKm: number; speed: number }> = {
    bike: { co2PerKm: 0, calPerKm: 30, speed: 15 },
    walk: { co2PerKm: 0, calPerKm: 60, speed: 5 },
    ebike: { co2PerKm: 0.006, calPerKm: 15, speed: 20 },
    bus: { co2PerKm: 0.089, calPerKm: 0, speed: 25 },
    train: { co2PerKm: 0.041, calPerKm: 0, speed: 60 },
    car: { co2PerKm: 0.21, calPerKm: 0, speed: 40 },
};
const carCo2PerKm = 0.21;

function getRealisticDate(index: number, total: number) {
    // Spread journeys over the last 30 days, with more recent ones being denser
    const now = new Date();
    const daysAgo = Math.floor((index / total) * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - (30 - daysAgo)); // older first, newest last
    // Realistic commute hours: 7-9am or 4-7pm
    const isMorning = Math.random() > 0.45;
    date.setHours(isMorning ? 7 + Math.floor(Math.random() * 3) : 16 + Math.floor(Math.random() * 4));
    date.setMinutes(Math.floor(Math.random() * 60));
    date.setSeconds(Math.floor(Math.random() * 60));
    return date;
}

async function main() {
    console.log('🌱 Seeding realistic Aberdeen data for Akash...\n');

    // Find Akash's user
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

    // Clear old journeys & achievements
    await prisma.userAchievement.deleteMany({ where: { userId: user.id } });
    await prisma.journey.deleteMany({ where: { userId: user.id } });
    console.log('🗑️  Cleared old journeys & achievements\n');

    // Update user goals
    await prisma.user.update({
        where: { id: user.id },
        data: {
            walkingGoal: 4,
            cyclingGoal: 3,
            publicTransitGoal: 3,
            maxDrivingDays: 2,
            fitnessGoal: 'stay_active',
            weeklyCalorieTarget: 2000,
            preferredModes: 'bike,walk,train',
            setupCompleted: true,
        }
    });
    console.log('⚙️  Updated lifestyle goals\n');

    // Create journeys from route templates + some randomized ones
    const totalJourneys = 55;
    let journeyCount = 0;

    // First: use all predefined route templates (realistic routes)
    for (let i = 0; i < routeTemplates.length && journeyCount < totalJourneys; i++) {
        const route = routeTemplates[i];
        const transport = transportModes[route.mode];
        const distance = route.dist;
        const travelTime = Math.round((distance / transport.speed) * 60);
        const co2Emissions = Math.round(distance * transport.co2PerKm * 100) / 100;
        const caloriesBurned = Math.round(distance * transport.calPerKm);
        const co2Saved = Math.max(0, Math.round((carCo2PerKm * distance - co2Emissions) * 100) / 100);

        await prisma.journey.create({
            data: {
                userId: user.id,
                distance,
                transportMode: route.mode,
                travelTime,
                co2Emissions,
                caloriesBurned,
                co2Saved,
                fromLocation: route.from,
                toLocation: route.to,
                createdAt: getRealisticDate(journeyCount, totalJourneys),
            }
        });
        journeyCount++;
    }

    // Then: fill remaining journeys with random pairings from our locations
    while (journeyCount < totalJourneys) {
        const fromLoc = aberdeenLocations[Math.floor(Math.random() * aberdeenLocations.length)];
        let toLoc = aberdeenLocations[Math.floor(Math.random() * aberdeenLocations.length)];
        while (toLoc.name === fromLoc.name) {
            toLoc = aberdeenLocations[Math.floor(Math.random() * aberdeenLocations.length)];
        }

        // Pick a realistic distance based on whether both are in city or farther out
        const isBothCity = fromLoc.postcode.startsWith('AB1') && toLoc.postcode.startsWith('AB1');
        const distance = isBothCity
            ? Math.round((2 + Math.random() * 8) * 10) / 10     // 2-10km city trips
            : Math.round((8 + Math.random() * 35) * 10) / 10;   // 8-43km inter-town

        // Pick mode based on distance
        let mode: string;
        if (distance < 3) mode = 'walk';
        else if (distance < 8) mode = Math.random() > 0.5 ? 'bike' : 'bus';
        else if (distance < 15) mode = Math.random() > 0.4 ? 'bus' : (Math.random() > 0.5 ? 'car' : 'ebike');
        else if (distance < 30) mode = Math.random() > 0.5 ? 'train' : 'car';
        else mode = Math.random() > 0.3 ? 'car' : 'train';

        const transport = transportModes[mode];
        const travelTime = Math.round((distance / transport.speed) * 60);
        const co2Emissions = Math.round(distance * transport.co2PerKm * 100) / 100;
        const caloriesBurned = Math.round(distance * transport.calPerKm);
        const co2Saved = Math.max(0, Math.round((carCo2PerKm * distance - co2Emissions) * 100) / 100);

        await prisma.journey.create({
            data: {
                userId: user.id,
                distance,
                transportMode: mode,
                travelTime,
                co2Emissions,
                caloriesBurned,
                co2Saved,
                fromLocation: `${fromLoc.name}, ${fromLoc.postcode}`,
                toLocation: `${toLoc.name}, ${toLoc.postcode}`,
                createdAt: getRealisticDate(journeyCount, totalJourneys),
            }
        });
        journeyCount++;
    }

    console.log(`✅ Added ${journeyCount} journeys with real Aberdeen locations\n`);

    // Grant achievements
    const allAchievements = await prisma.achievement.findMany();
    const achievementsToGrant = allAchievements.filter(
        a => a.type === 'journeys' && a.threshold <= journeyCount
            || a.type === 'streak' && a.threshold <= 7
    );
    for (const ach of achievementsToGrant) {
        try {
            await prisma.userAchievement.create({
                data: { userId: user.id, achievementId: ach.id }
            });
            console.log(`  🏆 Granted: ${ach.name} (${ach.icon})`);
        } catch (e) { /* skip duplicates */ }
    }

    console.log('\n🎉 Done! Akash now has realistic Aberdeen journey data.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
