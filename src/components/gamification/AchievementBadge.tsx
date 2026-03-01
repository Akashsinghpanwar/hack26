'use client';

import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  className?: string;
}

export function AchievementBadge({ 
  icon, 
  name, 
  description, 
  unlocked, 
  unlockedAt,
  className 
}: AchievementBadgeProps) {
  return (
    <div 
      className={cn(
        "relative flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 transition-all",
        unlocked 
          ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-50" 
          : "border-gray-200 bg-gray-50 opacity-50 grayscale",
        className
      )}
    >
      {unlocked && (
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] sm:text-xs">✓</span>
        </div>
      )}
      
      <div className={cn(
        "text-3xl sm:text-4xl mb-1.5 sm:mb-2",
        !unlocked && "filter grayscale"
      )}>
        {icon}
      </div>
      
      <h4 className="font-semibold text-xs sm:text-sm text-center">{name}</h4>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-0.5 sm:mt-1">{description}</p>
      
      {unlocked && unlockedAt && (
        <p className="text-[10px] sm:text-xs text-green-600 mt-1.5 sm:mt-2">
          Unlocked {new Date(unlockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

interface AchievementsGridProps {
  achievements: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    unlocked?: boolean;
    unlockedAt?: Date;
  }>;
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          icon={achievement.icon}
          name={achievement.name}
          description={achievement.description}
          unlocked={achievement.unlocked || false}
          unlockedAt={achievement.unlockedAt}
        />
      ))}
    </div>
  );
}
