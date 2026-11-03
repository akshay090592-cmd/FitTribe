// Use string alias for flexibility
export type User = string;
// Removed legacy User enum to support multi-tenancy.

export interface Tribe {
  id: string;
  name: string;
  code: string;
}

export interface UserProfile {
  id: string; // Supabase UUID
  email: string;
  displayName: string; // The Panda Persona
  tribeId?: string;
  avatarId?: string; // 'male' | 'female' | 'female_2' | etc.
  fitnessLevel?: 'beginner' | 'advanced';
  xp?: number;
  level?: number;
  commitmentTime?: string; // ISO string
  height?: number; // cm
  weight?: number; // kg
  gender?: 'male' | 'female' | 'other';

  dob?: string; // ISO string
  weeklyGoal?: number;
  customChallenges?: CustomChallenge[]; // Array of active challenges (one per type)
  completedChallenges?: CustomChallenge[];
  workoutTemplates?: WorkoutTemplate[];
  goals?: UserGoals;
  customPlans?: WorkoutPlan[];
  bodyFatPercentage?: number; // Fetched from Google Health
  googleHealthConnected?: boolean;
  googleHealthAccessToken?: string;
  googleHealthTokenExpiry?: number; // Timestamp
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    trackingType?: 'reps' | 'duration';
    image?: string;
    visualArchetype?: ExerciseArchetype;
    equipment?: ExerciseEquipment;
  }[];
}

export interface UserGoals {
  primary_goal?: string;
  stress_level?: string;
  energy_level?: string;
  restrictions?: string[];
  weekly_frequency?: number;
}

export interface CustomChallenge {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly';
  startDate: string; // ISO string
  endDate: string; // ISO string
  target: number;
  progress: number;
  unit?: string; // e.g. "pushups", "km"
  completed: boolean;
  lastUpdated?: string; // ISO string
}

export enum WorkoutType {
  A = 'A',
  B = 'B',
  CUSTOM = 'Custom',
  CUSTOM_TEMPLATE = 'Custom_Template',
  COMMITMENT = 'COMMITMENT'
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  time?: number; // duration in seconds
  completed: boolean;
}

export interface ProgressionSuggestion {
  type: 'increase_weight' | 'increase_reps' | 'maintain';
  suggestedWeight: number;
  suggestedReps: number;
  reason: string;
}

export type ExerciseArchetype =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'knee_dominant'
  | 'lunge_unilateral'
  | 'hip_dominant'
  | 'glute_bridge'
  | 'isolation_arms'
  | 'isolation_shoulders'
  | 'core_floor'
  | 'cardio_conditioning'
  | 'mobility_stretch';

export type ExerciseEquipment =
  | 'dumbbell'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'cardio'
  | 'mobility';

export interface ExerciseRecord {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  isSuperset?: boolean;
  supersetGroup?: number;
  suggestion?: ProgressionSuggestion;
  trackingType?: 'reps' | 'duration';
  visualArchetype?: ExerciseArchetype;
  equipment?: ExerciseEquipment;
}

export interface WorkoutPlan {
  id: WorkoutType;
  title: string;
  focus: string;
  warmup: string[];
  exercises: {
    name: string;
    defaultSets: number;
    defaultReps: string;
    trackingType?: 'reps' | 'duration';
    notes: string;
    cues?: string[];
    image?: string;
    visualArchetype?: ExerciseArchetype;
    equipment?: ExerciseEquipment;
    isSuperset?: boolean;
    supersetGroup?: number;
    restSeconds?: number;
  }[];
  cooldown: string[];
  changesSummary?: string[];
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO string
  user: User;
  type: WorkoutType;
  exercises: ExerciseRecord[];
  durationMinutes: number;
  calories?: number;
  vibes?: number;
  image_data?: string;
  customActivity?: string;
  intensity?: number;
  isCommitmentFulfillment?: boolean;
}

export interface PRStats {
  [exerciseName: string]: {
    maxWeight: number;
    maxReps: number;
    estimated1RM: number;
  };
}

// --- GAMIFICATION TYPES ---

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name reference
  rarity: 'common' | 'rare' | 'legendary';
  unlockedAt?: string; // ISO Date if unlocked
}

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  count: number;
}

export interface GiftTransaction {
  id: string;
  from: User;
  to: User;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  message: string;
  date: string;
}

export interface UserGamificationState {
  badges: string[]; // IDs of unlocked badges
  inventory: GiftItem[];
  points: number;
  streak: number;
  lifetimeXp?: number; // Total XP earned (immune to spending). If undefined, fallback to points for migration.
  unlockedThemes: string[];
  activeTheme: string;
  commitment?: string | null; // ISO Date string for commitment
  streakFreezes?: number; // 0-2 equipped Bamboo Ice Shields
  frozenDates?: string[]; // ISO YYYY-MM-DD dates protected by a freeze
  activeXpBoost?: { multiplier: number; expiresAt: string } | null;
  streakWager?: { startDate: string; targetDays: number; stakePoints: number; status: 'active' | 'won' | 'lost' } | null;
  claimedDailyChests?: { date: string; tiers: number[] };
}

export interface SocialComment {
  id: string;
  logId: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
}

export interface Theme {
  id: string;
  name: string;
  type: 'color' | 'image';
  value: string; // e.g., 'bg-blue-500' or '/assets/jungle_bg_2.webp'
  price: number;
  description: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  image_data?: string;
}

export interface XPLog {
  id: number;
  user_id: string;
  amount: number;
  source: string; // 'workout', 'badge', 'quest'
  source_id?: string;
  created_at: string;
}

export interface PointLog {
  id: number;
  user_id: string;
  amount: number; // Positive (earned) or Negative (spent)
  type: 'earned' | 'spent';
  source: string; // 'workout', 'badge', 'quest', 'shop'
  source_id?: string;
  created_at: string;
}

// --- QUEST TYPES ---
export type QuestType = 'workout' | 'social_reaction' | 'social_gift' | 'manual';

export interface Quest {
  id: string;
  templateId: string;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  progress: number;
  completed: boolean;
  rewardPoints: number;
  rewardXp: number;
  icon: string; // Lucide icon name
}

// --- AI COACH FEEDBACK ---
export interface WorkoutFeedback {
  logId: string;
  difficultyRating: number; // 1-5
  skippedExercises: string[];
  painPoints: string[];
  notes?: string;
}

export type PlanStatus = 'done' | 'alternate' | 'partial' | 'not_done' | null;

export interface WeeklyPlanItem {
  date: string; // ISO string
  day: string;
  activity: string;
  type: string;
  notes: string;
  status: PlanStatus;
}

export interface WeeklyPlan {
  summary: string;
  schedule: WeeklyPlanItem[];
}


// --- TRIBE PHOTO ---
export interface TribePhoto {
  id: string;
  userId: string;
  userName: string;
  imageData: string; // Base64
  tribeId?: string;
  createdAt: string;
}
