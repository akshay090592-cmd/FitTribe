import React, { memo } from 'react';
import { Zap, Trophy, Star, Crown, MessageCircle, Target, Clock, Flame, Award, LucideProps } from 'lucide-react';

// BOLT: Static module-level dictionary avoids object allocations on every icon render
const BADGE_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Footprints: Zap,
  Sword: Trophy,
  Sun: Star,
  Moon: Star,
  Flame: Flame,
  Dumbbell: Crown,
  Users: Trophy,
  Coffee: Star,
  Crown: Crown,
  MessageCircle: MessageCircle,
  Target: Target,
  Clock: Clock,
  Zap: Zap,
  Award: Award,
};

interface BadgeIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * BOLT: Hoisted and memoized BadgeIcon component.
 * Having a stable component function reference prevents React from unmounting and remounting
 * DOM subtrees when parent components (ProfilePage, RewardsPage, BadgeModal) re-render.
 */
export const BadgeIcon: React.FC<BadgeIconProps> = memo(({ name, size = 24, className }) => {
  const Icon = BADGE_ICON_MAP[name] || Trophy;
  return <Icon size={size} className={className} />;
});
