import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  const features = [
    {
      icon: '📊',
      title: 'Compare Transport Modes',
      description: 'See CO2, time, and calories for walking, cycling, bus, train, and driving'
    },
    {
      icon: '🌍',
      title: 'Track Your Impact',
      description: 'Monitor how much CO2 you\'re saving compared to driving'
    },
    {
      icon: '🔥',
      title: 'Burn Calories',
      description: 'See how many calories you burn with active transport'
    },
    {
      icon: '🏆',
      title: 'Earn Achievements',
      description: 'Unlock badges for sustainable travel milestones'
    },
    {
      icon: '📈',
      title: 'Climb Leaderboards',
      description: 'Compete with others to save the most CO2'
    },
    {
      icon: '🔥',
      title: 'Build Streaks',
      description: 'Maintain daily sustainable travel streaks'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Make Sustainable Travel
            <span className="block bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              Visible & Easy
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Compare transport modes, track your CO2 savings, burn calories, and earn achievements. 
            Make every journey count for the planet.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <span>🚀</span> Get Started Free
              </Button>
            </Link>
            <Link href="/compare">
              <Button size="lg" variant="outline" className="gap-2">
                <span>⚖️</span> Try Calculator
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">0.21</div>
              <div className="text-sm text-muted-foreground">kg CO2 per km by car</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">kg CO2 by bike</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">30</div>
              <div className="text-sm text-muted-foreground">kcal burned per km cycling</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Use EcoTravel?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Everything you need to make sustainable travel decisions and track your environmental impact.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <span className="text-4xl mb-4 block">{feature.icon}</span>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Start tracking your sustainable travel today. It&apos;s free, easy, and helps you understand your environmental impact.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              <span>🌱</span> Start Your Green Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted/30 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Built for Core29 Hackathon - Making Sustainable Travel Visible</p>
          <p className="mt-2">🌍 Every journey counts. Choose green.</p>
        </div>
      </footer>
    </div>
  );
}
