import { GoogleGenAI } from "@google/genai";
import { WorkoutPlan, UserProfile, WorkoutLog, WorkoutType, WeeklyPlan } from "../types";

const GEMINI_MODEL = 'gemini-flash-lite-latest'; // or 'gemini-1.5-flash' depending on access

// Helper to get API Key
const getApiKey = () => import.meta.env.VITE_API_KEY || process.env.API_KEY;

// Helper to parse JSON from Gemini response (handles code blocks)
const parseJSON = (text: string) => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse AI response", e);
        return null;
    }
};

// Helper for long date format (e.g., 10th March 2026)
const getLongDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: 'long' });
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${getOrdinal(day)} ${month} ${year}`;
};

// Helper for ISO date format (YYYY-MM-DD)
const getISODate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const AICoachService = {
    /**
     * Modifies the next workout plan based on user feedback and performance.
     */
    generateModifiedPlan: async (
        currentPlan: WorkoutPlan,
        lastLog: WorkoutLog,
        feedback: import('../types').WorkoutFeedback,
        userProfile: UserProfile
    ): Promise<WorkoutPlan | null> => {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
      You are an expert fitness coach. 
      Analyze the user's last workout and feedback to modify their NEXT workout plan (${currentPlan.id} - ${currentPlan.title}).

      User Profile:
      - Name: ${userProfile.displayName}
      - Level: ${userProfile.level || 'Intermediate'}
      
      Last Workout Performance:
      - Duration: ${lastLog.durationMinutes} mins
      - Exercises Completed: ${lastLog.exercises.map(e => `${e.name} (${e.sets.filter(s => s.completed).length} sets)`).join(', ')}
      
      User Feedback:
      - Difficulty (1-5): ${feedback.difficultyRating}
      - Skipped Exercises: ${feedback.skippedExercises.join(', ')}
      - Pain/Issues: ${feedback.painPoints.join(', ')}
      - Notes: ${feedback.notes || 'None'}

      Current Plan Structure (JSON):
      ${JSON.stringify(currentPlan, null, 2)}

      TASKS:
      1. If difficulty was high (4-5) or pain reported, reduce volume or swap aggravating exercises.
      2. If difficulty was low (1-2), increase weight/reps or intensity.
      3. If exercises were skipped due to time, slightly reduce volume.
      4. Suggest progression (Progressive Overload) for exercises they did well on.
      5. Maintain the same muscle coverage and split focus.
      6. For 'image' field: Keep existing URL if exercise is unchanged. If adding NEW exercise, set 'image' to null/empty.
      7. Determine if an exercise uses reps or time duration (like static holds, planks, yoga). Add a \`trackingType\` field with value 'reps' or 'duration'. If 'duration', provide default time in \`defaultReps\` like '60s'.
      
      OUTPUT:
      Return ONLY the valid JSON of the modified WorkoutPlan object. Do not explain.
    `;

        try {
            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt
            });
            return parseJSON(result.text) as WorkoutPlan;
        } catch (error) {
            console.error("AI Plan Generation failed", error);
            return null;
        }
    },

    /**
     * Generates a weekly diet plan based on user goals and preferences.
     */
    generateDietPlan: async (
        userProfile: UserProfile,
        preferences: string = "Balanced, high protein",
        allergies: string = "None",
        supplements: string = "None"
    ): Promise<any> => {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey });

        // Calculate BMR/TDEE rough estimate
        const height = userProfile.height || 170;
        const weight = userProfile.weight || 70;
        const age = userProfile.dob ? (new Date().getFullYear() - new Date(userProfile.dob).getFullYear()) : 30;
        const gender = userProfile.gender || 'male';

        // Very basic Mifflin-St Jeor
        let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
        const tdee = Math.round(bmr * 1.375); // Moderate activity assumption
        const todayLong = getLongDate(new Date());

        const prompt = `
      Create a 7-day Meal Plan starting TODAY (${todayLong}) for:
      - Calories: ~${tdee} kcal/day
      - Goal: Maintenance/Muscle Gain
      - Preferences: ${preferences}
      - Allergies/Avoid: ${allergies}
      - Supplements: ${supplements}
      
      Format: JSON with structure:
      {
        "weekly_summary": "Brief explanation",
        "days": [
          {
            "day": "Monday (or actual date)",
            "meals": [
              { "name": "Breakfast", "food": "...", "calories": 500, "macros": "30P/50C/20F" },
              ...
            ]
          },
          ... 7 days
        ]
      }
      Return ONLY JSON.
    `;

        try {
            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt
            });
            return parseJSON(result.text);
        } catch (error) {
            console.error("AI Diet Plan failed", error);
            return null;
        }
    },

    /**
     * General chat with the coach.
     */
    chatWithCoach: async (
        history: { role: 'user' | 'model', text: string }[],
        newMessage: string,
        context?: string,
        lastLogs?: WorkoutLog[]
    ): Promise<{ text: string, action?: { type: 'SAVE_DIET' | 'SAVE_SCHEDULE' | 'SAVE_WORKOUT', payload: any } }> => {
        const apiKey = getApiKey();
        if (!apiKey) return { text: "Error: API Key missing" };

        const ai = new GoogleGenAI({ apiKey });

        let logsContext = "";
        if (lastLogs && lastLogs.length > 0) {
            logsContext = `
Last 5 Workouts:
${lastLogs.map(l => {
                const exercisesStr = l.exercises.map(ex => {
                    const completedSets = ex.sets.filter(s => s.completed);
                    return `  * ${ex.name}: ${completedSets.length} sets (${completedSets.map(s => `${s.weight}kgx${s.reps}`).join(', ')})`;
                }).join('\n');
                return `- ${l.date}: ${l.type} (${l.durationMinutes}m)\n${exercisesStr}`;
            }).join('\n')}
`;
        }

        const now = new Date();
        const todayStr = getLongDate(now);
        const todayWeekday = now.toLocaleDateString(undefined, { weekday: 'long' });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLongDate(tomorrow);
        const tomorrowWeekday = tomorrow.toLocaleDateString(undefined, { weekday: 'long' });

        const systemPrompt = `You are Sage Panda, a wise, friendly, and motivating fitness coach. 
    You help users with workouts, diet, and lifestyle.
    
    Current Application State:
    - Today is: ${todayWeekday}, ${todayStr}
    - Tomorrow is: ${tomorrowWeekday}, ${tomorrowStr}

    CAPABILITIES (SKILLS):
    1. **Create Custom Workout**: If user asks for a specific workout (e.g., "Leg day", "Full body"), generate it using references from Plan A/B effectively.
    2. **Create Diet Plan**: If user asks for a diet plan.
    3. **Create Schedule**: If user asks to plan their week.
       - Generate a 7-day schedule starting from TODAY (${todayWeekday}, ${getISODate(now)}) or TOMORROW.
       - ALWAYS include a "date" field (YYYY-MM-DD) for every item in the "schedule" array.
    4. **Analyze Workout Progress**: When a user queries their history or progress, use the detailed logs (which include exercises, sets, weights, and reps) to praise their progress, identify strengths, and suggest progression (e.g. progressive overload).

    INSTRUCTIONS:
    - If you create a plan, you MUST wrap the FULL JSON payload in specific XML tags.
    - **Diet**: <ACTION_SAVE_DIET> { "days": [ { "day": "Monday", "meals": [ { "name": "Breakfast", "food": "Oats...", "calories": 300, "macros": "..." } ] } ] } </ACTION_SAVE_DIET>
    - **Schedule**: <ACTION_SAVE_SCHEDULE> { "schedule": [ { "date": "${getISODate(now)}", "day": "${todayWeekday}", "activity": "Plan A", "type": "A", "notes": "Focus..." } ] } </ACTION_SAVE_SCHEDULE>
    - **Workout**: <ACTION_SAVE_WORKOUT> { "id": "Custom", "title": "Leg Day", "exercises": [ { "name": "Squat", "sets": 3, "reps": "10", "trackingType": "reps" }, { "name": "Plank", "sets": 3, "reps": "60s", "trackingType": "duration" } ] } </ACTION_SAVE_WORKOUT>
    - **IMPORTANT**: return ONLY VALID JSON inside the tags. Do not invent new structures like "weeks" or "dailyPlans". Use the exact keys shown above. Always define \`trackingType\` as 'reps' or 'duration' for exercises. Always provide the 'date' field in ISO format.

    ${context ? `Context: ${context}` : ''}
    ${logsContext}`;

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: newMessage }] }
        ];

        try {
            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: contents
            });
            const text = result.text || "";

            // Parse Actions
            let action = undefined;

            // Helper to extract
            const extract = (tag: string) => {
                const start = text.indexOf(`<${tag}>`);
                const end = text.indexOf(`</${tag}>`);
                if (start !== -1 && end !== -1) {
                    const jsonStr = text.substring(start + tag.length + 2, end).trim(); // +2 for <>
                    const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                    try {
                        return JSON.parse(cleanJson);
                    } catch (e) {
                        console.error("JSON Parse Error in Action", e);
                        return null;
                    }
                }
                return null;
            };

            const dietPayload = extract('ACTION_SAVE_DIET');
            if (dietPayload) action = { type: 'SAVE_DIET', payload: dietPayload };

            const schedulePayload = extract('ACTION_SAVE_SCHEDULE');
            if (schedulePayload) action = { type: 'SAVE_SCHEDULE', payload: schedulePayload };

            const workoutPayload = extract('ACTION_SAVE_WORKOUT');
            if (workoutPayload) action = { type: 'SAVE_WORKOUT', payload: workoutPayload };

            // Remove tags from text for display
            let cleanText = text
                .replace(/<ACTION_SAVE_DIET>[\s\S]*?<\/ACTION_SAVE_DIET>/g, '*(Diet Plan Generated)*')
                .replace(/<ACTION_SAVE_SCHEDULE>[\s\S]*?<\/ACTION_SAVE_SCHEDULE>/g, '*(Schedule Updated)*')
                .replace(/<ACTION_SAVE_WORKOUT>[\s\S]*?<\/ACTION_SAVE_WORKOUT>/g, '*(Custom Workout Created)*');

            // Debug Logs
            console.log("🤖 Raw AI Response:", text);
            console.log("📦 Parsed Action:", action);

            return { text: cleanText, action: action as any };

        } catch (error) {
            console.error("AI Chat failed", error);
            return { text: "The spirits are silent right now. Try again later." };
        }
    },

    /**
     * Starts the Weekly Check-in conversation.
     */
    startWeeklyCheckin: (userProfile: UserProfile, lastWorkout?: WorkoutLog, previousPlan?: WeeklyPlan): { role: 'model', text: string } => {
        const goals = userProfile.goals || {};
        const lastGoal = goals.primary_goal ? `Your main goal is: ${goals.primary_goal}.` : '';
        const lastWorkoutContext = lastWorkout
            ? `I see your last workout was ${lastWorkout.customActivity || `Plan ${lastWorkout.type}`} on ${new Date(lastWorkout.date).toLocaleDateString()}.`
            : '';

        let planContext = '';
        if (previousPlan && previousPlan.schedule) {
            const done = previousPlan.schedule.filter(s => s.status === 'done' || s.status === 'alternate').length;
            const total = previousPlan.schedule.length;
            planContext = ` Looking at your last plan, you completed ${done} out of ${total} scheduled tasks.`;
            if (done < total) {
                planContext += " Let's talk about what made it difficult to complete everything so we can optimize this week!";
            }
        }

        const periodQuestion = userProfile.gender === 'female'
            ? " If relevant, specifically mention if you are on your period or PMSing, so I can adjust volume."
            : "";

        return {
            role: 'model',
            text: `Happy ${new Date().toLocaleDateString(undefined, { weekday: 'long' })}! 🐼
            
${lastGoal} ${lastWorkoutContext}${planContext} Let's plan your week starting today (${getLongDate(new Date())}).
First, tell me: **How are you feeling mentally and physically**? (e.g., Stressed, exhausted, energized)${periodQuestion}`
        };
    },

    /**
     * Analyzes the conversation to extract goals and constraints.
     */
    analyzeUserContext: async (history: { role: 'user' | 'model', text: string }[]) => {
        const apiKey = getApiKey();
        if (!apiKey) return null;
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
        Analyze this conversation between a Fitness Coach and a User.
        Extract the user's CURRENT state for this upcoming week:
        - Stress Level (Low/Med/High)
        - Energy Level (Low/Med/High)
        - Time Constraints (e.g., "only 20 mins a day", "weekend only")
        - Physical State (e.g., "knee pain", "recovered")
        
        Return JSON ONLY:
        {
            "stress": "...",
            "energy": "...",
            "constraints": "...",
            "physical": "..."
        }
        `;

        try {
            // Combine history into string
            const conversationText = history.map(m => `${m.role}: ${m.text}`).join('\n');
            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: `${prompt}\n\nConversation:\n${conversationText}`
            });
            return parseJSON(result.text);
        } catch (e) {
            return null;
        }
    },

    /**
     * Generates a concrete Weekly Plan based on the conversation context.
     * This is called when the user says "Go ahead" or similar confirmation.
     */
    generatePlanFromContext: async (
        userProfile: UserProfile,
        assessment: any,
        previousPlan?: WeeklyPlan,
        history?: { role: 'user' | 'model', text: string }[]
    ): Promise<WeeklyPlan | null> => {
        const apiKey = getApiKey();
        if (!apiKey) return null;
        const ai = new GoogleGenAI({ apiKey });

        // Determine start date based on current time
        const now = new Date();
        const currentHour = now.getHours();
        const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

        const todayStr = getLongDate(now);
        const todayDayName = now.toLocaleDateString(undefined, { weekday: 'long' });
        const todayISO = getISODate(now);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLongDate(tomorrow);
        const tomorrowDayName = tomorrow.toLocaleDateString(undefined, { weekday: 'long' });
        const tomorrowISO = getISODate(tomorrow);

        // Generate the 7 dates for the AI to use
        const next7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            return {
                day: d.toLocaleDateString(undefined, { weekday: 'long' }),
                date: getISODate(d)
            };
        });
        const datesContext = next7Days.map(d => `${d.day}: ${d.date}`).join(', ');

        const historyContext = history ? history.map(m => m.role + ': ' + m.text).join('\\n') : 'No history';

        const prompt = `
        Create a 7-Day Workout Schedule for this user.
        
        IMPORTANT TIME & DATE CONTEXT:
        - Current time of day: ${timeOfDay} (${currentHour}:00)
        - Today is: ${todayDayName}, ${todayStr}
        - Tomorrow is: ${tomorrowDayName}, ${tomorrowStr}
        
        CRITICAL DATE RULES:
        1. The generated 7-day schedule MUST represent the next 7 days or a full week.
        2. Relevant dates for you to use are: ${datesContext}
        3. By default, active planning should START FROM TODAY (${todayISO}) or TOMORROW (${tomorrowISO}).
        4. Use the correct 'date' (YYYY-MM-DD) for each corresponding 'day'.
        
        User Context:
        - Goal: ${userProfile.goals?.primary_goal || 'General Fitness'}
        - Gender: ${userProfile.gender}
        - ASSESSMENT: ${JSON.stringify(assessment)}
        ${previousPlan ? `- PREVIOUS PLAN ADHERENCE: ${JSON.stringify(previousPlan.schedule.map(s => ({ activity: s.activity, status: s.status })))}` : ''}
        - CHAT HISTORY (to check if user explicitly requested to start today):
        ${historyContext}
        
        Rules:
        1. **Strict Types**: Use ONLY 'A' and 'B' for Strength Training. Do NOT invent new letters.
        2. **User Plans**: The user has existing 'Plan A' and 'Plan B'. Creating a "Plan C" is invalid.
        3. **Low Energy/Period**: If user is low energy/has period, recommend LIGHT Walking, Yoga, or Reduced Volume Plan A/B if they insist.
        4. **Dates**: Use ISO date strings (YYYY-MM-DD) for the 'date' field. USE THE DATES PROVIDED ABOVE.
        5. **Optimization**: If previous plan had many 'not_done' or 'partial', suggest a more realistic or lighter schedule this week to improve adherence.
        6. **Tracking Type**: Always determine if an exercise is traditional (reps) or a static hold/yoga pose (duration). Output a \`trackingType\` field with value 'reps' or 'duration' for exercises inside plans. If 'duration', provide default time in \`defaultReps\` like '60s'.
        
        Output JSON Format:
        {
          "summary": "Brief explanation of strategy",
          "schedule": [
            { "date": "${todayISO}", "day": "${todayDayName}", "activity": "Plan A", "type": "A", "notes": "Focus on Bench", "status": null },
            { "date": "${tomorrowISO}", "day": "${tomorrowDayName}", "activity": "Walking", "type": "CARDIO", "notes": "Light pace", "status": null },
            ...
          ]
        }
        Valid Types: 'A', 'B', 'CUSTOM', 'REST', 'CARDIO', 'YOGA'
        `;

        try {
            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt
            });
            return parseJSON(result.text) as WeeklyPlan;
        } catch (e) {
            return null;
        }
    }
};
