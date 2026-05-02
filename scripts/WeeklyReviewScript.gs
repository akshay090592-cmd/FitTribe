/**
 * FIT TRIBE: Weekly Progress & Performance Review Script
 * Designed to run every Sunday to provide AI-powered feedback.
 *
 * SETUP INSTRUCTIONS:
 * 1. Open Google Apps Script (script.google.com).
 * 2. Create a new project and paste this code.
 * 3. Replace the placeholder values in the CONFIG object below with your actual credentials.
 * 4. Go to "Triggers" (alarm clock icon) and click "Add Trigger".
 * 5. Choose "runTargetedUserReviews" as the function, "Time-driven" as the event source,
 *    "Week timer" as the type, and "Every Sunday" as the day.
 */

const CONFIG = {
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_KEY: 'YOUR_SUPABASE_SERVICE_ROLE_KEY', // Service role key for bypass RLS
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
  EMAIL_FROM_NAME: 'FitTribe Coach',
  MUSCLE_GROUPS: {
    CHEST: 'Chest',
    BACK: 'Back',
    LEGS: 'Legs',
    SHOULDERS: 'Shoulders',
    ARMS: 'Arms',
    CORE: 'Core',
    CARDIO: 'Cardio',
    OTHER: 'Other'
  },
  EXERCISE_MUSCLE_MAP: {
    "Bench Press (Dumbbell)": 'Chest',
    "Wall Pushups": 'Chest',
    "Overhead Press (Dumbbell)": 'Shoulders',
    "Light Overhead Press": 'Shoulders',
    "Lateral Raise": 'Shoulders',
    "Triceps Dip (Assisted)": 'Arms',
    "Triceps Pushdown (Cable)": 'Arms',
    "Overhead Triceps Extension": 'Arms',
    "Skullcrushers": 'Arms',
    "Pull Up / Lat Pulldown": 'Back',
    "Lat Pulldown": 'Back',
    "Bent-Over Row (Dumbbell)": 'Back',
    "Bent-Over Row": 'Back',
    "Preacher Curl": 'Arms',
    "Crossbody Hammer Curl": 'Arms',
    "Bench Pistol Squat": 'Legs',
    "Goblet Squat": 'Legs',
    "Deep Bodyweight Squats": 'Legs',
    "Romanian Deadlift (RDL)": 'Legs',
    "Leg Extension": 'Legs',
    "Lying Leg Curl": 'Legs',
    "Squat": 'Legs',
    "Lunge": 'Legs',
    "Russian Twist": 'Core',
    "Knee Raise": 'Core',
    "Plank": 'Core',
    "Crunches": 'Core'
  }
};

/**
 * Trigger this function to run only for the specific users requested.
 */
function runTargetedUserReviews() {
  const targetUserIds = [
    "4fd9f1f0-9fd5-4de4-8ff0-4962e6c67e08", // Shagun
    "b3dac3be-ef11-4f26-9561-b418d6131aea", // Madhulika
    "fdf7732a-7578-4aef-8354-66d7acecbae1"  // Akshay
  ];
  runWeeklyReview(null, targetUserIds);
}

/**
 * Main entry point.
 * @param {string[]} targetTribeIds Optional list of tribe IDs to process.
 * @param {string[]} targetUserIds Optional list of user IDs to process.
 */
function runWeeklyReview(targetTribeIds = null, targetUserIds = null) {
  Logger.log('Starting Weekly Review Process...');

  const allUsers = fetchAllProfiles();
  Logger.log(`Fetched ${allUsers.length} total profiles from database.`);

  let usersToProcess = allUsers;

  if (targetUserIds && targetUserIds.length > 0) {
    usersToProcess = allUsers.filter(u => targetUserIds.includes(u.id));
    Logger.log(`Filtered to ${usersToProcess.length} targeted users.`);
  } else if (targetTribeIds && targetTribeIds.length > 0) {
    usersToProcess = allUsers.filter(u => targetTribeIds.includes(u.tribe_id));
    Logger.log(`Filtered to ${usersToProcess.length} users in target tribes.`);
  }

  if (usersToProcess.length === 0) {
    Logger.log('No users found to process. Please check if IDs match exactly.');
    return;
  }

  usersToProcess.forEach(user => {
    try {
      processUserReview(user);
    } catch (e) {
      Logger.log(`Error processing user ${user.id} (${user.display_name}): ${e.message}`);
    }
  });

  Logger.log('Weekly Review Process Completed.');
}

