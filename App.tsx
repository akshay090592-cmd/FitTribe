import React, { useState, useEffect, useCallback } from 'react';
import { User, WorkoutType, UserProfile, WorkoutPlan, WorkoutTemplate } from './types';
import { STARTER_PLANS } from './constants';
import { LoadingSpinner } from './components/LoadingSpinner';
import { InfoTooltip } from './components/InfoTooltip';
import { getUserLogs, getCurrentProfile, createProfile, saveLog, updateLog, createTribe, joinTribe } from './utils/storage';
import { notifyTribeOnActivity, notifyTribeOnCommitment } from './services/notificationService';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import { initSyncListener } from './utils/sync';
import { useNotifications } from './hooks/useNotifications';
import { useToast } from './components/Toast';
import { NotificationCenter } from './components/NotificationCenter';
import { ReloadPrompt } from './components/ReloadPrompt';
import { getMood, getTeamStats, SHOP_THEMES, getLevelProgress, getStreaks, checkAchievements, getStreakRisk } from './utils/gamification';
import { getGamificationState, updateUserCommitment, updateProfile, getLogs, getAllReactions, getGiftTransactions, processOfflineQueue, deleteLog, getUserPlans, saveUserPlan, getTribeMembers } from './utils/storage';
import { requestNotificationPermission, onMessageListener } from './services/firebase';
import { Activity, BarChart3, Dumbbell, User as UserIcon, TrendingUp, Users, Trophy, Map, LogOut, Mail, Lock, ArrowRight, AlertCircle, WifiOff, Flame, Clock, History, Sparkles, Loader2, Heart } from 'lucide-react';
import { TribePulse } from './components/TribePulse';
import { QuestBoard } from './components/QuestBoard';
import { getDailyQuests, getOnboardingQuests, completeManualQuest } from './utils/questUtils';
import { NotificationPopup } from './components/NotificationPopup';
import { getAvatarPath } from './utils/avatar';
import { StatsDetailPopup } from './components/StatsDetailPopup';
import { TutorialPage } from './components/TutorialPage';
import { HistoryModal } from './components/HistoryModal';
import { formatDistanceToNow } from 'date-fns';
import { WeeklyStatsWidget } from './components/WeeklyStatsWidget';
import { CreateChallengeModal } from './components/CreateChallengeModal';
import { Plus } from 'lucide-react';
import { WorkoutLibraryModal } from './components/WorkoutLibraryModal';
import { DesktopNavigation } from './components/DesktopNavigation';
import { LandingPage } from './components/LandingPage';
import { AboutUs } from './components/AboutUs';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { ContactUs } from './components/ContactUs';
import { Leaderboard } from './components/Leaderboard';
import { Calendar } from './components/Calendar';
import { TribeStatusCard } from './components/TribeStatusCard';
import { Blog1 } from './components/blogs/Blog1';
import { Blog2 } from './components/blogs/Blog2';
import { Blog3 } from './components/blogs/Blog3';
import { Blog4 } from './components/blogs/Blog4';
import { Blog5 } from './components/blogs/Blog5';
import { Blog6 } from './components/blogs/Blog6';
import { Blog7 } from './components/blogs/Blog7';
import { Blog8 } from './components/blogs/Blog8';
import { Blog9 } from './components/blogs/Blog9';
import { Blog10 } from './components/blogs/Blog10';

// Dynamic imports for code splitting
const WorkoutSession = React.lazy(() => import('./components/WorkoutSession').then(module => ({ default: module.WorkoutSession })));
const Analytics = React.lazy(() => import('./components/Analytics').then(module => ({ default: module.Analytics })));
const SocialFeed = React.lazy(() => import('./components/SocialFeed').then(module => ({ default: module.SocialFeed })));

const RewardsPage = React.lazy(() => import('./components/RewardsPage').then(module => ({ default: module.RewardsPage })));
const ProfilePage = React.lazy(() => import('./components/ProfilePage').then(module => ({ default: module.ProfilePage })));
const ActivityTrackerModal = React.lazy(() => import('./components/ActivityTrackerModal').then(module => ({ default: module.ActivityTrackerModal })));
const UserProfilePopup = React.lazy(() => import('./components/UserProfilePopup').then(module => ({ default: module.UserProfilePopup })));
const CoachView = React.lazy(() => import('./components/CoachView').then(module => ({ default: module.CoachView })));

const VIEW_PATHS: Record<string, string> = {
  dashboard: '/',
  landing: '/',
  about: '/about',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',
  blog1: '/blog/community-workouts-effectiveness',
  blog2: '/blog/science-behind-group-motivation',
  blog3: '/blog/social-accountability-fitness',
  blog4: '/blog/consistency-mechanisms',
  blog5: '/blog/breaking-fitness-barriers',
  blog6: '/blog/ai-workout-planner-revolution',
  blog7: '/blog/best-workout-plan-science',
  blog8: '/blog/social-fitness-success-secret',
  blog9: '/blog/gamified-fitness-motivation-hack',
  blog10: '/blog/personal-ai-fitness-coach-guide',
};

const PATH_TO_VIEW: Record<string, string> = {
  '/': 'dashboard',
  '/about': 'about',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/contact': 'contact',
  '/blog/community-workouts-effectiveness': 'blog1',
  '/blog/science-behind-group-motivation': 'blog2',
  '/blog/social-accountability-fitness': 'blog3',
  '/blog/consistency-mechanisms': 'blog4',
  '/blog/breaking-fitness-barriers': 'blog5',
  '/blog/ai-workout-planner-revolution': 'blog6',
  '/blog/best-workout-plan-science': 'blog7',
  '/blog/social-fitness-success-secret': 'blog8',
  '/blog/gamified-fitness-motivation-hack': 'blog9',
  '/blog/personal-ai-fitness-coach-guide': 'blog10',
};

type AppView = 'dashboard' | 'workout' | 'analytics' | 'social' | 'rewards' | 'profile' | 'coach' | 'about' | 'privacy' | 'terms' | 'contact' | 'landing' | 'blog1' | 'blog2' | 'blog3' | 'blog4' | 'blog5' | 'blog6' | 'blog7' | 'blog8' | 'blog9' | 'blog10';

const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Motivation is what gets you started. Habit is what keeps you going."
];

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group ${active ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white -translate-y-4 shadow-lg shadow-emerald-900/40 scale-110' : 'text-emerald-100/40 hover:text-white hover:bg-white/10'}`}
  >
    <Icon size={active ? 24 : 22} strokeWidth={active ? 2.5 : 2} className="transition-all" />
    {active && (
      <span className="absolute -bottom-8 text-[10px] font-bold text-emerald-300 whitespace-nowrap animate-fade-in-up bg-black/80 border border-white/10 px-2 py-1 rounded-full backdrop-blur-md">
        {label}
      </span>
    )}
  </button>
);

const SESSION_RESTORE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

