'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Custom SVG icons
const FeatureIcons = {
  map: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
    </svg>
  ),
  leaf: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5-4 3-7 6-10-3 0-6 1.5-8 4 0-4 2.5-8 8-8-2 6-6 12-6 12"/>
      <path d="M7 21c0-4 4-8 8-11"/>
    </svg>
  ),
  chart: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  trophy: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8m-4-4v4M6 4h12v3a6 6 0 01-12 0V4zM4 4h2m14 0h2M4 4a2 2 0 00-2 2v1a3 3 0 003 3m17-6a2 2 0 012 2v1a3 3 0 01-3 3"/>
    </svg>
  ),
  target: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  heart: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
};

const features = [
  {
    icon: FeatureIcons.map,
    title: 'Smart Route Planning',
    description: 'Interactive maps with real-time distance calculation. Search any address or click to select.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FeatureIcons.leaf,
    title: 'Eco Impact Analysis',
    description: 'See exactly how much CO2 you save by choosing sustainable transport options.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FeatureIcons.chart,
    title: 'Compare All Options',
    description: 'Side-by-side comparison of car, bus, train, bike, walk, and e-bike with detailed metrics.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FeatureIcons.trophy,
    title: 'Leaderboards & Badges',
    description: 'Compete with others, unlock achievements, and climb the sustainability rankings.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: FeatureIcons.target,
    title: 'Personal Goals',
    description: 'Set weekly walking, cycling, and transit goals. Track your progress with visual rings.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: FeatureIcons.heart,
    title: 'Health Tracking',
    description: 'Monitor calories burned and build healthy habits through active transportation.',
    color: 'from-teal-500 to-green-500',
  },
];

const stats = [
  { value: '6', label: 'Transport Modes' },
  { value: '80%', label: 'CO2 Reduction' },
  { value: '60', label: 'Cal/km Walking' },
  { value: '∞', label: 'Planet Impact' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Sustainable Travel Made Simple
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Make Every Journey
              <span className="block gradient-text">Count for the Planet</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Compare transport modes, track your environmental impact, and build sustainable habits. 
              Every kilometer matters.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Start Your Journey
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </Button>
              </Link>
              <Link href="/compare">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl border-2">
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for
              <span className="gradient-text"> Sustainable Travel</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit to make eco-friendly transport decisions and track your positive impact on the environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-lg stat-card">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Transport Comparison Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Compare <span className="gradient-text">6 Transport Modes</span>
              </h2>
              <p className="text-muted-foreground">
                See the real impact of your transport choices at a glance
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { mode: 'Car', co2: '0.21 kg', icon: '🚗', bg: 'bg-red-50', border: 'border-red-200' },
                { mode: 'Bus', co2: '0.089 kg', icon: '🚌', bg: 'bg-orange-50', border: 'border-orange-200' },
                { mode: 'Train', co2: '0.041 kg', icon: '🚆', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                { mode: 'Bike', co2: '0 kg', icon: '🚲', bg: 'bg-green-50', border: 'border-green-200' },
                { mode: 'Walk', co2: '0 kg', icon: '🚶', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { mode: 'E-Bike', co2: '0.006 kg', icon: '⚡', bg: 'bg-cyan-50', border: 'border-cyan-200' },
              ].map((item, index) => (
                <Card key={index} className={`${item.bg} ${item.border} border-2`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-semibold text-sm">{item.mode}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.co2}/km CO2
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-emerald-500">
            <CardContent className="p-8 md:p-12 text-center text-white">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Join thousands of eco-conscious travelers making sustainable choices every day.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="px-8 py-6 text-lg rounded-xl font-semibold">
                  Create Free Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-emerald-500" />
              <span className="font-semibold">EcoTravel</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Core29 Hackathon · Making sustainable travel accessible
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="https://github.com/Akashsinghpanwar/hack26" className="hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
