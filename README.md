# 🌍 EcoTravel - Sustainable Travel Decision Tool

A modern web application that helps users make eco-friendly travel decisions by comparing transport modes, tracking environmental impact, and gamifying sustainable habits.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

## ✨ Features

### 🗺️ Interactive Route Selection
- **Google Maps-like Interface** - Search addresses with autocomplete
- **Click-to-Select** - Pick locations directly on the map
- **Real Road Distance** - Calculates actual driving distance (not straight-line)
- **Route Visualization** - See your route drawn on the map
- **GPS Support** - Use your current location

### ⚖️ Transport Mode Comparison
Compare 6 transport modes side-by-side:
| Mode | CO2/km | Speed | Calories |
|------|--------|-------|----------|
| 🚗 Car | 0.21 kg | 40 km/h | 0 |
| 🚌 Bus | 0.089 kg | 25 km/h | 0 |
| 🚆 Train | 0.041 kg | 60 km/h | 0 |
| 🚲 Bicycle | 0 kg | 15 km/h | 30 kcal |
| 🚶 Walking | 0 kg | 5 km/h | 60 kcal |
| ⚡ E-Bike | 0.006 kg | 20 km/h | 15 kcal |

### 🌱 Smart Eco Recommendations
- **Distance-based suggestions** - Best transport for your journey length
- **Environmental impact visualization** - Tree-days, phone charges equivalent
- **One-click mode selection** - Easy switching between options
- **Car warning** - Shows CO2 impact of driving

### 🚗➡️🚶 Intelligent Hybrid Journey Splitting

Our smart algorithm splits your journey into **Car + Walk/Bike** segments for the perfect balance of convenience and exercise.

#### How It Works

The algorithm considers:
- **Total journey distance**
- **Practical limits** for walking (~2.5km max) and cycling (~8km max)
- **Time efficiency** - keeping active portions reasonable

#### Split Logic

| Total Distance | Walking Mode | Cycling Mode |
|----------------|--------------|--------------|
| < 5 km | 40% walk (max 2km) | 50% bike (max 4km) |
| 5-10 km | 25% walk (max 2.5km) | 40% bike (max 6km) |
| 10-20 km | 15% walk (max 2.5km) | 30% bike (max 8km) |
| > 20 km | Fixed ~2km walk | Fixed ~8km bike |

#### Examples

```
10km trip + Walk → 7.5km car (75%) + 2.5km walk (25%)
10km trip + Bike → 6km car (60%) + 4km bike (40%)
30km trip + Walk → 28km car (93%) + 2km walk (7%)
30km trip + Bike → 22km car (73%) + 8km bike (27%)
```

#### Visual Route Display

The map shows your hybrid route with distinct colors:
- 🔴 **Red line** - Car segment (first portion)
- 🔵 **Blue line** - Walking segment (if Walk selected)
- 🟢 **Green line** - Cycling segment (if Bike selected)
- **P marker** - Parking/transition point

### 🅿️ Free Parking Finder

Find free parking spots near your destination to enable hybrid journeys:
- **OpenStreetMap Integration** - Real parking data from Overpass API
- **2km Radius Search** - Finds parking within walking/biking distance
- **Parking Types** - Surface lots, street parking, park & ride
- **Distance & Walking Time** - Shows how far each parking spot is

### 🎯 Lifestyle Goals & Health Tracking
Set personal goals during signup:
- **Weekly walking/cycling/transit days**
- **Maximum driving days limit**
- **Fitness goal** (lose weight, stay active, build stamina, reduce carbon)
- **Weekly calorie burn target**

Track progress with:
- **Activity rings** - Visual progress circles
- **Calorie progress bar**
- **Goal completion celebrations**

### 🎮 Gamification
- **Sustainability Score** - Points for eco-friendly travel
- **Achievement Badges** - Unlock milestones (1000 calories, 20kg CO2 saved, etc.)
- **Streak Tracking** - Consecutive sustainable travel days
- **Leaderboard** - Compete with other users

### 📊 Journey History
- Log all your trips
- View cumulative stats
- Track improvement over time

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Akashsinghpanwar/hack26.git
cd hack26/sustainable-travel

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Seed achievements
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file:
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite + Prisma ORM
- **Authentication**: NextAuth.js
- **Maps**: Leaflet + OpenStreetMap
- **Routing**: OSRM (Open Source Routing Machine)
- **Charts**: Recharts
- **State Management**: SWR

## 📁 Project Structure

```
sustainable-travel/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Achievement seeder
│   └── migrations/        # Database migrations
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── compare/       # Transport comparison
│   │   ├── history/       # Journey history
│   │   ├── leaderboard/   # User rankings
│   │   ├── achievements/  # Badge gallery
│   │   └── lifestyle-setup/ # Goals wizard
│   ├── components/
│   │   ├── ui/            # Base UI components
│   │   ├── journey/       # Map & input components
│   │   ├── comparison/    # Charts & metrics
│   │   └── gamification/  # Score, badges, streaks
│   └── lib/
│       ├── calculations.ts # CO2, time, calorie formulas
│       ├── prisma.ts      # Database client
│       └── auth.ts        # Auth configuration
└── public/
```

## 📱 Screenshots

### Dashboard
- Quick stats overview
- Interactive map for journey input
- Goal progress rings
- Sustainability score

### Compare Page
- Side-by-side transport comparison
- Visual charts (CO2, time, calories)
- Smart eco recommendations

### Lifestyle Setup
- 3-step goal wizard
- Activity preferences
- Health targets

## 🎯 Hackathon Challenge

Built for **Core29 Hackathon** - Sustainable Travel Decision Tool challenge.

**Requirements Met:**
- ✅ Journey input with distance/route
- ✅ Transport mode comparison
- ✅ Calculate travel time, CO2, calories
- ✅ Visual comparison vs driving
- ✅ Impact summaries & recommendations
- ✅ Sustainability score
- ✅ Leaderboards & achievements
- ✅ Streak tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Akash Singh Panwar**
- GitHub: [@Akashsinghpanwar](https://github.com/Akashsinghpanwar)

---

🌱 *Making sustainable travel choices, one journey at a time.*
