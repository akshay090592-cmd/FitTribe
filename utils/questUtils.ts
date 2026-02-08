import { Quest, QuestType, User, UserProfile, CustomChallenge, WorkoutType } from '../types';
import { getGamificationState, saveGamificationState, updateProfile, saveLog, addXPLog, addPointLog } from './storage';
import { notifyTribeOnActivity } from '../services/notificationService';

// --- TEMPLATES ---
const ONBOARDING_TEMPLATES: Omit<Quest, 'id' | 'progress' | 'completed'>[] = [
  {
    templateId: 'onboarding_workout',
    title: 'First Blood',
    description: 'Log your first workout or activity.',
    type: 'workout',
    target: 1,
    rewardPoints: 50,
    rewardXp: 100,
    icon: 'Dumbbell'
  },
  {
    templateId: 'onboarding_profile',
    title: 'Identity',
    description: 'Update your profile (height/weight).',
    type: 'manual',
    target: 1,
    rewardPoints: 20,
    rewardXp: 50,
    icon: 'User'
  },
  {
    templateId: 'onboarding_social',
    title: 'Tribe Vibe',
    description: 'Visit the Tribe Feed.',
    type: 'manual',
    target: 1,
    rewardPoints: 20,
    rewardXp: 50,
    icon: 'Users'
  }
];

const QUEST_TEMPLATES: Omit<Quest, 'id' | 'progress' | 'completed'>[] = [
  {
    templateId: 'log_workout',
    title: 'Jungle Gym',
    description: 'Log any workout or activity today.',
    type: 'workout',
    target: 1,
    rewardPoints: 10,
    rewardXp: 50,
    icon: 'Dumbbell'
  },
  {
    templateId: 'social_react',
    title: 'Tribe Support',
    description: 'React to 3 updates from your tribe.',
    type: 'social_reaction',
    target: 3,
    rewardPoints: 5,
    rewardXp: 20,
    icon: 'Heart'
  },
  {
    templateId: 'social_gift',
    title: 'Generous Panda',
    description: 'Send a gift to a tribe member.',
    type: 'social_gift',
    target: 1,
    rewardPoints: 15,
    rewardXp: 30,
    icon: 'Gift'
  },
  {
    templateId: 'drink_water',
    title: 'Hydration Station',
    description: 'Drink 2L of water today.',
    type: 'manual',
    target: 1,
    rewardPoints: 5,
    rewardXp: 10,
    icon: 'GlassWater'
  },
  {
    templateId: 'eat_fruit',
    title: 'Nature\'s Candy',
    description: 'Eat a piece of fruit.',
    type: 'manual',
    target: 1,
    rewardPoints: 5,
    rewardXp: 10,
    icon: 'Apple'
  },
  {
    templateId: 'stretch',
    title: 'Flexible Bamboo',
    description: 'Do a 5-minute stretch.',
    type: 'manual',
    target: 1,
    rewardPoints: 5,
    rewardXp: 15,
    icon: 'Activity'
  },
  {
    templateId: 'walk',
    title: 'Morning Paws',
    description: 'Go for a 15-minute walk.',
    type: 'manual', // Can be logged as 'workout' type too, but let's keep it simple or manual check
    target: 1,
    rewardPoints: 10,
    rewardXp: 30,
    icon: 'Footprints'
  },
  {
    templateId: 'sleep',
    title: 'Hibernation',
    description: 'Get 7+ hours of sleep.',
    type: 'manual',
    target: 1,
    rewardPoints: 10,
    rewardXp: 20,
    icon: 'Moon'
  }
];

// --- UTILS ---

const getStorageKey = (user: string) => `daily_quests_${user}_${new Date().toDateString()}`;
const getOnboardingKey = (user: string) => `onboarding_quests_${user}`;

const getCustomChallengeQuest = (cc: CustomChallenge): Quest => {
  let rewardXp = 10;
  if (cc.type === 'weekly') rewardXp = 50;
  if (cc.type === 'monthly') rewardXp = 300;

  // Description Logic
  let desc = "";
  if (cc.type === 'daily') {
    desc = "Daily Challenge";
  } else {
    // Show progress in description "1/3 days"
    desc = `${cc.type} Challenge: ${cc.progress}/${cc.target} ${cc.unit || 'times'}`;
  }

  return {
    id: `custom_${cc.id}`,
    templateId: 'custom',
    title: cc.title,
    description: desc,
    type: 'manual', // Treated as manual for incrementing
    target: cc.target,
    progress: cc.progress,
    completed: cc.completed,
    rewardPoints: 0,
    rewardXp: rewardXp,
    icon: 'Lock' // Distinct icon
  };
};

