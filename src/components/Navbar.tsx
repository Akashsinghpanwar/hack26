'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/compare', label: 'Compare', icon: '⚖️' },
    { href: '/history', label: 'History', icon: '📜' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { href: '/achievements', label: 'Achievements', icon: '🎖️' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              EcoTravel
            </span>
          </Link>

          {status === 'authenticated' && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "gap-1",
                      pathname === item.href && "bg-primary/10"
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {status === 'authenticated' && (
          <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1 whitespace-nowrap"
                >
                  <span>{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