const App: React.FC = () => {
  /* Helper to check if Env Vars are loaded - Defined early for use in useEffect */
  const supabaseReady = isSupabaseConfigured();

  const randomQuote = React.useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Optimistic Load
    const saved = localStorage.getItem('current_user_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        return profile.displayName;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Optimistic Load
    const saved = localStorage.getItem('current_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('current_user_profile'));
  const [fetchingCount, setFetchingCount] = useState(0);
  const isFetching = fetchingCount > 0;
  const [session, setSession] = useState<any>(null);
  const isAppReady = React.useRef(false);
  const { showToast } = useToast();

  const hasActiveWorkoutSession = useCallback(() => {
    try {
      const sessionA = localStorage.getItem(`workout_session_${WorkoutType.A}`);
      const sessionB = localStorage.getItem(`workout_session_${WorkoutType.B}`);
      const sessionCustom = localStorage.getItem(`workout_session_${WorkoutType.CUSTOM}`);
      const now = Date.now();

      if (sessionA && (now - JSON.parse(sessionA).lastUpdated < SESSION_RESTORE_WINDOW)) return true;
      if (sessionB && (now - JSON.parse(sessionB).lastUpdated < SESSION_RESTORE_WINDOW)) return true;
      if (sessionCustom && (now - JSON.parse(sessionCustom).lastUpdated < SESSION_RESTORE_WINDOW)) return true;
    } catch (e) {
      console.error("Error checking sessions", e);
    }
    return false;
  }, []);

  const [view, setView] = useState<AppView>(() => {
    // 1. Check for active workout session (Highest Priority for Resuming)
    if (hasActiveWorkoutSession()) return 'workout';

    // 2. Check URL path
    const path = window.location.pathname;
    const initialView = PATH_TO_VIEW[path];
    if (initialView) {
      return initialView as AppView;
    }
    return 'dashboard';
  });

  const viewRef = React.useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>(() => {
    try {
      // 1. Check for active sessions first (Highest Priority for Resuming)
      const sessionA = localStorage.getItem(`workout_session_${WorkoutType.A}`);
      const sessionB = localStorage.getItem(`workout_session_${WorkoutType.B}`);
      const sessionCustom = localStorage.getItem(`workout_session_${WorkoutType.CUSTOM}`);

      let timestampA = 0;
      let timestampB = 0;
      let timestampCustom = 0;

      if (sessionA) timestampA = JSON.parse(sessionA).lastUpdated || 0;
      if (sessionB) timestampB = JSON.parse(sessionB).lastUpdated || 0;
      if (sessionCustom) timestampCustom = JSON.parse(sessionCustom).lastUpdated || 0;

      // If we have recent sessions, prioritize them
      const now = Date.now();

      // Find the most recent session among A, B, and Custom
      const timestamps = [
        { type: WorkoutType.A, ts: timestampA },
        { type: WorkoutType.B, ts: timestampB },
        { type: WorkoutType.CUSTOM, ts: timestampCustom }
      ].filter(t => t.ts > 0 && (now - t.ts < SESSION_RESTORE_WINDOW))
        .sort((a, b) => b.ts - a.ts);

      if (timestamps.length > 0) return timestamps[0].type;

      // 2. Check saved preference (Next Plan)
      const saved = localStorage.getItem('preferred_workout_type');
      if (saved === WorkoutType.A || saved === WorkoutType.B) {
        return saved as WorkoutType;
      }
    } catch (e) {
      console.error("Error reading session storage", e);
    }

    return WorkoutType.A;
  });
  const [logsCount, setLogsCount] = useState(0);
  const [mood, setMood] = useState<'fire' | 'tired' | 'normal'>('normal');
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [xpData, setXpData] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [streakRisk, setStreakRisk] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [pulseRefreshTrigger, setPulseRefreshTrigger] = useState(0);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalMode, setActivityModalMode] = useState<'fitness' | 'wellbeing'>('fitness');
  const [popupNotification, setPopupNotification] = useState<{ title: string, body: string } | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [selectedPulseUser, setSelectedPulseUser] = useState<string | null>(null);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [allGamificationState, setAllGamificationState] = useState<Record<string, import('./types').UserGamificationState> | null>(null);

  const [activeStatsPopup, setActiveStatsPopup] = useState<{ type: 'workouts' | 'streak' | 'weekly', isOpen: boolean, xpBreakdown?: Map<string, any> }>({ type: 'workouts', isOpen: false });
  const [allLogs, setAllLogs] = useState<any[]>([]); // Cache logs for popups
  const [quests, setQuests] = useState<any[]>([]);
  const [onboardingQuests, setOnboardingQuests] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [tribeMembers, setTribeMembers] = useState<string[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  // Default to empty plans, populate on load
  const [allUserPlans, setAllUserPlans] = useState<Record<string, Record<WorkoutType, WorkoutPlan>>>({});
  const [activeCustomPlan, setActiveCustomPlan] = useState<WorkoutPlan | null>(() => {
    try {
      const saved = localStorage.getItem('active_custom_plan');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (activeCustomPlan) {
      localStorage.setItem('active_custom_plan', JSON.stringify(activeCustomPlan));
    } else {
      localStorage.removeItem('active_custom_plan');
    }
  }, [activeCustomPlan]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const handleChildFetching = React.useCallback((fetching: boolean) => {
    setFetchingCount(prev => Math.max(0, prev + (fetching ? 1 : -1)));
  }, []);

  // Reset scroll and update URL on view change
  useEffect(() => {
    window.scrollTo(0, 0);

    const path = VIEW_PATHS[view];
    if (path && window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
  }, [view]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Priority 1: Prevent leaving workout view if session is active
      if (hasActiveWorkoutSession()) {
        setView('workout');
        return;
      }

      if (event.state && event.state.view) {
        setView(event.state.view as AppView);
      } else {
        const path = window.location.pathname;
        const newView = PATH_TO_VIEW[path];
        if (newView) {
          setView(newView as AppView);
        } else {
          setView('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [visitedViews, setVisitedViews] = useState<Set<string>>(new Set(['dashboard']));

  useEffect(() => {
    if (!visitedViews.has(view)) {
      setVisitedViews(prev => new Set(prev).add(view));
    }
  }, [view]);

  // Wizard State - Initialize based on session user
  const [wizardStep, setWizardStep] = useState(() => {
    // If user has email, extract name and skip to step 2 (profile details)
    if (session?.user?.email) {
      const emailName = session.user.email.split('@')[0];
      return emailName ? 2 : 1;
    }
    return 1;
  });
  const [setupName, setSetupName] = useState(() => {
    if (session?.user?.email) {
      const emailName = session.user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return '';
  });
  // Profile details
  const [setupHeight, setSetupHeight] = useState('');
  const [setupWeight, setSetupWeight] = useState('');
  const [setupGender, setSetupGender] = useState<'male' | 'female' | ''>('');
  const [setupDob, setSetupDob] = useState('');
  const [setupFitness, setSetupFitness] = useState<'beginner' | 'advanced'>('beginner');
  const [setupTribeName, setSetupTribeName] = useState('');
  const [setupTribeCode, setSetupTribeCode] = useState('');
  const [isCreatingTribe, setIsCreatingTribe] = useState(false);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor Online/Offline Sync
  useEffect(() => {
    const handleOnline = () => {
      showToast("Back online! Syncing data...", "success");
      import('./utils/storage').then(({ processOfflineQueue }) => {
        processOfflineQueue();
      });
    };
    const handleOffline = () => {
      showToast("You are offline. Changes will be saved locally.", "default");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      import('./utils/storage').then(({ processOfflineQueue }) => {
        processOfflineQueue();
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Background Preloading for Seamless Navigation
  const preloadedUserRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Only run if loaded, user exists, and we haven't preloaded for this user yet
    if (loading || !userProfile || preloadedUserRef.current === userProfile.displayName) {
      return;
    }

    const preloadAppResources = async () => {
      preloadedUserRef.current = userProfile.displayName;

      // Delay preloading to prioritize Main Thread for Homepage
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Starting background preloading...");

      // 1. Preload Component Bundles (Code Splitting)
      const preloadModules = [
        import('./components/SocialFeed'),
        import('./components/RewardsPage'),
        import('./components/Analytics'),
        import('./components/ProfilePage')
      ];

      // 2. Warm up Data Cache (In-Memory)
      const preloadData = [
        getLogs(),                 // For Analytics & Feed
        getAllReactions(),         // For Feed
        getGiftTransactions(),     // For Feed
        getGamificationState(),    // For Rewards
        getTeamStats(),            // For Tribe/Rewards
      ];

      try {
        await Promise.all([...preloadModules, ...preloadData]);
        console.log("Background preloading complete");

        // 3. (Optimization) Skipped mounting views to save Main Thread.
        // Data and Modules are already preloaded, so next render will be fast.
      } catch (e) {
        console.error("Preloading failed silently", e);
      }
    };

    preloadAppResources();
    // Initial Auth Check and Session Restoration
  }, [loading, userProfile]);

  const loadProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    else setFetchingCount(prev => prev + 1);
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        setUserProfile(profile);
        setCurrentUser(profile.displayName);
        // Load initial stats
        const logs = await getUserLogs(profile.displayName);
        setLogsCount(logs.filter(l => l.type !== WorkoutType.COMMITMENT).length);
        setAllLogs(logs); // Store for popups
        // Note: selectedWorkoutType is now handled by local storage preference/active session check

        // Load Mood & Weekly Progress
        const m = await getMood(profile.displayName, profile.tribeId);
        setMood(m);

        const stats = await getTeamStats();
        setTeamStats(stats);
        const myWeekly = stats.userStats[profile.displayName] || 0;
        setWeeklyProgress(myWeekly);

        // Load Theme & Gamification
        const gameState = await getGamificationState();
        setAllGamificationState(gameState);
        if (gameState && gameState[profile.displayName]) {
          const userState = gameState[profile.displayName];
          setActiveTheme(userState.activeTheme || 'default');
          const xpToUse = userState.lifetimeXp !== undefined ? userState.lifetimeXp : userState.points;
          setXpData(getLevelProgress(xpToUse));

          // Check commitment (Legacy logic removed, now using logs)
          // TribePulse handles the status display based on logs.
        }

        const s = await getStreaks(profile.displayName, profile.tribeId);
        setStreak(s);
        const risk = await getStreakRisk(profile.displayName, profile.tribeId);
        setStreakRisk(risk);

        // Load Quests
        setQuests(getDailyQuests(profile.displayName, profile));
        setOnboardingQuests(getOnboardingQuests(profile.displayName));

        // Load Tribe Members
        if (profile.tribeId) {
          const members = await getTribeMembers(profile.tribeId);
          setTribeMembers(members.map(m => m.displayName));
          const avatars: Record<string, string> = {};
          members.forEach(m => {
            avatars[m.displayName] = m.avatarId || 'male';
          });
          setAvatarMap(avatars);
        }

        // Load Dynamic Plans
        const savedPlans = await getUserPlans(profile.id);
        if (savedPlans) {
          console.log("Loaded dynamic plans for user");
          setAllUserPlans(prev => ({ ...prev, [profile.displayName]: savedPlans as any }));
        } else {
          console.log("Migrating static plans to DB");
          // Migration: Save default PLANS to DB
          await saveUserPlan(profile.id, STARTER_PLANS[profile.fitnessLevel || 'beginner']);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      if (!silent) setLoading(false);
      else setFetchingCount(prev => Math.max(0, prev - 1));
      setPulseRefreshTrigger((prev: number) => prev + 1);
      isAppReady.current = true;
    }
  };


  useEffect(() => {
    try {
      // Cleanup expired sessions on mount
      const now = Date.now();

      [WorkoutType.A, WorkoutType.B, WorkoutType.CUSTOM].forEach(type => {
        const key = `workout_session_${type}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const data = JSON.parse(saved);
          if (now - data.lastUpdated >= SESSION_RESTORE_WINDOW) {
            localStorage.removeItem(key);
            if (type === WorkoutType.CUSTOM) {
              localStorage.removeItem('active_custom_plan');
            }
          }
        }
      });
    } catch (e) {
      console.error("Error cleaning up sessions in useEffect", e);
    }
  }, []);


  useEffect(() => {
    // Check local storage for tutorial persistence
    const tutorialSeen = localStorage.getItem('tutorial_seen');
    if (!tutorialSeen) {
      // Show tutorial for new users (context: "Wake Up" page)
      setIsTutorialOpen(true);
    }

    if (!supabaseReady) {
      // MOCK FOR VERIFICATION / OFFLINE DEV
      console.log("Supabase keys missing. Using Mock Mode.");
      const mockUser = 'NewUser';
      const mockProfile: UserProfile = {
        id: 'mock-id',
        email: 'mock@test.com',
        displayName: mockUser,
        avatarId: 'male',
        tribeId: 'mock-tribe'
      };

      setSession({ user: { id: 'mock-id' } });
      setCurrentUser(mockUser);
      setUserProfile(mockProfile);

      const mockGameState = {
        [mockUser]: { points: 100, badges: [], inventory: [], lifetimeXp: 100, activeTheme: 'default', unlockedThemes: ['default'] }
      };
      const mockTeamStats = {
        totalXp: 5000,
        weeklyXp: 1200,
        userStats: { [mockUser]: 100 },
        teamStreak: 5,
        weeklyCount: 3,
        weeklyTarget: 10,
        monthlyCount: 10,
        yearlyCount: 50,
        monthlyTarget: 40,
        yearlyTarget: 500
      };
      const mockLogs = [
        { id: '1', date: new Date().toISOString(), type: 'A', user: mockUser, exercises: [], durationMinutes: 30 }
      ];

      // Seed localStorage for components that read from it directly - ONLY if empty
      if (!localStorage.getItem('cache_gamification_state')) localStorage.setItem('cache_gamification_state', JSON.stringify(mockGameState));
      if (!localStorage.getItem('cache_team_stats')) localStorage.setItem('cache_team_stats', JSON.stringify(mockTeamStats));
      if (!localStorage.getItem('fittribe_cache_gamification_all')) localStorage.setItem('fittribe_cache_gamification_all', JSON.stringify({ data: mockGameState, timestamp: Date.now() }));
      if (!localStorage.getItem('fittribe_cache_team_stats')) localStorage.setItem('fittribe_cache_team_stats', JSON.stringify({ data: mockTeamStats, timestamp: Date.now() }));
      if (!localStorage.getItem('fittribe_cache_logs_global')) localStorage.setItem('fittribe_cache_logs_global', JSON.stringify({ data: mockLogs, timestamp: Date.now() }));

      setAllGamificationState(mockGameState as any);
      setTeamStats(mockTeamStats);
      setAllLogs(mockLogs);
      setTribeMembers([mockUser]);
      setXpData({ level: 1, progress: 20 });
      setLoading(false);

      // Mock Quest Loading
      import('./utils/questUtils').then(({ getDailyQuests, getOnboardingQuests }) => {
        setQuests(getDailyQuests(mockUser, mockProfile));
        setOnboardingQuests(getOnboardingQuests(mockUser));
      });

      return;
    }

    // REAL SUPABASE AUTH
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile().then(() => {
          // Request permission only after profile is loaded and user ID is available
          requestNotificationPermission(session.user.id);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        // Handle explicit view transition on sign in
        // Use viewRef to avoid stale closure and check for active session
        if (event === 'SIGNED_IN') {
          if (hasActiveWorkoutSession()) {
            setView('workout');
          } else if (viewRef.current === 'landing') {
            setView('dashboard');
          }
        }

        // Silent update if token refreshed OR app is already loaded OR we have optimistic data
        const isSilent = event === 'TOKEN_REFRESHED' || isAppReady.current || !!userProfile;
        loadProfile(isSilent).then(() => {
          requestNotificationPermission(session.user.id);
        });
      } else {
        setLoading(false);
        setCurrentUser(null);
        setUserProfile(null);
      }
    });

    const unsubscribe = onMessageListener((payload: any) => {
      showToast(payload?.notification?.title || "New Message", "success");
      // Vibration pattern for attention
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      subscription.unsubscribe();
    };
  }, [supabaseReady]);

  // Wake Lock for Workout Mode (App Level Redundancy)
  useEffect(() => {
    let wakeLock: any = null;
    let isCancelled = false;

    const requestWakeLock = async () => {
      if (view === 'workout' && 'wakeLock' in navigator) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (isCancelled) {
            lock.release();
          } else {
            wakeLock = lock;
          }
        } catch (err) {
          console.error("Wake Lock error (App):", err);
        }
      } else if (view !== 'workout' && wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && view === 'workout') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      isCancelled = true;
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [view]);

  // Offline Status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    initSyncListener(); // Initialize sync listener

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => setIsSyncing(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-end', handleSyncEnd);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-end', handleSyncEnd);
    };
  }, []);

  useEffect(() => {
    // Check for URL params (Cold Start via Notification Click)
    const params = new URLSearchParams(window.location.search);
    if (params.get('notification_click') === 'true') {
      const title = params.get('title');
      const body = params.get('body');
      if (title && body) {
        setPopupNotification({ title, body });
        // Clean only notification params from URL without reloading
        params.delete('notification_click');
        params.delete('title');
        params.delete('body');
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
        window.history.replaceState({}, '', newUrl);
      }
    }

    // Listener for Service Worker messages (Notification Click when app is open/background)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { title, body } = event.data.payload;
        setPopupNotification({ title, body });
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Listen for Quest Updates
  useEffect(() => {
    const handleQuestUpdate = () => {
      if (currentUser) {
        setQuests(getDailyQuests(currentUser, userProfile));
        setOnboardingQuests(getOnboardingQuests(currentUser));
        // Refresh XP data if rewards were claimed
        if (userProfile) loadProfile(true);
      }
    };

    window.addEventListener('quest_update', handleQuestUpdate);
    return () => window.removeEventListener('quest_update', handleQuestUpdate);
  }, [currentUser, userProfile]);


  // Initialize Notifications
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userProfile);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        showToast("Account created! Please check your email to verify your account before logging in.", 'success');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast("Welcome back to the tribe!", "success");
        setView('dashboard');
      }
    } catch (error: any) {
      setAuthError(error.message || "Authentication failed. Check connection.");
    } finally {
      setAuthLoading(false);
    }
  };



  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('dashboard');
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda'; // Simple fallback
  };



  const getAvatarPathHelper = (avatarId: string | undefined, mood: 'fire' | 'tired' | 'normal') => {
    return getAvatarPath(avatarId, mood);
  };

  const handleCommit = async () => {
    if (!userProfile) return;
    setIsCommitting(true);

    // Create a commitment log
    const commitmentLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      user: currentUser,
      type: WorkoutType.COMMITMENT,
      exercises: [],
      durationMinutes: 0
    };

    await saveLog(commitmentLog as any, userProfile);
    await notifyTribeOnCommitment(currentUser as User, userProfile?.tribeId || '');

    showToast("You committed to workout! The tribe is watching.", "success");
    setIsCommitting(false);
    loadProfile(true); // Refresh to update TribePulse
  };

  const handleOpenStats = async (type: 'workouts' | 'streak' | 'weekly') => {
    // Refresh logs just in case
    if (currentUser) {
      import('./utils/gamification').then(async ({ getStreakLogs, calculateLogXPBreakdown }) => {
        let logsToUse: any[] = [];

        if (type === 'streak') {
          logsToUse = await getStreakLogs(currentUser, userProfile?.tribeId);
        } else {
          const logs = await getUserLogs(currentUser, userProfile?.tribeId);
          // Optimization: Use localeCompare for sorting ISO date strings
          logsToUse = logs.sort((a, b) => b.date.localeCompare(a.date));
        }

        const breakdown = calculateLogXPBreakdown(logsToUse);
        setAllLogs(logsToUse);
        setActiveStatsPopup({ type, isOpen: true, xpBreakdown: breakdown });
      });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!userProfile) return;
    await deleteLog(logId, userProfile);
    showToast("Log deleted", "success");
    loadProfile(true);
  };

  const lastWorkout = React.useMemo(() => allLogs.find(l => l.type !== WorkoutType.COMMITMENT), [allLogs]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // 1. Footer Pages (Public/Accessible always)
  if (view === 'about') return <AboutUs onBack={() => setView('dashboard')} />;
  if (view === 'privacy') return <PrivacyPolicy onBack={() => setView('dashboard')} />;
  if (view === 'terms') return <TermsOfService onBack={() => setView('dashboard')} />;
  if (view === 'contact') return <ContactUs onBack={() => setView('dashboard')} />;

  // Blog Pages (Public/Accessible always)
  const scrollToAuth = () => {
    setView('landing');
    setTimeout(() => {
      const authSection = document.querySelector('[data-auth-section]');
      if (authSection) {
        authSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (view === 'blog1') return <Blog1 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog2') return <Blog2 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog3') return <Blog3 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog4') return <Blog4 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog5') return <Blog5 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog6') return <Blog6 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog7') return <Blog7 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog8') return <Blog8 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog9') return <Blog9 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;
  if (view === 'blog10') return <Blog10 onNavigate={(v) => setView(v as any)} onScrollToAuth={scrollToAuth} />;

  // Landing Page (when user explicitly navigates to it or not logged in)
  if (view === 'landing' || (!session && !userProfile)) {
    return (
      <LandingPage
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        authLoading={authLoading}
        authError={authError}
        setAuthError={setAuthError}
        handleAuth={handleAuth}
        isSupabaseConfigured={supabaseReady}
        popupNotification={popupNotification}
        setPopupNotification={setPopupNotification}
        handleImgError={handleImgError}
        onNavigate={(newView) => setView(newView)}
        isLoggedIn={!!session}
      />
    );
  }

  // 2. Logged in but no Profile (Onboarding Wizard)
  if (!currentUser || !userProfile) {
    const handleWizardSubmit = async () => {
      // Step 1: Name
      if (wizardStep === 1 && !setupName.trim()) { showToast("Please enter a name", "error"); return; }
      if (wizardStep === 1) { setWizardStep(2); return; }

      // Step 2: Profile Details (optional - can skip)
      if (wizardStep === 2) { setWizardStep(3); return; }

      // Step 3: Fitness Level
      if (wizardStep === 3) { setWizardStep(4); return; }

      setAuthLoading(true);
      try {
        // Step 4: Tribe
        if (wizardStep === 4) {
          if (isCreatingTribe) {
            if (!setupTribeName.trim()) { showToast("Enter tribe name", "error"); return; }
            const tribe = await createTribe(setupTribeName, session.user.id);
            if (tribe) {
              await createProfile(
                session.user.id,
                session.user?.email || '',
                setupName,
                tribe.id,
                setupFitness,
                setupHeight ? parseInt(setupHeight) : undefined,
                setupWeight ? parseInt(setupWeight) : undefined,
                setupGender || undefined,
                setupDob || undefined
              );
              loadProfile();
            } else {
              showToast("Failed to create tribe", "error");
            }
          } else {
            if (!setupTribeCode.trim()) { showToast("Enter tribe code", "error"); return; }
            const tribe = await joinTribe(setupTribeCode);
            if (tribe) {
              await createProfile(
                session.user.id,
                session.user?.email || '',
                setupName,
                tribe.id,
                setupFitness,
                setupHeight ? parseInt(setupHeight) : undefined,
                setupWeight ? parseInt(setupWeight) : undefined,
                setupGender || undefined,
                setupDob || undefined
              );
              loadProfile();
            } else {
              showToast("Invalid Tribe Code or Error", "error");
            }
          }
        }
      } catch (e) {
        console.error(e);
        showToast("Error during setup", "error");
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#F0FDF4] flex flex-col items-center justify-center p-6">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <button onClick={handleLogout} className="absolute top-6 right-6 text-emerald-400 hover:text-emerald-600 font-bold text-sm flex items-center">
            <LogOut size={16} className="mr-1" /> Logout
          </button>
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-xl border-2 border-emerald-100">
          <div className="flex justify-between mb-6">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`h-2 rounded-full flex-1 mx-1 ${wizardStep >= step ? 'bg-emerald-500' : 'bg-emerald-100'}`}></div>
            ))}
          </div>

          <h2 className="text-3xl font-bold text-emerald-900 mb-6 font-['Fredoka'] text-center">
            {wizardStep === 1 && "What's your name?"}
            {wizardStep === 2 && "Tell us about yourself"}
            {wizardStep === 3 && "Select Fitness Level"}
            {wizardStep === 4 && "Find your pack"}
          </h2>

          <div className="space-y-6">
            {wizardStep === 1 && (
              <input
                type="text"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                placeholder="Enter your name"
                className="w-full text-center text-xl p-4 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 outline-none"
              />
            )}

            {wizardStep === 2 && (
              <>
                {setupName && (
                  <p className="text-center text-emerald-700 font-medium mb-4">
                    Welcome, {setupName}! Let's complete your profile.
                  </p>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1 font-medium">Height (cm)</label>
                      <input
                        type="number"
                        value={setupHeight}
                        onChange={e => setSetupHeight(e.target.value)}
                        placeholder="170"
                        className="w-full p-3 border-2 border-emerald-100 rounded-xl focus:border-emerald-500 outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1 font-medium">Weight (kg)</label>
                      <input
                        type="number"
                        value={setupWeight}
                        onChange={e => setSetupWeight(e.target.value)}
                        placeholder="70"
                        className="w-full p-3 border-2 border-emerald-100 rounded-xl focus:border-emerald-500 outline-none text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-2 font-medium">Gender</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSetupGender('male')}
                        className={`p-3 rounded-xl border-2 transition-all ${setupGender === 'male' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 hover:border-emerald-200'}`}
                      >
                        <div className="text-xl mb-1">👨</div>
                        <div className="text-sm font-medium">Male</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupGender('female')}
                        className={`p-3 rounded-xl border-2 transition-all ${setupGender === 'female' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 hover:border-emerald-200'}`}
                      >
                        <div className="text-xl mb-1">👩</div>
                        <div className="text-sm font-medium">Female</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Date of Birth</label>
                    <input
                      type="date"
                      value={setupDob}
                      onChange={e => setSetupDob(e.target.value)}
                      className="w-full p-3 border-2 border-emerald-100 rounded-xl focus:border-emerald-500 outline-none text-center"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <p className="text-xs text-center text-slate-400 mt-2">
                    These details help us calculate accurate calories burned. You can skip this step.
                  </p>
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSetupFitness('beginner')}
                    className={`p-6 rounded-2xl border-2 transition-all ${setupFitness === 'beginner' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                  >
                    <div className="text-3xl mb-2">🌱</div>
                    <div className="font-bold text-emerald-900">Beginner</div>
                    <div className="text-xs text-slate-500 mt-1">Starting my journey</div>
                  </button>
                  <button
                    onClick={() => setSetupFitness('advanced')}
                    className={`p-6 rounded-2xl border-2 transition-all ${setupFitness === 'advanced' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                  >
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="font-bold text-emerald-900">Advanced</div>
                    <div className="text-xs text-slate-500 mt-1">Pushing limits</div>
                  </button>
                </div>
              </>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                  <button onClick={() => setIsCreatingTribe(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isCreatingTribe ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Create Tribe</button>
                  <button onClick={() => setIsCreatingTribe(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isCreatingTribe ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Join Tribe</button>
                </div>

                {isCreatingTribe ? (
                  <input
                    type="text"
                    value={setupTribeName}
                    onChange={e => setSetupTribeName(e.target.value)}
                    placeholder="Tribe Name (e.g. Jungle Gym)"
                    className="w-full p-4 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={setupTribeCode}
                    onChange={e => setSetupTribeCode(e.target.value)}
                    placeholder="Enter 6-char Code"
                    className="w-full p-4 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 outline-none uppercase tracking-widest text-center font-mono"
                    maxLength={6}
                  />
                )}
              </div>
            )}

            <button
              onClick={handleWizardSubmit}
              disabled={authLoading}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:brightness-110 active:scale-95 transition-all text-lg"
            >
              {authLoading ? <LoadingSpinner /> : (wizardStep === 4 ? (isCreatingTribe ? 'Create & Start' : 'Join & Start') : 'Next')}
            </button>

            {wizardStep > 1 && (
              <button onClick={() => setWizardStep(prev => prev - 1)} className="w-full text-slate-400 text-sm font-bold hover:text-slate-600">Back</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Main App
  // 3. Main App
  const currentPlan = activeCustomPlan || allUserPlans[currentUser]?.[selectedWorkoutType] || STARTER_PLANS[userProfile.fitnessLevel || 'beginner'][selectedWorkoutType];

  const themeObj = SHOP_THEMES.find(t => t.id === activeTheme);
  const headerStyle = themeObj
    ? (themeObj.type === 'image' ? { backgroundImage: `url('${themeObj.value}')` } : { backgroundColor: themeObj.value.replace('bg-', '#') })
    : { backgroundImage: "url('/assets/forest_header_bg.webp')" };

  const headerClass = `mx-4 mt-2 shadow-2xl shadow-emerald-900/20 border border-white/20 rounded-[32px] relative overflow-hidden bg-cover bg-center transition-all duration-500`;

  if (view === 'workout') {
    return (
      <React.Suspense fallback={<LoadingSpinner fullScreen />}>
        <WorkoutSession
          key={`${currentUser}-${currentPlan.id}`}
          user={currentUser}
          userProfile={userProfile}
          plan={currentPlan}
          onFinish={(photo) => {
            loadProfile(true); // Refresh logs/stats

            if (activeCustomPlan) {
              if (currentUser && userProfile?.tribeId) {
                notifyTribeOnActivity(currentUser, activeCustomPlan.title || 'workout', userProfile.tribeId, photo);
              }
              // Clear custom plan and return to dashboard/rewards without changing A/B cycle
              setActiveCustomPlan(null);
            } else {
              if (currentUser && userProfile?.tribeId) {
                notifyTribeOnActivity(currentUser, 'workout', userProfile.tribeId, photo);
              }

              // Update Next Workout Type Logic
              if (currentPlan.id === WorkoutType.A) {
                localStorage.setItem('next_workout_type', WorkoutType.B);
              } else if (currentPlan.id === WorkoutType.B) {
                localStorage.setItem('next_workout_type', WorkoutType.A);
              }
            }

            setView('rewards');

            // Update state after view change to avoid flashing the warmup page
            if (!activeCustomPlan) {
              if (currentPlan.id === WorkoutType.A) {
                setSelectedWorkoutType(WorkoutType.B);
              } else if (currentPlan.id === WorkoutType.B) {
                setSelectedWorkoutType(WorkoutType.A);
              }
            }
          }}
          onCancel={() => {
            setActiveCustomPlan(null);
            setView('dashboard');
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-0 font-sans bg-[#F0FDF4] selection:bg-emerald-200 selection:text-emerald-900">

      {/* Header */}
      <div
        className={headerClass}
        style={(!themeObj || themeObj.type === 'image') ? headerStyle : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-emerald-900/40 backdrop-blur-[2px]"></div>
        <div className="p-5 relative z-10 w-full">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center">
              <div
                onClick={() => setView('profile')}
                className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mr-4 border-2 border-white/50 shadow-lg backdrop-blur-md overflow-hidden relative group cursor-pointer"
              >
                <img src={getAvatarPath(userProfile?.avatarId, mood)} onError={handleImgError} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                {mood === 'fire' && <div className="absolute -top-1 -right-1 text-xl animate-bounce drop-shadow-md">🔥</div>}
                {mood === 'tired' && <div className="absolute -top-1 -right-1 text-xl animate-pulse drop-shadow-md">💤</div>}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg font-['Fredoka'] tracking-wide">Hi, {currentUser}!</h1>
                <div className="flex items-center space-x-2 mt-1">
                  {xpData && (
                    <div className="flex flex-col">
                      <div className="flex items-center text-xs text-white/90 font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                        <span className="mr-2 text-lime-300">Lvl {xpData.level}</span>
                        <div className="w-16 h-2 bg-black/30 rounded-full overflow-hidden">
                          <div className="h-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]" style={{ width: `${xpData.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:block flex-1 flex justify-center max-w-2xl px-4">
              <DesktopNavigation view={view} setView={setView} />
            </div>

            <div className="flex items-center gap-3">
              {isFetching && (
                <div className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-sm animate-fade-in">
                  <Loader2 size={20} className="text-emerald-100 animate-spin" />
                </div>
              )}

              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onNotificationClick={(n) => setPopupNotification({ title: 'Notification', body: n.message })}
              />
            </div>
          </div>
        </div>
      </div>

      {
        isOffline && (
          <div className="mx-6 mt-2 bg-amber-500/90 backdrop-blur-sm text-white text-center py-2 rounded-xl text-xs font-bold animate-pulse flex items-center justify-center shadow-lg">
            <WifiOff size={14} className="mr-2" /> You are offline. Changes will be saved locally.
          </div>
        )
      }

      {
        isSyncing && (
          <div className="mx-6 mt-2 bg-blue-500/90 backdrop-blur-sm text-white text-center py-2 rounded-xl text-xs font-bold flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Syncing data...
          </div>
        )
      }

      {/* Main Content Grid Wrapper */}
      <div className="md:max-w-7xl md:mx-auto md:grid md:grid-cols-12 md:gap-8 md:px-6 md:mt-6 transition-all relative z-0">

        {/* Left Column: Main Views */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">

          {/* Tribe Pulse Widget - Mobile Only (at top of dashboard) */}
          <div className="md:hidden">
            {
              view !== 'workout' && !isOffline && currentUser && (
                <div style={{ display: view === 'dashboard' ? 'block' : 'none' }}>
                  <TribePulse
                    currentUser={currentUser}
                    members={tribeMembers}
                    avatarMap={avatarMap}
                    refreshTrigger={pulseRefreshTrigger}
                    onUserClick={setSelectedPulseUser}
                  />
                </div>
              )
            }
          </div>


          {selectedPulseUser && allGamificationState && (
            <React.Suspense fallback={null}>
              <UserProfilePopup
                isOpen={!!selectedPulseUser}
                onClose={() => setSelectedPulseUser(null)}
                user={selectedPulseUser}
                gamificationState={allGamificationState[selectedPulseUser]}
              />
            </React.Suspense>
          )}

          <div style={{ display: view === 'dashboard' ? 'block' : 'none' }}>
            <div className="p-4 max-w-xl mx-auto md:max-w-none md:mx-0 space-y-5 animate-fade-in md:grid md:grid-cols-2 md:gap-6 md:space-y-0">

              <div className="relative md:col-span-2">
                <button
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="absolute top-4 right-4 z-20 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-xl transition-colors active:scale-95 shadow-sm md:hidden"
                >
                  <Plus size={20} />
                </button>
                <div className="md:hidden">
                  <QuestBoard
                    quests={quests}
                    onboardingQuests={onboardingQuests}
                    loading={loading}
                    hasLoggedWorkouts={allLogs.length > 0}
                    onManualComplete={async (qid) => {
                      if (currentUser && userProfile) {
                        const res = await completeManualQuest(currentUser, userProfile, qid);
                        if (res && (res.earnedPoints > 0 || res.earnedXp > 0)) {
                          showToast(`Quest Complete! +${res.earnedPoints} Pts, +${res.earnedXp} XP`, 'success');
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {streak > 0 && streakRisk && (
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-4 rounded-xl flex items-center shadow-lg animate-pulse md:col-span-2">
                  <Flame size={24} className="text-amber-500 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-bold font-['Fredoka']">Streak at Risk!</div>
                    <div className="text-xs font-bold opacity-80">Workout soon to keep your {streak} day streak alive!</div>
                  </div>
                </div>
              )}

              {/* Dashboard Action Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Streak Card */}
                <button
                  onClick={() => handleOpenStats('streak')}
                  className="bg-white p-3 rounded-[24px] shadow-lg shadow-amber-100/50 border border-amber-50 flex flex-col justify-between group hover:shadow-xl transition-all active:scale-95 h-32 relative overflow-hidden text-left"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame size={48} className="text-amber-500" />
                  </div>

                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Flame size={20} className="fill-current" />
                  </div>

                  <div className="text-left z-10">
                    <div className="text-amber-900 font-bold text-sm leading-tight flex items-center">
                      Daily Streak
                      <InfoTooltip text="Consecutive days with workouts. Keep the fire burning!" color="text-amber-400" />
                    </div>
                    <div className="text-amber-600 text-lg font-bold font-['Fredoka'] flex items-center mt-0.5">
                      {streak} {streak === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                </button>

                {/* Recent Activity Widget - Compact */}
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  disabled={!lastWorkout}
                  className={`bg-white p-3 rounded-[24px] shadow-lg border flex flex-col justify-between group transition-all h-32 relative overflow-hidden text-left ${lastWorkout ? 'shadow-emerald-100/50 border-emerald-50 hover:shadow-xl active:scale-95' : 'border-slate-100 opacity-60 cursor-default'}`}
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <History size={48} className={lastWorkout ? "text-emerald-900" : "text-slate-400"} />
                  </div>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${!lastWorkout ? 'bg-slate-100 text-slate-400' : lastWorkout.type === WorkoutType.CUSTOM ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'}`}>
                    {!lastWorkout ? <History size={20} /> : lastWorkout.type === WorkoutType.CUSTOM ? <Activity size={20} /> : <Dumbbell size={20} />}
                  </div>

                  <div className="text-left z-10">
                    <div className={`font-bold text-sm leading-tight line-clamp-1 ${!lastWorkout ? 'text-slate-400' : 'text-emerald-900'}`}>
                      {!lastWorkout ? 'No Recent Activity' : (lastWorkout.type === WorkoutType.CUSTOM ? lastWorkout.customActivity : `Plan ${lastWorkout.type}`)}
                    </div>
                    {lastWorkout && (
                      <div className="text-emerald-500 text-[10px] font-bold flex items-center mt-0.5">
                        <Clock size={10} className="mr-1" />
                        {formatDistanceToNow(new Date(lastWorkout.date), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </button>

                {/* Fitness Track Button - Compact */}
                <button
                  onClick={() => { setActivityModalMode('fitness'); setIsActivityModalOpen(true); }}
                  className="bg-white p-3 rounded-[24px] shadow-lg shadow-emerald-100/50 border border-emerald-50 flex flex-col justify-between group hover:shadow-xl transition-all active:scale-95 h-32 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame size={48} className="text-orange-500" />
                  </div>

                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform">
                    <Flame size={20} className="fill-current" />
                  </div>
                  <div className="text-left z-10">
                    <div className="text-emerald-900 font-bold text-sm leading-tight">Log Fitness Activities</div>
                    <div className="text-emerald-500 text-[10px] font-bold">Sports, Cardio...</div>
                  </div>
                </button>

                {/* Wellbeing Track Button - Compact */}
                <button
                  onClick={() => { setActivityModalMode('wellbeing'); setIsActivityModalOpen(true); }}
                  className="bg-white p-3 rounded-[24px] shadow-lg shadow-pink-100/50 border border-pink-50 flex flex-col justify-between group hover:shadow-xl transition-all active:scale-95 h-32 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Heart size={48} className="text-pink-500" />
                  </div>

                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                    <Heart size={20} className="fill-current" />
                  </div>
                  <div className="text-left z-10">
                    <div className="text-pink-900 font-bold text-sm leading-tight">Log Wellbeing Activities</div>
                    <div className="text-pink-500 text-[10px] font-bold">Cooking, Music...</div>
                  </div>
                </button>
              </div>

              <React.Suspense fallback={null}>
                <ActivityTrackerModal
                  isOpen={isActivityModalOpen}
                  onClose={() => setIsActivityModalOpen(false)}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  mode={activityModalMode}
                  onSave={async (log, photo) => {
                    // Save log: Check for existing commitment to replace
                    if (!userProfile) return;

                    const allUserLogs = await getUserLogs(currentUser);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const commitLog = allUserLogs.find(l => {
                      const d = new Date(l.date);
                      d.setHours(0, 0, 0, 0);
                      return l.type === 'COMMITMENT' && d.getTime() === today.getTime();
                    });

                    if (commitLog) {
                      log.id = commitLog.id; // Reuse ID
                      await updateLog(log, userProfile);
                    } else {
                      await saveLog(log, userProfile);
                    }

                    // Update Next Workout Type Logic
                    if (log.type === WorkoutType.A) {
                      localStorage.setItem('next_workout_type', WorkoutType.B);
                      setSelectedWorkoutType(WorkoutType.B);
                    } else if (log.type === WorkoutType.B) {
                      localStorage.setItem('next_workout_type', WorkoutType.A);
                      setSelectedWorkoutType(WorkoutType.A);
                    } // Custom workouts do NOT change the cycle

                    // Check achievements
                    const badges = await checkAchievements(log, userProfile);
                    if (badges.length > 0) {
                      showToast(`🏆 Unlocked: ${badges.map(b => b.title).join(', ')}`, 'success');
                    } else {
                      const xpEarned = log.vibes ? Math.min(Math.floor(log.vibes), 60) : Math.floor((log.calories || 0) / 10);
                      showToast(`Activity Saved! +${xpEarned} XP`, 'success');
                    }

                    if (currentUser && userProfile) {
                      if (userProfile.tribeId) {
                        await notifyTribeOnActivity(currentUser, log.customActivity || 'workout', userProfile.tribeId, photo);
                      }

                      // Also update quest progress for the newly logged activity
                      import('./utils/questUtils').then(({ updateQuestProgress }) => {
                        updateQuestProgress(currentUser, userProfile, 'workout', 1);
                      });
                    }

                    loadProfile(true);
                  }}
                />
              </React.Suspense>

              {/* Weekly Stats Widget */}
              <div>
                <WeeklyStatsWidget
                  logs={allLogs}
                  userProfile={userProfile}
                  weeklyProgress={weeklyProgress}
                  onClick={() => handleOpenStats('weekly')}
                />
              </div>

              {/* Next Workout Card */}
              <div className="bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] rounded-[32px] p-6 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden border-[4px] border-emerald-50/20 group cursor-default md:col-span-2">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('/assets/jungle_bg_pattern.webp')] opacity-[0.07] group-hover:opacity-10 transition-opacity"></div>

                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="bg-emerald-900/40 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border border-white/10 text-emerald-100 uppercase tracking-wider">Next Mission</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsLibraryOpen(true)}
                        className="text-[10px] font-bold text-emerald-100 hover:text-white transition-all flex items-center bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/5 active:scale-95"
                      >
                        Library <Sparkles size={12} className="ml-1.5" />
                      </button>
                      <button
                        onClick={() => {
                          const next = selectedWorkoutType === WorkoutType.A ? WorkoutType.B : WorkoutType.A;
                          setSelectedWorkoutType(next);
                          localStorage.setItem('next_workout_type', next); // Manual override persists
                        }}
                        className="text-[10px] font-bold text-emerald-100 hover:text-white transition-all flex items-center bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/5 active:scale-95"
                      >
                        Switch <TrendingUp size={12} className="ml-1.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-4xl font-bold mb-1 tracking-tight font-['Fredoka'] text-white drop-shadow-md">Plan {selectedWorkoutType}</h2>
                    <p className="text-emerald-100 text-sm font-medium opacity-90">{currentPlan.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center bg-black/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/5">
                      <div className="bg-lime-400/20 p-1.5 rounded-lg mr-2.5 text-lime-300"><TrendingUp size={16} /></div>
                      <span className="text-xs font-bold text-white flex-1 leading-tight">{currentPlan.focus}</span>
                    </div>
                    <div className="flex items-center bg-black/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/5">
                      <div className="bg-lime-400/20 p-1.5 rounded-lg mr-2.5 text-lime-300"><Activity size={16} /></div>
                      <span className="text-xs font-bold text-white leading-tight">{currentPlan.exercises.length} Exercises</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setView('workout')}
                    className="w-full bg-gradient-to-r from-lime-400 to-lime-500 text-emerald-950 py-3.5 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10 flex items-center">Start Adventure <ArrowRight size={18} className="ml-2" /></span>
                  </button>

                  <button
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="w-full mt-2.5 bg-emerald-900/30 text-emerald-100 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-900/50 transition-all flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-[0.98]"
                  >
                    {isCommitting ? 'Committing...' : '✋ I Commit to Workout Today'}
                  </button>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="mt-6 text-center px-4 opacity-80 hover:opacity-100 transition-opacity duration-700 md:col-span-2">
                <p className="text-emerald-800 text-sm font-bold leading-relaxed font-sans">"{randomQuote}"</p>
              </div>

            </div>
          </div>
          <div style={{ display: view === 'analytics' ? 'block' : 'none' }}>
            <React.Suspense fallback={<LoadingSpinner />}>
              {visitedViews.has('analytics') && <Analytics user={currentUser} userProfile={userProfile} isVisible={view === 'analytics'} onFetching={handleChildFetching} />}
            </React.Suspense>
          </div>
          <div style={{ display: view === 'rewards' ? 'block' : 'none' }}>
            <React.Suspense fallback={<LoadingSpinner />}>
              {visitedViews.has('rewards') && <RewardsPage currentUser={currentUser} profile={userProfile} isVisible={view === 'rewards'} onFetching={handleChildFetching} />}
            </React.Suspense>
          </div>
          <div style={{ display: view === 'social' ? 'block' : 'none' }}>
            <React.Suspense fallback={<LoadingSpinner />}>
              {visitedViews.has('social') && <SocialFeed currentUser={currentUser} profile={userProfile} isVisible={view === 'social'} onFetching={handleChildFetching} />}
            </React.Suspense>
          </div>

          <div style={{ display: view === 'coach' ? 'block' : 'none' }}>
            <React.Suspense fallback={<LoadingSpinner />}>
              {visitedViews.has('coach') && userProfile && <CoachView userProfile={userProfile} lastWorkout={lastWorkout} onFetching={handleChildFetching} />}
            </React.Suspense>
          </div>


          <div style={{ display: view === 'profile' ? 'block' : 'none' }}>
            <React.Suspense fallback={<LoadingSpinner />}>
              {visitedViews.has('profile') && userProfile && (
                <ProfilePage
                  userProfile={userProfile}
                  onSave={async (updated) => {
                    setUserProfile(updated);
                    await updateProfile(updated);
                    showToast("Profile updated!", "success");
                  }}
                  onLogout={handleLogout}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                />
              )}
            </React.Suspense>
          </div>

        </div> {/* End of Left Column */}

        {/* Right Column: Desktop Sidebar */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-6 pointer-events-none md:pointer-events-auto">
          <div className="sticky top-6 space-y-6">
            {/* Desktop Tribe Pulse */}
            {!isOffline && currentUser && (
              <TribePulse
                currentUser={currentUser}
                members={tribeMembers}
                avatarMap={avatarMap}
                refreshTrigger={pulseRefreshTrigger}
                onUserClick={setSelectedPulseUser}
              />
            )}


            {/* Desktop Quest Board (Always Visible) */}
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-emerald-900 font-['Fredoka']">Quests</h3>
              <button
                onClick={() => setIsChallengeModalOpen(true)}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-95 shadow-sm flex items-center"
              >
                <Plus size={14} className="mr-1" /> New Challenge
              </button>
            </div>

            <QuestBoard
              quests={quests}
              onboardingQuests={onboardingQuests}
              loading={loading}
              hasLoggedWorkouts={allLogs.length > 0}
              onManualComplete={async (qid) => {
                if (currentUser && userProfile) {
                  const res = await completeManualQuest(currentUser, userProfile, qid);
                  if (res && (res.earnedPoints > 0 || res.earnedXp > 0)) {
                    showToast(`Quest Complete! +${res.earnedPoints} Pts, +${res.earnedXp} XP`, 'success');
                  }
                }
              }}
            />

            {/* View Specific Widgets */}
            {view === 'social' && allGamificationState && (
              <Leaderboard
                logs={allLogs.filter(l => l.type !== WorkoutType.COMMITMENT)}
                gamificationState={allGamificationState}
                members={tribeMembers}
                avatarMap={avatarMap}
                onUserClick={setSelectedPulseUser}
              />
            )}

            {view === 'analytics' && (
              <Calendar logs={allLogs} />
            )}

            {view === 'rewards' && teamStats && (
              <TribeStatusCard teamStats={teamStats} />
            )}

            {/* Daily Wisdom Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 shadow-lg border border-emerald-100">
              <h3 className="font-bold text-emerald-900 mb-2 font-['Fredoka'] flex items-center"><Sparkles size={16} className="mr-2 text-emerald-500" /> Daily Wisdom</h3>
              <p className="text-emerald-700 text-sm font-medium italic leading-relaxed">"{randomQuote}"</p>
            </div>

            {/* Desktop Copyright/Footer */}
            <div className="text-center text-emerald-900/40 text-xs font-bold font-['Fredoka'] mt-4">
              FitTribe v1.0 • Built with ❤️
            </div>
          </div>
        </div>

      </div> {/* End of Main Grid */}

      {/* Floating Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-950/50 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 rounded-[32px] flex justify-between px-6 py-3 z-50 w-[90%] max-w-sm md:hidden">
        <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={Dumbbell} label="Home" />
        <NavButton active={view === 'social'} onClick={() => setView('social')} icon={Users} label="Tribe" />
        <NavButton active={view === 'rewards'} onClick={() => setView('rewards')} icon={Trophy} label="Loot" />
        <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} icon={BarChart3} label="Stats" />
        <NavButton active={view === 'coach'} onClick={() => setView('coach')} icon={Sparkles} label="Coach" />
      </div>
      <ReloadPrompt />

      {popupNotification && (
        <NotificationPopup
          isOpen={!!popupNotification}
          onClose={() => setPopupNotification(null)}
          title={popupNotification.title}
          body={popupNotification.body}
        />
      )}

      <StatsDetailPopup
        isOpen={activeStatsPopup.isOpen}
        onClose={() => setActiveStatsPopup(prev => ({ ...prev, isOpen: false }))}
        type={activeStatsPopup.type}
        logs={allLogs}
        xpBreakdown={activeStatsPopup.xpBreakdown}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={allLogs}
        onDelete={handleDeleteLog}
      />

      <CreateChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onSave={async (challenge) => {
          if (userProfile) {
            // Check if one of this type already exists, if so replace it
            const existing = userProfile.customChallenges || [];
            const otherTypes = existing.filter(c => c.type !== challenge.type);
            const updatedChallenges = [...otherTypes, challenge];

            const updated = { ...userProfile, customChallenges: updatedChallenges };
            setUserProfile(updated);
            await updateProfile(updated);
            setQuests(getDailyQuests(userProfile.displayName, updated));
            showToast(`${challenge.type} Challenge Created!`, "success");
          }
        }}
      />

      <WorkoutLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        onStartTemplate={(template) => {
          const plan: WorkoutPlan = {
            id: WorkoutType.CUSTOM,
            title: template.name,
            focus: 'Custom Template',
            warmup: ['Arm Circles', 'Jumping Jacks', 'Torso Twists'],
            cooldown: ['Static Stretch', 'Deep Breathing'],
            exercises: template.exercises.map(ex => ({
              id: ex.name,
              name: ex.name,
              sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight: 0, completed: false })), // Initial state
              defaultSets: ex.sets,
              defaultReps: ex.reps,
              notes: '',
              isSuperset: false
            }))
          };
          setActiveCustomPlan(plan);
          setIsLibraryOpen(false);
          setView('workout');
        }}
      />

      {isTutorialOpen && <TutorialPage onClose={() => {
        setIsTutorialOpen(false);
        localStorage.setItem('tutorial_seen', 'true');
      }} />}
    </div >
  );
};



export default App;
