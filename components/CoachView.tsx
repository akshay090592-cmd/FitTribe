import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, WeeklyPlan, PlanStatus } from '../types';
import { AICoachService } from '../services/aiCoach';
import { getUserDiet, saveUserDiet, getUserPlans, saveUserPlan, getUserLogs, getUserLogsById, saveCustomWorkoutPlan } from '../utils/storage';
import { MessageSquare, Calendar, Sparkles, Send, ChefHat, RefreshCw, CheckCircle2, Circle, Shuffle, MinusCircle, XCircle, TrendingUp, Info } from 'lucide-react';
import { monthDayFormatter, weekdayShortFormatter, formatWithCache } from '../utils/dateUtils';

import { WorkoutLog } from '../types';

const FormattedMessage = ({ text }: { text: string }) => {
    return (
        <>
            {text.split('\n').map((line, i, lines) => (
                <React.Fragment key={i}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <b key={j}>{part.slice(2, -2)}</b>;
                        }
                        return part;
                    })}
                    {i < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </>
    );
};

interface Props {
    userProfile: UserProfile;
    lastWorkout?: WorkoutLog;
    onFetching?: (fetching: boolean) => void;
}

const PlanDisplay = ({ plan, onStatusChange, editable = false }: { plan: WeeklyPlan, onStatusChange?: (idx: number, status: PlanStatus) => void, editable?: boolean }) => {
    const getStatusIcon = (status: PlanStatus) => {
        switch (status) {
            case 'done': return <CheckCircle2 size={18} className="text-emerald-500" />;
            case 'alternate': return <Shuffle size={18} className="text-blue-500" />;
            case 'partial': return <MinusCircle size={18} className="text-orange-500" />;
            case 'not_done': return <XCircle size={18} className="text-red-500" />;
            default: return <Circle size={18} className="text-slate-300" />;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            return formatWithCache(monthDayFormatter, dateStr);
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="space-y-3">
            {plan.schedule?.map((day: any, idx: number) => (
                <div key={idx} className="flex items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:border-emerald-100 transition-colors">
                    {editable && (
                        <div className="mr-3 flex items-center gap-1">
                            <button
                                onClick={() => {
                                    const statuses: PlanStatus[] = [null, 'done', 'alternate', 'partial', 'not_done'];
                                    const currentIdx = statuses.indexOf(day.status);
                                    const nextIdx = (currentIdx + 1) % statuses.length;
                                    onStatusChange?.(idx, statuses[nextIdx]);
                                }}
                                className="p-1 hover:bg-slate-50 rounded-lg transition-colors"
                                title="Change status"
                            >
                                {getStatusIcon(day.status)}
                            </button>
                        </div>
                    )}
                    <div className="w-16 text-xs font-bold text-slate-400 uppercase flex flex-col leading-tight">
                        <span>{day.day?.substring(0, 3) || (day.date ? weekdayShortFormatter.format(new Date(day.date)) : '???')}</span>
                        <span className="text-[9px] opacity-70 font-medium">{formatDate(day.date)}</span>
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-700 text-sm">{day.activity}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{day.notes}</div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${day.type === 'REST' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                        {day.type}
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * BOLT: Memoize CoachView to prevent redundant re-renders from background state changes.
 * Performance Impact: Maintains stable frame rates during workout sessions and news updates.
 */
export const CoachView: React.FC<Props> = React.memo(({ userProfile, lastWorkout, onFetching }) => {
    const [activeTab, setActiveTab] = useState<'diet' | 'chat' | 'checkin'>('chat');
    const [dietPlan, setDietPlan] = useState<any>(null);
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
    const [loadingDiet, setLoadingDiet] = useState(false);
    const [userLogs, setUserLogs] = useState<WorkoutLog[]>([]);

    // Diet Form State
    const [dietPreferences, setDietPreferences] = useState('Balanced, high protein');
    const [dietAllergies, setDietAllergies] = useState('');
    const [dietSupplements, setDietSupplements] = useState('');
    const [showDietForm, setShowDietForm] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { role: 'model', text: `Hello ${userProfile.displayName}! I am Sage Panda, your AI fitness coach. 🐼\n\nI can help you with:\n• **Custom Workouts**\n• **Diet Plans**\n• **Weekly Schedules**\n\nWhat would you like to work on today?` }
    ]);
    const [input, setInput] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);

    // Check-in State
    const [checkinMessages, setCheckinMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [isCheckinActive, setIsCheckinActive] = useState(false);
    const [checkinAssessment, setCheckinAssessment] = useState<any>(null);
    const [proposedPlan, setProposedPlan] = useState<any>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: string, payload: any } | null>(null);
    const [actionStatus, setActionStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    useEffect(() => {
        const loadData = async () => {
            setLoadingDiet(true);
            onFetching?.(true);
            const dPlan = await getUserDiet(userProfile.id);
            if (dPlan) setDietPlan(dPlan);

            const wPlan = await getUserPlans(userProfile.id) as WeeklyPlan;
            if (wPlan && wPlan.schedule) {
                // Auto-mark previous days
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let changed = false;
                const updatedSchedule = wPlan.schedule.map(item => {
                    if (item.date) {
                        const itemDate = new Date(item.date);
                        itemDate.setHours(0, 0, 0, 0);
                        if (itemDate < today && !item.status) {
                            changed = true;
                            return { ...item, status: 'not_done' as PlanStatus };
                        }
                    }
                    return item;
                });

                if (changed) {
                    const updatedPlan = { ...wPlan, schedule: updatedSchedule };
                    setWeeklyPlan(updatedPlan);
                    saveUserPlan(userProfile.id, updatedPlan);
                } else {
                    setWeeklyPlan(wPlan);
                }
            }


            const logs = await getUserLogsById(userProfile.id, userProfile.displayName);
            setUserLogs(logs.slice(0, 5));

            setLoadingDiet(false);
            onFetching?.(false);
        };
        loadData();
    }, [userProfile.id]);

    const handleStatusChange = (idx: number, status: PlanStatus) => {
        if (!weeklyPlan || !weeklyPlan.schedule) return;
        const updatedSchedule = [...weeklyPlan.schedule];
        updatedSchedule[idx] = { ...updatedSchedule[idx], status };
        const updatedPlan = { ...weeklyPlan, schedule: updatedSchedule };
        setWeeklyPlan(updatedPlan);
        saveUserPlan(userProfile.id, updatedPlan);
    };

    const adherenceStats = useMemo(() => {
        if (!weeklyPlan || !weeklyPlan.schedule) return null;
        const schedule = weeklyPlan.schedule;
        const total = schedule.length;

        // BOLT: Single-pass loop replaces 5 separate array allocations and linear scans.
        // Performance: Reduces complexity from O(5N) to O(N) while eliminating array allocations.
        let done = 0;
        let alternate = 0;
        let partial = 0;
        let notDone = 0;
        let pending = 0;

        for (let i = 0; i < total; i++) {
            const status = schedule[i].status;
            if (status === 'done') done++;
            else if (status === 'alternate') alternate++;
            else if (status === 'partial') partial++;
            else if (status === 'not_done') notDone++;
            else pending++;
        }

        return {
            done: Math.round((done / total) * 100),
            adherence: Math.round(((done + alternate + partial * 0.5) / (total || 1)) * 100),
            breakdown: { done, alternate, partial, notDone, pending }
        };
    }, [weeklyPlan]);

    const handleGenerateDiet = async () => {
        setLoadingDiet(true);
        onFetching?.(true);
        const plan = await AICoachService.generateDietPlan(
            userProfile,
            dietPreferences,
            dietAllergies || "None",
            dietSupplements || "None"
        );
        if (plan) {
            setDietPlan(plan);
            await saveUserDiet(userProfile.id, plan);
            setShowDietForm(false);
        }
        setLoadingDiet(false);
        onFetching?.(false);
    };



    const sendMessage = async () => {
        if (!input.trim() || loadingChat) return;

        const userMsg = input;
        setInput('');
        setLoadingChat(true);
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

        const response = await AICoachService.chatWithCoach(
            messages,
            userMsg,
            `User Profile: ${JSON.stringify(userProfile)}`,
            userLogs
        );

        setMessages(prev => [...prev, { role: 'model', text: response.text }]);

        if (response.action) {
            handleAIAction(response.action);
        }
        setLoadingChat(false);
    };

    const handleAIAction = (action: { type: string, payload: any }) => {
        console.log("⚡ Handling Action:", action.type, action.payload);

        // Normalize Payloads
        let normalizedAction = { ...action };

        if (action.type === 'SAVE_SCHEDULE') {
            // Map AI 'scheduleDetails' OR 'days' OR 'weeks[0].days' to 'schedule'
            let sourceArray = action.payload.schedule || action.payload.scheduleDetails || action.payload.days;

            // Handle "weeks" structure: weeks: [{ days: [] }]
            if (!sourceArray && action.payload.weeks && Array.isArray(action.payload.weeks) && action.payload.weeks.length > 0) {
                sourceArray = action.payload.weeks[0].days;
            }

            if (sourceArray && Array.isArray(sourceArray)) {
                const mappedSchedule = sourceArray.map((item: any) => ({
                    day: item.day || item.dayOfWeek,
                    activity: item.activity || item.focus || "Rest",
                    notes: item.notes || item.description || item.focus || item.duration || '',
                    type: (item.activity || '').toLowerCase().includes('rest') ? 'REST' :
                        (item.activity || '').toLowerCase().includes('cardio') ? 'CARDIO' : 'A', // Default type fallback
                    date: item.date || new Date().toISOString(),
                    status: null
                }));
                normalizedAction.payload = { ...action.payload, schedule: mappedSchedule };
            }
        }

        if (action.type === 'SAVE_DIET') {
            // Map 'dailyPlans' -> 'days'
            let sourceDays = action.payload.days || action.payload.dailyPlans;

            if (sourceDays && Array.isArray(sourceDays)) {
                const mappedDays = sourceDays.map((d: any) => ({
                    ...d,
                    day: d.day || d.dayOfWeek,
                    meals: d.meals.map((m: any) => {
                        // Handle "items" array in diet
                        let foodDesc = m.description || m.food;
                        if (!foodDesc && m.items && Array.isArray(m.items)) {
                            foodDesc = m.items.map((i: any) => `${i.name} (${i.quantity || ''})`).join(', ');
                        }

                        return {
                            name: m.mealName || m.name,
                            food: foodDesc || "Meal details",
                            calories: m.calories,
                            macros: m.macros
                        };
                    })
                }));
                normalizedAction.payload = { ...action.payload, days: mappedDays };
            }
        }

        if (action.type === 'SAVE_WORKOUT') {
            // Normalize workout structure: AI might send { warmup: [], exercises: [], cooldown: [] }
            // We need to ensure the payload has a proper WorkoutPlan structure

            // Extract exercises from nested structure if needed
            let exercises = action.payload.exercises;

            // If exercises is nested or missing, try to extract it
            if (!exercises && action.payload.workout?.exercises) {
                exercises = action.payload.workout.exercises;
            }

            // Ensure warmup and cooldown are arrays
            const warmup = action.payload.warmup || action.payload.workout?.warmup || [];
            const cooldown = action.payload.cooldown || action.payload.workout?.cooldown || [];

            // Normalize exercise structure to match WorkoutPlan.exercises format
            if (exercises && Array.isArray(exercises)) {
                const normalizedExercises = exercises.map((ex: any) => ({
                    name: ex.name || ex.exercise || 'Exercise',
                    defaultSets: ex.sets || ex.defaultSets || 3,
                    defaultReps: ex.reps || ex.defaultReps || '10',
                    notes: ex.notes || ex.description || '',
                    cues: ex.cues || [],
                    isSuperset: ex.isSuperset || false,
                    supersetGroup: ex.supersetGroup,
                    restSeconds: ex.restSeconds || ex.rest || 60
                }));

                normalizedAction.payload = {
                    id: action.payload.id || 'Custom',
                    title: action.payload.title || action.payload.name || 'Custom Workout',
                    focus: action.payload.focus || action.payload.description || 'Custom workout',
                    warmup: Array.isArray(warmup) ? warmup : [],
                    exercises: normalizedExercises,
                    cooldown: Array.isArray(cooldown) ? cooldown : []
                };
            }
        }

        setPendingAction(normalizedAction);

        // Scroll to bottom to show confirmation
        setTimeout(() => {
            const el = document.getElementById('chat-bottom');
            el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        setActionStatus('saving');
        console.log("💾 Confirming Action:", pendingAction.type, pendingAction.payload);
        try {
            switch (pendingAction.type) {
                case 'SAVE_DIET':
                    setDietPlan(pendingAction.payload);
                    await saveUserDiet(userProfile.id, pendingAction.payload);
                    break;
                case 'SAVE_SCHEDULE':
                    setWeeklyPlan(pendingAction.payload); // Update state immediately
                    await saveUserPlan(userProfile.id, pendingAction.payload);
                    break;
                case 'SAVE_WORKOUT':
                    await saveCustomWorkoutPlan(userProfile, pendingAction.payload);
                    break;
            }
            setActionStatus('success');

            // Add success message to chat
            const successMsg = {
                role: 'model' as const,
                text: getSuccessMessage(pendingAction.type)
            };
            setMessages(prev => [...prev, successMsg]);

            setTimeout(() => {
                setPendingAction(null);
                setActionStatus('idle');
            }, 2000);

        } catch (e) {
            console.error("Action failed", e);
            setActionStatus('idle');
            alert("Failed to save. Please try again.");
        }
    };

    const discardAction = () => {
        setPendingAction(null);
        setMessages(prev => [...prev, { role: 'model' as const, text: "Cancelled. Let me know if you want to try something else." }]);
    };

    const getSuccessMessage = (type: string) => {
        switch (type) {
            case 'SAVE_DIET': return "Diet plan saved successfully! Check the Nutrition tab.";
            case 'SAVE_SCHEDULE': return "Schedule updated! Check the Schedule tab.";
            case 'SAVE_WORKOUT': return "Custom workout saved! It's added to your list.";
            default: return "Action completed successfully.";
        }
    };

    const getActionTitle = (type: string) => {
        switch (type) {
            case 'SAVE_DIET': return "New Diet Plan";
            case 'SAVE_SCHEDULE': return "New Schedule";
            case 'SAVE_WORKOUT': return "Custom Workout";
            default: return "Suggestion";
        }
    };

    const startCheckin = () => {
        const intro = AICoachService.startWeeklyCheckin(userProfile, lastWorkout, weeklyPlan || undefined);
        setCheckinMessages([intro]);
        setIsCheckinActive(true);
        setProposedPlan(null);
        setCheckinAssessment(null);
    };

    const handleCheckinMessage = async () => {
        if (!input.trim() || loadingChat) return;

        const userMsg = input;
        setInput('');
        setCheckinMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoadingChat(true);

        // 1. Analyze context for assessment
        const history = [...checkinMessages, { role: 'user' as const, text: userMsg }];
        const assessment = await AICoachService.analyzeUserContext(history);

        if (assessment && (assessment.stress || assessment.energy)) {
            setCheckinAssessment(assessment);
        }

        // 2. Chat response
        const response = await AICoachService.chatWithCoach(
            checkinMessages,
            userMsg,
            `Context: Weekly Check-in. Goal: Gather info on Mood/Stress to generate a plan. System Assessment so far: ${JSON.stringify(assessment)}`,
            userLogs
        );

        setCheckinMessages(prev => [...prev, { role: 'model', text: response.text }]);
        if (response.action) handleAIAction(response.action);
        setLoadingChat(false);
    };

    const generateWeeklyPlan = async () => {
        setIsGeneratingPlan(true);
        const plan = await AICoachService.generatePlanFromContext(userProfile, checkinAssessment, weeklyPlan || undefined, checkinMessages);
        if (plan) {
            setProposedPlan(plan);
        }
        setIsGeneratingPlan(false);
    };

    const confirmPlan = async () => {
        // Save plan to DB
        saveUserPlan(userProfile.id, proposedPlan);
        setWeeklyPlan(proposedPlan);
        setCheckinMessages(prev => [...prev, { role: 'model', text: "Perfect! I've updated your schedule. Let's crush this week! 🐼💪" }]);
        setProposedPlan(null); // Hide card
        setIsCheckinActive(false);
    };

    return (
        <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 animate-fade-in relative z-10 pb-24">

            {/* Segmented Tab Switcher */}
            <div className="glass-panel flex p-1.5 rounded-[22px] mb-6 shadow-md border border-white/80" style={{ background: 'hsla(140,45%,96%,0.92)' }}>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 rounded-[16px] font-bold flex items-center justify-center transition-all text-xs sm:text-sm tactile-press ${
                        activeTab === 'chat'
                            ? 'text-white shadow-md shadow-emerald-600/25'
                            : 'text-emerald-800 hover:bg-white/60'
                    }`}
                    style={activeTab === 'chat' ? { background: 'linear-gradient(135deg, hsl(145,65%,36%), hsl(160,70%,28%))' } : {}}
                >
                    <MessageSquare size={16} className="mr-1.5 shrink-0" /> AI Coach
                </button>
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`flex-1 py-3 rounded-[16px] font-bold flex items-center justify-center transition-all text-xs sm:text-sm tactile-press ${
                        activeTab === 'checkin'
                            ? 'text-white shadow-md shadow-orange-500/25'
                            : 'text-emerald-800 hover:bg-white/60'
                    }`}
                    style={activeTab === 'checkin' ? { background: 'linear-gradient(135deg, hsl(25,95%,55%), hsl(15,90%,48%))' } : {}}
                >
                    <Calendar size={16} className="mr-1.5 shrink-0" /> Schedule
                </button>
                <button
                    onClick={() => setActiveTab('diet')}
                    className={`flex-1 py-3 rounded-[16px] font-bold flex items-center justify-center transition-all text-xs sm:text-sm tactile-press ${
                        activeTab === 'diet'
                            ? 'text-white shadow-md shadow-teal-600/25'
                            : 'text-emerald-800 hover:bg-white/60'
                    }`}
                    style={activeTab === 'diet' ? { background: 'linear-gradient(135deg, hsl(165,65%,38%), hsl(178,70%,30%))' } : {}}
                >
                    <ChefHat size={16} className="mr-1.5 shrink-0" /> Nutrition
                </button>
            </div>

            {activeTab === 'checkin' && (
                <div className="animate-slide-up space-y-5">
                    {!isCheckinActive ? (
                        <>
                            <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 rounded-[32px] p-7 sm:p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden text-center border border-white/20">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-300/20 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
                                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/25">
                                    <span>🐼</span> Sage Weekly Sync
                                </div>
                                <h2 className="text-3xl font-bold font-['Fredoka'] mb-2 drop-shadow-sm">New Week, New Plan</h2>
                                <p className="text-orange-50 mb-6 font-medium text-sm max-w-sm mx-auto leading-relaxed">Let's check your vibe and build a custom schedule tailored to your recovery and goals.</p>
                                <button
                                    onClick={startCheckin}
                                    className="bg-white text-orange-600 hover:bg-orange-50 font-bold py-3.5 px-8 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center mx-auto text-sm"
                                >
                                    Start Check-in <Sparkles size={18} className="ml-2 text-amber-500" />
                                </button>
                            </div>

                            {weeklyPlan && (
                                <div className="animate-slide-up space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 font-['Fredoka']">Current Weekly Plan</h3>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center mt-0.5">
                                                <Info size={11} className="mr-1 text-emerald-500" /> Tap icons to change state
                                            </div>
                                        </div>
                                        {adherenceStats && (
                                            <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-2xl text-right shadow-xs">
                                                <div className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider">Adherence</div>
                                                <div className="text-lg font-bold text-emerald-700 font-['Fredoka'] leading-tight">{adherenceStats.adherence}%</div>
                                            </div>
                                        )}
                                    </div>

                                    <PlanDisplay plan={weeklyPlan} editable onStatusChange={handleStatusChange} />

                                    {/* Legend */}
                                    <div className="bg-white/85 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-100/80 flex flex-wrap gap-x-4 gap-y-2 justify-center shadow-xs">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase">
                                            <CheckCircle2 size={13} className="text-emerald-500" /> Done
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase">
                                            <Shuffle size={13} className="text-blue-500" /> Alternate Day
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase">
                                            <MinusCircle size={13} className="text-orange-500" /> Partial
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase">
                                            <XCircle size={13} className="text-red-500" /> Not Done
                                        </div>
                                    </div>

                                    {adherenceStats && (
                                        <div className="bg-white/95 backdrop-blur-md p-5 rounded-[26px] border border-emerald-100/80 shadow-md">
                                            <div className="flex items-center justify-between mb-3.5">
                                                <div className="flex items-center">
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center mr-2">
                                                        <TrendingUp size={15} className="text-emerald-600" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weekly Adherence Stats</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2.5 text-center">
                                                <div className="bg-emerald-50/90 border border-emerald-100 p-2.5 rounded-2xl">
                                                    <div className="text-emerald-700 font-bold text-xl font-['Fredoka']">{adherenceStats.breakdown.done}</div>
                                                    <div className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider">Done</div>
                                                </div>
                                                <div className="bg-blue-50/90 border border-blue-100 p-2.5 rounded-2xl">
                                                    <div className="text-blue-700 font-bold text-xl font-['Fredoka']">{adherenceStats.breakdown.alternate}</div>
                                                    <div className="text-[9px] font-bold text-blue-600/80 uppercase tracking-wider">Alt</div>
                                                </div>
                                                <div className="bg-orange-50/90 border border-orange-100 p-2.5 rounded-2xl">
                                                    <div className="text-orange-700 font-bold text-xl font-['Fredoka']">{adherenceStats.breakdown.partial}</div>
                                                    <div className="text-[9px] font-bold text-orange-600/80 uppercase tracking-wider">Part</div>
                                                </div>
                                                <div className="bg-red-50/90 border border-red-100 p-2.5 rounded-2xl">
                                                    <div className="text-red-700 font-bold text-xl font-['Fredoka']">{adherenceStats.breakdown.notDone}</div>
                                                    <div className="text-[9px] font-bold text-red-600/80 uppercase tracking-wider">Miss</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                                                <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${(adherenceStats.breakdown.done / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(adherenceStats.breakdown.alternate / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(adherenceStats.breakdown.partial / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-red-500 rounded-r-full transition-all duration-500" style={{ width: `${(adherenceStats.breakdown.notDone / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col h-[68vh] bg-white rounded-[32px] shadow-xl overflow-hidden border border-orange-100 relative">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center text-white shadow-md z-10">
                                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mr-3 backdrop-blur-sm border border-white/30 shadow-xs">
                                    <span className="text-2xl">🐼</span>
                                </div>
                                <div>
                                    <div className="font-bold font-['Fredoka'] text-lg leading-tight">Sage Panda</div>
                                    <div className="text-[10px] text-orange-100 font-bold uppercase tracking-widest">Weekly Planning</div>
                                </div>
                                {checkinAssessment && !proposedPlan && (
                                    <button
                                        onClick={generateWeeklyPlan}
                                        disabled={isGeneratingPlan}
                                        className="ml-auto bg-white text-orange-600 hover:bg-orange-50 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center active:scale-95"
                                    >
                                        {isGeneratingPlan ? 'Generating...' : 'Create Plan'} <Sparkles size={13} className="ml-1.5 text-amber-500" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-orange-50/30 pb-24">
                                {checkinMessages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${m.role === 'user'
                                            ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-br-xs'
                                            : 'bg-white text-slate-700 border border-orange-100/80 rounded-bl-xs'
                                            }`}>
                                            <FormattedMessage text={m.text} />
                                        </div>
                                    </div>
                                ))}
                                {loadingChat && (
                                    <div className="flex justify-start">
                                        <div className="bg-white text-orange-600 p-3.5 rounded-2xl rounded-bl-xs text-xs font-bold animate-pulse border border-orange-100 shadow-xs">
                                            Analyzing vibes... 🎋
                                        </div>
                                    </div>
                                )}
                                <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
                            </div>

                            {/* Proposed Plan Overlay Card */}
                            {proposedPlan && (
                                <div className="absolute inset-x-0 bottom-0 top-16 bg-white/98 backdrop-blur-md z-20 p-5 sm:p-6 overflow-y-auto animate-slide-up">
                                    <h3 className="text-2xl font-bold text-emerald-950 mb-1 font-['Fredoka'] text-center">Suggested Schedule</h3>
                                    <p className="text-center text-slate-400 text-[11px] font-bold mb-5 uppercase tracking-wider">Based on your mood & goals</p>

                                    <div className="mb-6">
                                        <PlanDisplay plan={proposedPlan} />
                                    </div>

                                    <div className="flex gap-3 sticky bottom-0 bg-white/95 pt-3 pb-1 backdrop-blur-sm">
                                        <button
                                            onClick={() => setProposedPlan(null)}
                                            className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors active:scale-95"
                                        >
                                            Adjust
                                        </button>
                                        <button
                                            onClick={confirmPlan}
                                            className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
                                        >
                                            Confirm Plan
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-orange-100/80">
                                <div className="flex items-center bg-slate-100/90 rounded-2xl p-1 pr-1.5 border border-slate-200/70 focus-within:border-orange-300 focus-within:bg-white transition-all">
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCheckinMessage()}
                                        placeholder="I'm feeling..."
                                        className="flex-1 bg-transparent p-3 text-sm focus:outline-none text-slate-700 placeholder-slate-400"
                                    />
                                    <button
                                        onClick={handleCheckinMessage}
                                        disabled={!input.trim() || loadingChat}
                                        className="p-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-md disabled:opacity-40 active:scale-95 transition-transform"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'diet' && (
                <div className="animate-slide-up">
                    {!dietPlan && !showDietForm ? (
                        <div className="text-center py-12 px-6 bg-white/90 backdrop-blur-md rounded-[32px] border border-emerald-100/80 shadow-xl relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-emerald-200/60">
                                <ChefHat size={36} className="text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-950 mb-2 font-['Fredoka']">No Diet Plan Yet</h3>
                            <p className="text-slate-600 text-sm mb-6 max-w-xs mx-auto leading-relaxed">Ask Sage Panda to craft a personalized 7-day bamboo-fresh nutrition guide for your goals.</p>
                            <button
                                onClick={() => setShowDietForm(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 px-8 rounded-2xl font-bold shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center mx-auto hover:from-emerald-700 hover:to-teal-700 text-sm"
                            >
                                <Sparkles size={18} className="mr-2" /> CREATE PLAN
                            </button>
                        </div>
                    ) : showDietForm && !dietPlan ? (
                        <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] shadow-xl border border-emerald-100/80">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-['Fredoka']">Diet Preferences</h3>
                                    <p className="text-xs text-slate-400 font-bold">Customize your 7-day nutrition plan</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <ChefHat size={20} />
                                </div>
                            </div>

                            {/* Quick Preset Pills for Mobile Convenience */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {['High Protein', 'Lean Muscle', 'Weight Loss', 'Vegetarian', 'Balanced Macro'].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setDietPreferences(prev => prev ? `${prev}, ${preset}` : preset)}
                                        className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-all active:scale-95"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                                <div>
                                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Diet Type & Goals</label>
                                    <input
                                        className="w-full bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"
                                        placeholder="e.g., High Protein, Vegan, Weight Loss"
                                        value={dietPreferences}
                                        onChange={e => setDietPreferences(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Allergies / Dislikes</label>
                                    <input
                                        className="w-full bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"
                                        placeholder="e.g., Peanuts, Dairy, No Mushrooms"
                                        value={dietAllergies}
                                        onChange={e => setDietAllergies(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Supplements</label>
                                    <input
                                        className="w-full bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"
                                        placeholder="e.g., Whey Protein, Creatine, Multivitamin"
                                        value={dietSupplements}
                                        onChange={e => setDietSupplements(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateDiet}
                                disabled={loadingDiet}
                                className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                            >
                                {loadingDiet ? 'Cooking...' : 'Generate 7-Day Plan'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-emerald-100/80 shadow-xs">
                                <div className="flex items-center gap-2">
                                    <ChefHat size={18} className="text-emerald-600" />
                                    <h3 className="text-lg font-bold text-emerald-950 font-['Fredoka']">Weekly Menu</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setDietPlan(null); setShowDietForm(true); }}
                                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-xl text-xs font-bold transition-all active:scale-95"
                                    >
                                        Edit Prefs
                                    </button>
                                    <button
                                        onClick={handleGenerateDiet}
                                        className="p-2 bg-white rounded-xl shadow-xs border border-emerald-100 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
                                        title="Regenerate Plan"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                                {dietPlan.days && Array.isArray(dietPlan.days) && dietPlan.days.map((day: any, idx: number) => (
                                    <div key={idx} className="bg-white/95 backdrop-blur-sm p-5 rounded-[24px] shadow-sm border border-emerald-100/70 hover:shadow-md transition-shadow">
                                        <h4 className="font-bold text-emerald-900 mb-3.5 flex items-center font-['Fredoka'] text-base">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mr-2 text-emerald-600">
                                                <Calendar size={14} />
                                            </div>
                                            {day.day}
                                        </h4>
                                        <div className="space-y-3">
                                            {day.meals && Array.isArray(day.meals) ? day.meals.map((meal: any, mIdx: number) => (
                                                <div key={mIdx} className="flex justify-between items-start gap-3 border-b border-emerald-50/90 last:border-0 pb-2.5 last:pb-0">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider mb-0.5">{typeof meal === 'string' ? 'Meal' : meal.name}</div>
                                                        <div className="text-slate-800 font-semibold text-sm leading-snug">{typeof meal === 'string' ? meal : meal.food}</div>
                                                    </div>
                                                    {(meal.calories || meal.macros) && (
                                                        <div className="text-right shrink-0 bg-emerald-50/70 px-2.5 py-1 rounded-xl border border-emerald-100/60">
                                                            <div className="text-xs font-bold text-emerald-700">{meal.calories ? `${meal.calories} kcal` : ''}</div>
                                                            <div className="text-[10px] font-medium text-slate-500">{meal.macros || ''}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )) : <div className="text-xs text-slate-400">No meals planned.</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="flex flex-col h-[66vh] glass-panel overflow-hidden animate-slide-up shadow-xl border border-emerald-100/80 rounded-[30px]" style={{ background: 'hsla(140,40%,98%,0.90)' }}>
                    {/* Sage Panda Header */}
                    <div className="p-4 flex items-center justify-between text-white shadow-md" style={{ background: 'linear-gradient(135deg, hsl(145,63%,28%), hsl(160,68%,21%))' }}>
                        <div className="flex items-center">
                            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mr-3 backdrop-blur-sm border border-white/30 shadow-sm">
                                <span className="text-2xl">🐼</span>
                            </div>
                            <div>
                                <div className="font-bold font-['Fredoka'] text-lg leading-tight">Sage Panda</div>
                                <div className="text-xs font-medium flex items-center" style={{ color: 'hsl(140,65%,78%)' }}>
                                    <div className="w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ background: 'hsl(140,75%,58%)' }} />
                                    Always online
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/15">
                            <Sparkles size={12} className="text-amber-300" /> Bamboo AI
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'hsla(140,35%,97%,0.65)' }}>
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[82%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                                    m.role === 'user'
                                        ? 'text-white rounded-br-xs'
                                        : 'rounded-bl-xs border'
                                    }`}
                                    style={m.role === 'user'
                                        ? { background: 'linear-gradient(135deg, hsl(145,62%,32%), hsl(160,65%,25%))' }
                                        : { background: 'hsla(0,0%,100%,0.95)', borderColor: 'hsl(140,40%,88%)', color: 'hsl(140,50%,15%)' }
                                    }
                                >
                                    <FormattedMessage text={m.text} />
                                </div>
                            </div>
                        ))}
                        {loadingChat && (
                            <div className="flex justify-start">
                                <div className="p-3.5 rounded-2xl rounded-bl-xs text-xs font-bold animate-pulse border shadow-xs" style={{ background: 'hsla(0,0%,100%,0.92)', borderColor: 'hsl(140,40%,88%)', color: 'hsl(140,45%,40%)' }}>
                                    Sage is thinking... 🎋
                                </div>
                            </div>
                        )}

                        {/* Pending Action Confirmation Card */}
                        {pendingAction && (
                            <div className="mx-2 sm:mx-4 mb-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-amber-200 animate-slide-up">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-slate-800 flex items-center font-['Fredoka']">
                                        <Sparkles size={16} className="text-amber-500 mr-2 shrink-0" />
                                        {getActionTitle(pendingAction.type)}
                                    </h4>
                                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        Needs Approval
                                    </span>
                                </div>

                                <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 max-h-[250px] overflow-y-auto">
                                    {pendingAction.type === 'SAVE_WORKOUT' && (
                                        <div>
                                            <div className="font-bold text-slate-800">{pendingAction.payload.title}</div>
                                            <div className="text-xs text-slate-500 mb-2">{pendingAction.payload.description || pendingAction.payload.focus || "Custom Workout"}</div>

                                            {/* Warmup */}
                                            {pendingAction.payload.warmup && pendingAction.payload.warmup.length > 0 && (
                                                <div className="mb-2">
                                                    <div className="text-[10px] font-bold text-orange-500 uppercase">Warmup</div>
                                                    <div className="text-xs text-slate-500">
                                                        {pendingAction.payload.warmup.join(', ')}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Exercises */}
                                            <div className="space-y-1">
                                                {pendingAction.payload.exercises?.map((e: any, idx: number) => (
                                                    <div key={idx} className="text-xs flex justify-between border-b border-slate-100 pb-1">
                                                        <span>{e.name}</span>
                                                        <span className="font-mono text-slate-400">
                                                            {e.defaultSets || e.sets?.length || 3} × {e.defaultReps || e.reps || '10'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {!pendingAction.payload.exercises && <div className="text-xs text-slate-400">No exercises listed.</div>}
                                            </div>

                                            {/* Cooldown */}
                                            {pendingAction.payload.cooldown && pendingAction.payload.cooldown.length > 0 && (
                                                <div className="mt-2">
                                                    <div className="text-[10px] font-bold text-blue-500 uppercase">Cooldown</div>
                                                    <div className="text-xs text-slate-500">
                                                        {pendingAction.payload.cooldown.join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {pendingAction.type === 'SAVE_DIET' && (
                                        <div className="space-y-2">
                                            {pendingAction.payload.days?.map((day: any, idx: number) => (
                                                <div key={idx} className="border-b border-slate-100 pb-2 last:border-0">
                                                    <div className="font-bold text-emerald-700 text-xs">{day.day}</div>
                                                    <div className="space-y-1">
                                                        {day.meals?.map((m: any, mIdx: number) => (
                                                            <div key={mIdx} className="text-xs">
                                                                <span className="font-semibold text-slate-500">{typeof m === 'string' ? 'Meal' : m.name}:</span>{' '}
                                                                <span className="text-slate-600">{typeof m === 'string' ? m : m.food}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {!pendingAction.payload.days && <div className="text-red-500 text-xs">Error: No diet data found.</div>}
                                        </div>
                                    )}

                                    {pendingAction.type === 'SAVE_SCHEDULE' && (
                                        <PlanDisplay plan={pendingAction.payload} />
                                    )}
                                </div>

                                {actionStatus === 'success' ? (
                                    <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl text-center font-bold flex items-center justify-center">
                                        <CheckCircle2 size={18} className="mr-2" /> Saved!
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={discardAction}
                                            disabled={actionStatus === 'saving'}
                                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors active:scale-95"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={confirmAction}
                                            disabled={actionStatus === 'saving'}
                                            className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center"
                                        >
                                            {actionStatus === 'saving' ? 'Saving...' : 'Confirm & Save'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div id="chat-bottom" />
                    </div>

                    {/* Quick Prompt Chips & Floating Glass Message Bar */}
                    <div className="p-3 border-t" style={{ background: 'hsla(140,40%,97%,0.95)', backdropFilter: 'blur(12px)', borderColor: 'hsla(140,40%,85%,0.6)' }}>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-1">
                            {[
                                '🎋 20-min Upper Body',
                                '🥗 High-Protein Snack',
                                '🧘 Mobility Stretch',
                                '⚡ Boost Recovery'
                            ].map((chip) => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setInput(chip.replace(/^[^\s]+\s/, ''))}
                                    className="shrink-0 text-[11px] font-bold px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs transition-all active:scale-95"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center rounded-2xl p-1 pr-1.5 border shadow-inner" style={{ background: 'hsla(140,45%,94%,0.85)', borderColor: 'hsl(140,40%,82%)' }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Ask Sage for advice..."
                                className="flex-1 bg-transparent p-3 text-sm font-medium focus:outline-none"
                                style={{ color: 'hsl(140,50%,15%)', caretColor: 'hsl(140,60%,40%)' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loadingChat}
                                className="p-2.5 rounded-xl shadow-md disabled:opacity-40 active:scale-95 transition-all"
                                style={{ background: 'linear-gradient(135deg, hsl(145,62%,38%), hsl(160,68%,30%))' }}
                            >
                                <Send size={18} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
});