export const getDailyQuests = (user: User, profile?: UserProfile | null): Quest[] => {
  const key = getStorageKey(user);
  const stored = localStorage.getItem(key);
  let quests: Quest[] = [];

  if (stored) {
    quests = JSON.parse(stored);
  } else {
    // Generate new quests
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    quests = selected.map(template => ({
      ...template,
      id: crypto.randomUUID(),
      progress: 0,
      completed: false
    }));

    localStorage.setItem(key, JSON.stringify(quests));
  }

  // Inject Custom Challenges if exist
  if (profile?.customChallenges && profile.customChallenges.length > 0) {
    const now = new Date();

    // Sort by type priority (Daily, Weekly, Monthly) or just creation
    const activeChallenges = profile.customChallenges.filter(cc => {
      const end = new Date(cc.endDate);
      // Show if not expired OR if completed recently?
      // For now show if not expired.
      return now <= end;
    });

    const customQuests = activeChallenges.map(cc => getCustomChallengeQuest(cc));

    // Remove any stale custom quests from base list (if any leaked in)
    quests = quests.filter(q => !q.id.startsWith('custom_'));

    // Prepend custom quests
    quests.unshift(...customQuests);
  }

  return quests;
};

export const getOnboardingQuests = (user: User): Quest[] => {
  const key = getOnboardingKey(user);
  const stored = localStorage.getItem(key);

  if (stored) {
    return JSON.parse(stored);
  }

  // Initialize
  const initialQuests = ONBOARDING_TEMPLATES.map(t => ({
    ...t,
    id: t.templateId, // Stable ID
    progress: 0,
    completed: false
  }));

  localStorage.setItem(key, JSON.stringify(initialQuests));
  return initialQuests;
};

export const updateOnboardingQuestProgress = async (
  user: User,
  profile: UserProfile,
  type: QuestType,
  amount: number = 1,
  questId?: string
) => {
  const currentQuests = getOnboardingQuests(user);
  let updated = false;
  let earnedPoints = 0;
  let earnedXp = 0;

  const newQuests = currentQuests.map(q => {
    // If questId is specific (e.g. manual click), only update if match
    // If questId is undefined (generic action like 'workout'), update all matching types
    const matchesId = questId ? q.id === questId : true;
    const matchesType = q.type === type;

    if (matchesType && matchesId && !q.completed) {
      const newProgress = Math.min(q.progress + amount, q.target);
      if (newProgress !== q.progress) {
        updated = true;
        const isNowComplete = newProgress >= q.target;
        if (isNowComplete) {
          earnedPoints += q.rewardPoints;
          earnedXp += q.rewardXp;
        }
        return { ...q, progress: newProgress, completed: isNowComplete };
      }
    }
    return q;
  });

  if (updated) {
    const key = getOnboardingKey(user);
    localStorage.setItem(key, JSON.stringify(newQuests));

    if (earnedPoints > 0 || earnedXp > 0) {
      const allState = await getGamificationState();
      const userState = allState[user] || {
        badges: [],
        inventory: [],
        points: 0,
        lifetimeXp: 0,
        unlockedThemes: [],
        activeTheme: 'default'
      };

      userState.points = (userState.points || 0) + earnedPoints;
      userState.lifetimeXp = (userState.lifetimeXp || 0) + earnedXp;

      // Log Onboarding Quest Rewards
      if (earnedXp > 0) await addXPLog(profile.id, earnedXp, 'quest', 'onboarding');
      if (earnedPoints > 0) await addPointLog(profile.id, earnedPoints, 'earned', 'quest', 'onboarding');

      await saveGamificationState(profile, userState);
    }

    // Dispatch event so UI refreshes
    window.dispatchEvent(new Event('quest_update'));
  }
};