/**
 * Fetches all user profiles from Supabase.
 */
function fetchAllProfiles() {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/profiles?select=id,email,display_name,tribe_id`;

  const response = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const content = response.getContentText();

  if (status !== 200) {
    Logger.log(`Error fetching profiles (Status ${status}): ${content}`);
    return [];
  }

  return JSON.parse(content);
}

/**
 * Orchestrates the review for a single user.
 */
function processUserReview(user) {
  Logger.log(`Processing review for ${user.display_name}...`);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Fetch Logs
  const recentLogs = fetchUserLogs(user.id, sevenDaysAgo.toISOString());
  const historicalLogs = fetchUserLogs(user.id, fourteenDaysAgo.toISOString(), sevenDaysAgo.toISOString());

  // 2. Fetch Tribe Context (Motivation from others in the same tribe)
  let tribeMotivations = [];
  if (user.tribe_id) {
    const tribeMembers = fetchTribeMembers(user.tribe_id);
    const memberIds = tribeMembers.map(m => m.id).filter(id => id !== user.id);
    if (memberIds.length > 0) {
      const tribeLogs = fetchLogsByBatch(memberIds, sevenDaysAgo.toISOString());
      tribeMotivations = aggregateTribeActivity(tribeLogs);
    }
  }

  // 3. Aggregate Data
  const analysisInput = {
    userName: user.display_name,
    weeklyGoal: 3, // Defaulting to 3 as it's primarily local in the app
    statsThisWeek: aggregateStats(recentLogs),
    statsLastWeek: aggregateStats(historicalLogs),
    muscleFocusThisWeek: calculateMuscleFocus(recentLogs),
    muscleFocusLastWeek: calculateMuscleFocus(historicalLogs),
    prs: findImprovements(recentLogs, historicalLogs),
    nonFitnessActivities: getNonFitnessActivities(recentLogs),
    tribeMotivations: tribeMotivations
  };

  // 4. Get AI Analysis
  const aiReview = getGeminiAnalysis(analysisInput);

  // 5. Send Email
  sendReviewEmail(user.email, user.display_name, aiReview);
}

function fetchUserLogs(userId, fromDate, toDate = null) {
  let url = `${CONFIG.SUPABASE_URL}/rest/v1/workout_logs?user_id=eq.${userId}&date=gte.${fromDate}`;
  if (toDate) {
    url += `&date=lt.${toDate}`;
  }

  const response = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) return [];

  const data = JSON.parse(response.getContentText());
  return data.map(row => ({
    ...row.log_data,
    date: row.date
  }));
}

function fetchTribeMembers(tribeId) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/profiles?tribe_id=eq.${tribeId}&select=id,display_name`;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) return [];
  return JSON.parse(response.getContentText());
}

