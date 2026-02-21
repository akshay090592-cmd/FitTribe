import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, WeeklyPlan, PlanStatus } from '../types';
import { AICoachService } from '../services/aiCoach';
import { getUserDiet, saveUserDiet, getUserPlans, saveUserPlan, getUserLogs, saveCustomWorkoutPlan } from '../utils/storage';
import { MessageSquare, Calendar, Sparkles, Send, ChefHat, RefreshCw, CheckCircle2, Circle, Shuffle, MinusCircle, XCircle, TrendingUp, Info } from 'lucide-react';

import { WorkoutLog } from '../types';

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
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
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
                        <span>{day.day?.substring(0, 3) || (day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }) : '???')}</span>
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

export const CoachView: React.FC<Props> = ({ userProfile, lastWorkout, onFetching }) => {
    const [activeTab, setActiveTab] = useState<'diet' | 'chat' | 'checkin'>('checkin');
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
        { role: 'model', text: `Hello ${userProfile.displayName}! I am Sage Panda, your AI fitness coach. 🐼\n\nI can help you with:\n• **Custom Workouts** (e.g., "Create a leg day workout")\n• **Diet Plans** (personalized meal plans)\n• **Weekly Schedules** (plan your entire week)\n\nWhat would you like to work on today?` }
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


            const logs = await getUserLogs(userProfile.displayName);
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
        const total = weeklyPlan.schedule.length;
        const done = weeklyPlan.schedule.filter(s => s.status === 'done').length;
        const alternate = weeklyPlan.schedule.filter(s => s.status === 'alternate').length;
        const partial = weeklyPlan.schedule.filter(s => s.status === 'partial').length;
        const notDone = weeklyPlan.schedule.filter(s => s.status === 'not_done').length;
        const pending = weeklyPlan.schedule.filter(s => !s.status).length;

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
                    date: new Date().toISOString(), // Fallback date
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
        const plan = await AICoachService.generatePlanFromContext(userProfile, checkinAssessment, weeklyPlan || undefined);
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
        <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 animate-fade-in relative z-10">

            {/* Tabs */}
            <div className="flex bg-white/20 backdrop-blur-md p-1 rounded-2xl mb-6 shadow-lg border border-white/20">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-md' : 'text-emerald-900 hover:bg-white/10'}`}
                >
                    <MessageSquare size={18} className="mr-2" /> AI Coach
                </button>
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${activeTab === 'checkin' ? 'bg-orange-500 text-white shadow-md' : 'text-emerald-900 hover:bg-white/10'}`}
                >
                    <Calendar size={18} className="mr-2" /> Schedule
                </button>
                <button
                    onClick={() => setActiveTab('diet')}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${activeTab === 'diet' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-900 hover:bg-white/10'}`}
                >
                    <ChefHat size={18} className="mr-2" /> Nutrition
                </button>
            </div>

            {activeTab === 'checkin' && (
                <div className="animate-slide-up space-y-4">
                    {!isCheckinActive ? (
                        <>
                            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h2 className="text-3xl font-bold font-['Fredoka'] mb-2">New Week, New Plan</h2>
                                <p className="text-orange-100 mb-6 font-medium">Let's check your vibe and build a custom schedule.</p>
                                <button
                                    onClick={startCheckin}
                                    className="bg-white text-orange-600 font-bold py-4 px-8 rounded-full shadow-lg active:scale-95 transition-transform flex items-center mx-auto"
                                >
                                    Start Check-in <Sparkles size={20} className="ml-2" />
                                </button>
                            </div>

                            {weeklyPlan && (
                                <div className="animate-slide-up space-y-4">
                                    <div className="flex justify-between items-end ml-2">
                                        <h3 className="text-xl font-bold text-slate-800 font-['Fredoka']">Current Weekly Plan</h3>
                                        {adherenceStats && (
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Adherence</div>
                                                <div className="text-lg font-bold text-emerald-600 font-['Fredoka']">{adherenceStats.adherence}%</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center px-1">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
                                            <Info size={10} className="mr-1 text-emerald-500" /> Tap icons to change state
                                        </div>
                                    </div>

                                    <PlanDisplay plan={weeklyPlan} editable onStatusChange={handleStatusChange} />

                                    {/* Legend */}
                                    <div className="bg-white/50 p-3 rounded-2xl border border-slate-100 flex flex-wrap gap-x-4 gap-y-2 justify-center shadow-sm">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                            <CheckCircle2 size={12} className="text-emerald-500" /> Done
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                            <Shuffle size={12} className="text-blue-500" /> Alternate Day
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                            <MinusCircle size={12} className="text-orange-500" /> Partial
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                            <XCircle size={12} className="text-red-500" /> Not Done
                                        </div>
                                    </div>

                                    {adherenceStats && (
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center mb-3">
                                                <TrendingUp size={16} className="text-emerald-500 mr-2" />
                                                <span className="text-xs font-bold text-slate-700 uppercase">Weekly Adherence Stats</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div className="bg-emerald-50 p-2 rounded-xl">
                                                    <div className="text-emerald-600 font-bold text-lg">{adherenceStats.breakdown.done}</div>
                                                    <div className="text-[8px] font-bold text-emerald-400 uppercase">Done</div>
                                                </div>
                                                <div className="bg-blue-50 p-2 rounded-xl">
                                                    <div className="text-blue-600 font-bold text-lg">{adherenceStats.breakdown.alternate}</div>
                                                    <div className="text-[8px] font-bold text-blue-400 uppercase">Alt</div>
                                                </div>
                                                <div className="bg-orange-50 p-2 rounded-xl">
                                                    <div className="text-orange-600 font-bold text-lg">{adherenceStats.breakdown.partial}</div>
                                                    <div className="text-[8px] font-bold text-orange-400 uppercase">Part</div>
                                                </div>
                                                <div className="bg-red-50 p-2 rounded-xl">
                                                    <div className="text-red-600 font-bold text-lg">{adherenceStats.breakdown.notDone}</div>
                                                    <div className="text-[8px] font-bold text-red-400 uppercase">Miss</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(adherenceStats.breakdown.done / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-blue-500" style={{ width: `${(adherenceStats.breakdown.alternate / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-orange-500" style={{ width: `${(adherenceStats.breakdown.partial / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                                <div className="h-full bg-red-500" style={{ width: `${(adherenceStats.breakdown.notDone / (weeklyPlan.schedule?.length || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col h-[65vh] bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-100 relative">
                            <div className="bg-orange-500 p-4 flex items-center text-white shadow-md z-10">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                                    <span className="text-xl">🐼</span>
                                </div>
                                <div>
                                    <div className="font-bold font-['Fredoka']">Sage Panda</div>
                                    <div className="text-xs text-orange-200 font-bold uppercase tracking-wider">Weekly Planning</div>
                                </div>
                                {checkinAssessment && !proposedPlan && (
                                    <button
                                        onClick={generateWeeklyPlan}
                                        disabled={isGeneratingPlan}
                                        className="ml-auto bg-white/20 hover:bg-white/30 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/30 transition-all flex items-center"
                                    >
                                        {isGeneratingPlan ? 'Generating...' : 'Create Plan'} <Sparkles size={12} className="ml-1" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-20">
                                {checkinMessages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                            ? 'bg-orange-500 text-white rounded-br-none'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                            }`}>
                                            <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                        </div>
                                    </div>
                                ))}
                                {loadingChat && (
                                    <div className="flex justify-start">
                                        <div className="bg-white text-slate-400 p-3 rounded-2xl rounded-bl-none text-xs font-bold animate-pulse border border-slate-100">
                                            Analyzing vibes...
                                        </div>
                                    </div>
                                )}
                                <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
                            </div>

                            {/* Proposed Plan Overlay Card */}
                            {proposedPlan && (
                                <div className="absolute inset-x-0 bottom-0 top-16 bg-white/95 backdrop-blur-sm z-20 p-6 overflow-y-auto animate-slide-up">
                                    <h3 className="text-2xl font-bold text-emerald-900 mb-2 font-['Fredoka'] text-center">Suggested Schedule</h3>
                                    <p className="text-center text-slate-500 text-xs font-bold mb-6 uppercase tracking-wider">Based on your mood & goals</p>

                                    <div className="mb-8">
                                        <PlanDisplay plan={proposedPlan} />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setProposedPlan(null)}
                                            className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors"
                                        >
                                            Adjust
                                        </button>
                                        <button
                                            onClick={confirmPlan}
                                            className="flex-1 py-4 rounded-2xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                                        >
                                            Confirm Plan
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-100">
                                <div className="flex items-center bg-slate-100 rounded-2xl p-1 pr-2">
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
                                        className="p-2 bg-orange-500 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-transform"
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
                        <div className="text-center py-10 bg-emerald-900/5 backdrop-blur-sm rounded-[32px] border border-emerald-100/50 shadow-xl">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <ChefHat size={32} className="text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-900 mb-2 font-['Fredoka']">No Diet Plan Yet</h3>
                            <p className="text-emerald-800/70 mb-6 px-6">Ask Sage Panda to create a personalized meal plan for you.</p>
                            <button
                                onClick={() => setShowDietForm(true)}
                                className="bg-emerald-600 text-white py-3 px-8 rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center mx-auto hover:bg-emerald-700"
                            >
                                <Sparkles size={18} className="mr-2" /> CREATE PLAN
                            </button>
                        </div>
                    ) : showDietForm && !dietPlan ? (
                        <div className="bg-white p-6 rounded-[32px] shadow-xl border border-emerald-50">
                            <h3 className="text-xl font-bold text-emerald-900 mb-4 font-['Fredoka']">Diet Preferences</h3>

                            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                                <div>
                                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Diet Type & Goals</label>
                                    <input
                                        className="w-full bg-emerald-50 border-emerald-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                                        placeholder="e.g., High Protein, Vegan, Weight Loss"
                                        value={dietPreferences}
                                        onChange={e => setDietPreferences(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Allergies / Dislikes</label>
                                    <input
                                        className="w-full bg-emerald-50 border-emerald-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                                        placeholder="e.g., Peanuts, Dairy, No Mushrooms"
                                        value={dietAllergies}
                                        onChange={e => setDietAllergies(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Supplements</label>
                                    <input
                                        className="w-full bg-emerald-50 border-emerald-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                                        placeholder="e.g., Whey Protein, Creatine, Multivitamin"
                                        value={dietSupplements}
                                        onChange={e => setDietSupplements(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateDiet}
                                disabled={loadingDiet}
                                className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {loadingDiet ? 'Cooking...' : 'Generate 7-Day Plan'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-emerald-900 ml-2 font-['Fredoka']">Weekly Menu</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => { setDietPlan(null); setShowDietForm(true); }} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200">Edit Prefs</button>
                                    <button onClick={handleGenerateDiet} className="p-2 bg-white rounded-full shadow text-emerald-600 hover:bg-emerald-50"><RefreshCw size={16} /></button>
                                </div>
                            </div>
                            {dietPlan.days && Array.isArray(dietPlan.days) && dietPlan.days.map((day: any, idx: number) => (
                                <div key={idx} className="bg-white/90 backdrop-blur-sm p-5 rounded-[24px] shadow-sm border border-emerald-50/50">
                                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center"><Calendar size={16} className="mr-2 text-emerald-500" /> {day.day}</h4>
                                    <div className="space-y-3">
                                        {day.meals && Array.isArray(day.meals) ? day.meals.map((meal: any, mIdx: number) => (
                                            <div key={mIdx} className="flex justify-between items-start border-b border-emerald-50 last:border-0 pb-2 last:pb-0">
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{typeof meal === 'string' ? 'Meal' : meal.name}</div>
                                                    <div className="text-slate-800 font-medium text-sm">{typeof meal === 'string' ? meal : meal.food}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-emerald-600">{meal.calories ? `${meal.calories} kcal` : ''}</div>
                                                    <div className="text-[10px] text-slate-400">{meal.macros || ''}</div>
                                                </div>
                                            </div>
                                        )) : <div className="text-xs text-slate-400">No meals planned.</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
            }

            {
                activeTab === 'chat' && (
                    <div className="flex flex-col h-[60vh] bg-emerald-900/5 backdrop-blur-md rounded-[32px] shadow-xl overflow-hidden border border-white/20 animate-slide-up">
                        <div className="bg-emerald-600 p-4 flex items-center text-white shadow-md">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                                <span className="text-xl">🐼</span>
                            </div>
                            <div>
                                <div className="font-bold font-['Fredoka']">Sage Panda</div>
                                <div className="text-xs text-emerald-100 font-medium">Always online</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {messages.map((m, idx) => (
                                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-br-none'
                                        : 'bg-white text-emerald-900 border border-emerald-100 rounded-bl-none'
                                        }`}>
                                        <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                    </div>
                                </div>
                            ))}
                            {loadingChat && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-slate-400 p-3 rounded-2xl rounded-bl-none text-xs font-bold animate-pulse border border-slate-100">
                                        Sage is thinking...
                                    </div>
                                </div>
                            )}

                            {/* Pending Action Confirmation Card */}
                            {pendingAction && (
                                <div className="mx-4 mb-4 bg-white p-4 rounded-2xl shadow-xl border-2 border-orange-100 animate-slide-up">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-slate-800 flex items-center">
                                            <Sparkles size={16} className="text-orange-500 mr-2" />
                                            {getActionTitle(pendingAction.type)}
                                        </h4>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            Needs Approval
                                        </span>
                                    </div>

                                    <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-[250px] overflow-y-auto">
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
                                                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors"
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

                        <div className="p-3 bg-white/80 backdrop-blur-md border-t border-emerald-100">
                            <div className="flex items-center bg-emerald-50 rounded-2xl p-1 pr-2 border border-emerald-100">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder="Ask for advice..."
                                    className="flex-1 bg-transparent p-3 text-sm focus:outline-none text-emerald-900 placeholder-emerald-400"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loadingChat}
                                    className="p-2 bg-emerald-600 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-transform"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};