export const updateQuestProgress = async (
  user: User,
  profile: UserProfile,
  type: QuestType,
  amount: number = 1,
  questId?: string
): Promise<{ quests: Quest[], leveledUp: boolean, earnedPoints: number, earnedXp: number }> => {
  // Sync with Onboarding Quests (fire and forget unless specific ID targets daily)
  // If questId is provided and NOT onboarding, we shouldn't trigger onboarding unless it's a generic type match?
  // Actually, if I log a workout, I want it to count for both.
  // If I click a manual daily quest, I don't want it to count for onboarding unless it's same type?
  // Let's assume generic actions (no questId) apply to both. Specific IDs apply only to their target.
  if (!questId || questId.startsWith('onboarding_')) {
    await updateOnboardingQuestProgress(user, profile, type, amount, questId);
  }

  const currentQuests = getDailyQuests(user, profile); // Pass profile to get custom quest
  let updated = false;
  let earnedPoints = 0;
  let earnedXp = 0;
  let updatedProfile = { ...profile };

  // Handle Custom Quest Update specially
  if (questId && questId.startsWith('custom_') && profile.customChallenges) {
    const challengeId = questId.replace('custom_', '');
    const challengeIndex = profile.customChallenges.findIndex(c => c.id === challengeId);

    if (challengeIndex >= 0) {
      const cc = profile.customChallenges[challengeIndex];
      const newProgress = Math.min(cc.progress + amount, cc.target);

      if (newProgress !== cc.progress) {
        updated = true;
        const isNowComplete = newProgress >= cc.target;

        // Update Challenge Object
        const updatedCC: CustomChallenge = {
          ...cc,
          progress: newProgress,
          completed: isNowComplete,
          lastUpdated: new Date().toISOString()
        };

        // Update Profile Array
        const newChallenges = [...profile.customChallenges];
        newChallenges[challengeIndex] = updatedCC;
        updatedProfile = { ...profile, customChallenges: newChallenges };

        // Award Logic
        if (isNowComplete) {
          let rewardXp = 10;
          if (cc.type === 'weekly') rewardXp = 50;
          if (cc.type === 'monthly') rewardXp = 300;

          earnedXp += rewardXp;

          // Notify Tribe and Save Log for Feed
          if (cc.type === 'weekly' || cc.type === 'monthly') {
            if (profile.tribeId) {
              await notifyTribeOnActivity(user, `completed a ${cc.type} challenge: ${cc.title}`, profile.tribeId);
            }

            // Add to Feed
            const challengeLog = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              user: user,
              type: WorkoutType.CUSTOM,
              exercises: [],
              durationMinutes: 0, // Not applicable
              customActivity: `Completed ${cc.type} Challenge: ${cc.title} (${cc.target} ${cc.unit || 'times'})`,
              calories: 0
            };
            await saveLog(challengeLog as any, updatedProfile);
          }
        }

        await updateProfile(updatedProfile);
      }
    }
  }

  const newQuests = currentQuests.map(q => {
    // If it is a custom quest, reflect the updated state from profile (or optimistic state)
    if (q.id.startsWith('custom_') && updatedProfile.customChallenges) {
      const challengeId = q.id.replace('custom_', '');
      const cc = updatedProfile.customChallenges.find(c => c.id === challengeId);
      if (cc) {
        return getCustomChallengeQuest(cc);
      }
    }

    const matchesType = q.type === type;
    const matchesId = questId ? q.id === questId : true;

    if (matchesType && matchesId && !q.completed && !q.id.startsWith('custom_')) {
      const newProgress = Math.min(q.progress + amount, q.target);
      if (newProgress !== q.progress) {
        updated = true;
        const isNowComplete = newProgress >= q.target;

        if (isNowComplete) {
          earnedPoints += q.rewardPoints;
          earnedXp += q.rewardXp;
        }

        return {
          ...q,
          progress: newProgress,
          completed: isNowComplete
        };
      }
    }
    return q;
  });

  if (updated) {
    // Only save standard quests to local storage
    const standardQuests = newQuests.filter(q => !q.id.startsWith('custom_'));
    const key = getStorageKey(user);
    localStorage.setItem(key, JSON.stringify(standardQuests));

    if (earnedPoints > 0 || earnedXp > 0) {
      // Award Rewards
      const allState = await getGamificationState();
      const userState = allState[user];

      if (userState) {
        userState.points = (userState.points || 0) + earnedPoints;
        userState.lifetimeXp = (userState.lifetimeXp || 0) + earnedXp;

        // Log Quest Rewards
        if (earnedXp > 0) await addXPLog(updatedProfile.id, earnedXp, 'quest', 'daily');
        if (earnedPoints > 0) await addPointLog(updatedProfile.id, earnedPoints, 'earned', 'quest', 'daily');

        await saveGamificationState(updatedProfile, userState);
      }
    }

    // Dispatch event for UI updates AFTER saving state
    window.dispatchEvent(new Event('quest_update'));
  }

  return { quests: newQuests, leveledUp: false, earnedPoints, earnedXp };
};

// For manual completion (checkboxes)
export const completeManualQuest = async (user: User, profile: UserProfile, questId: string) => {
  // Handle Onboarding Manual Completion
  if (questId.startsWith('onboarding_')) {
    return updateOnboardingQuestProgress(user, profile, 'manual', 1, questId);
  }

  // Handle Custom Challenge Increment
  if (questId.startsWith('custom_')) {
    return updateQuestProgress(user, profile, 'manual', 1, questId);
  }

  const currentQuests = getDailyQuests(user, profile);
  const quest = currentQuests.find(q => q.id === questId);
  if (!quest || quest.type !== 'manual') return null;

  return updateQuestProgress(user, profile, 'manual', 1, questId); // Manual quests are always target 1
};