function fetchLogsByBatch(userIds, fromDate) {
  // Limited batch size to avoid URL length issues
  const batch = userIds.slice(0, 50);
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/workout_logs?user_id=in.(${batch.join(',')})&date=gte.${fromDate}&select=display_name,log_data`;

  const response = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) return [];
  return JSON.parse(response.getContentText());
}

function aggregateStats(logs) {
  return {
    count: logs.length,
    totalMinutes: logs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0),
    totalCalories: logs.reduce((sum, l) => sum + (l.calories || 0), 0),
    avgIntensity: logs.length > 0 ? logs.reduce((sum, l) => sum + (l.intensity || 0), 0) / logs.length : 0,
    volume: logs.reduce((sum, l) => {
      if (!l.exercises) return sum;
      return sum + l.exercises.reduce((exSum, ex) => {
        return exSum + (ex.sets || []).reduce((sSum, s) => sSum + (s.completed ? s.weight * s.reps : 0), 0);
      }, 0);
    }, 0)
  };
}

function calculateMuscleFocus(logs) {
  const focus = {};
  logs.forEach(l => {
    if (!l.exercises) return;
    l.exercises.forEach(ex => {
      const group = CONFIG.EXERCISE_MUSCLE_MAP[ex.name] || CONFIG.MUSCLE_GROUPS.OTHER;
      focus[group] = (focus[group] || 0) + (ex.sets || []).filter(s => s.completed).length;
    });
  });
  return focus;
}

function findImprovements(recent, historical) {
  const getMaxes = (logs) => {
    const maxes = {};
    logs.forEach(l => {
      if (!l.exercises) return;
      l.exercises.forEach(ex => {
        const bestSet = (ex.sets || []).reduce((best, current) => {
          if (!current.completed) return best;
          const e1rm = current.weight * (1 + current.reps / 30);
          return (!best || e1rm > best.e1rm) ? { weight: current.weight, reps: current.reps, e1rm } : best;
        }, null);
        if (bestSet) {
          if (!maxes[ex.name] || bestSet.e1rm > maxes[ex.name].e1rm) {
            maxes[ex.name] = bestSet;
          }
        }
      });
    });
    return maxes;
  };

  const recentMaxes = getMaxes(recent);
  const oldMaxes = getMaxes(historical);
  const improvements = [];

  for (const ex in recentMaxes) {
    if (oldMaxes[ex]) {
      const diff = ((recentMaxes[ex].e1rm - oldMaxes[ex].e1rm) / oldMaxes[ex].e1rm) * 100;
      if (diff > 0) {
        improvements.push({ exercise: ex, improvement: diff.toFixed(1) + '%' });
      }
    } else {
      improvements.push({ exercise: ex, status: 'New PR recorded' });
    }
  }
  return improvements;
}

function getNonFitnessActivities(logs) {
  return logs
    .filter(l => l.type === 'COMMITMENT' || l.customActivity)
    .map(l => ({
      activity: l.customActivity || 'Well-being Commitment',
      date: l.date.split('T')[0]
    }));
}

function aggregateTribeActivity(logs) {
  const summary = {};
  logs.forEach(l => {
    const logData = typeof l.log_data === 'string' ? JSON.parse(l.log_data) : l.log_data;
    // Count workouts that have actual exercises logged
    const hasExercises = (logData?.exercises?.length || 0) > 0;
    if (hasExercises) {
      summary[l.display_name] = (summary[l.display_name] || 0) + 1;
    }
  });
  const activeTribe = Object.entries(summary).filter(([_, count]) => count > 0);
  return activeTribe.map(([name, count]) => `${name} did ${count} workouts`);
}

function getGeminiAnalysis(input) {
  const prompt = `
    As a fitness coach, analyze the following weekly performance data for ${input.userName} and provide a review.

    Weekly Goal: ${input.weeklyGoal} workouts.
    Stats Comparison (Current vs Last Week): ${JSON.stringify(input.statsThisWeek)} vs ${JSON.stringify(input.statsLastWeek)}
    Muscle Group Focus (Current vs Last Week): ${JSON.stringify(input.muscleFocusThisWeek)} vs ${JSON.stringify(input.muscleFocusLastWeek)}
    Improvements/PRs: ${JSON.stringify(input.prs)}
    Non-Fitness/Well-being Activities: ${JSON.stringify(input.nonFitnessActivities)}
    Tribe Activity: ${JSON.stringify(input.tribeMotivations)}

    Please provide:
    1. A summary of the progress and performance (be specific about muscle groups and PRs).
    2. Recommendations for next week based on current focus and improvements.
    3. Motivation considering the user's well-being activities and their tribe's activity.
    4. Keep the tone encouraging, personal, and professional. Use markdown for formatting.
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const result = JSON.parse(response.getContentText());
  if (result.error) {
    throw new Error(`Gemini API Error: ${result.error.message}`);
  }
  return result.candidates[0].content.parts[0].text;
}

/**
 * Converts basic Markdown to HTML.
 */
function markdownToHtml(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>');

  // Handle lists
  html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');

  // Consolidate adjacent <ul>
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Newlines to breaks
  html = html.replace(/\n/gim, '<br>');

  return html;
}

function sendReviewEmail(email, name, content) {
  const htmlContent = markdownToHtml(content);
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
      <h2 style="color: #059669;">Your Weekly FitTribe Review, ${name}! 🐼</h2>
      <div style="background: #f9f9f9; padding: 25px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        ${htmlContent}
      </div>
      <p style="margin-top: 25px; font-weight: bold; text-align: center; color: #059669;">Keep pushing, you're doing great!</p>
      <p style="text-align: center; font-size: 0.8em; color: #9ca3af;"><em>- The FitTribe Coach</em></p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: `Weekly Performance Review - ${new Date().toLocaleDateString()}`,
    htmlBody: htmlBody,
    name: CONFIG.EMAIL_FROM_NAME
  });
}
