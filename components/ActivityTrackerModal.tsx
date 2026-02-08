import React, { useState, useEffect } from 'react';
import { X, Flame, Clock, Activity, Save, Star, Trash2, Plus, Camera, CheckCircle, Heart } from 'lucide-react';
import { ACTIVITIES_LIST, MET_VALUES, WELLBEING_ACTIVITIES } from '../constants';
import { UserProfile, WorkoutType, WorkoutLog } from '../types';
import { calculateBMI } from '../utils/profileUtils';
import { calculateCalories } from '../utils/calorieUtils';
import { compressImage } from '../utils/imageUtils';
import { saveTribePhoto } from '../utils/storage';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: WorkoutLog, photo?: string) => void;
    currentUser: string;
    userProfile: UserProfile | null;
    mode?: 'fitness' | 'wellbeing';
}

interface SavedActivity {
    id: string;
    name: string; // User defined name e.g. "Morning Yoga"
    activity: string;
    duration: number;
    intensity: number;
}

export const ActivityTrackerModal: React.FC<Props> = ({ isOpen, onClose, onSave, currentUser, userProfile, mode = 'fitness' }) => {
    const [activity, setActivity] = useState<string>(mode === 'wellbeing' ? WELLBEING_ACTIVITIES[0] : 'Walking');
    const [duration, setDuration] = useState<number>(30);
    const [intensity, setIntensity] = useState<number>(5);
    const [customOtherActivity, setCustomOtherActivity] = useState<string>('');
    const [calories, setCalories] = useState<number>(0);
    const [vibes, setVibes] = useState<number>(0);
    const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
    const [isSavingFavorite, setIsSavingFavorite] = useState(false);
    const [newFavoriteName, setNewFavoriteName] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoUploaded, setPhotoUploaded] = useState(false);
    const [tribePhoto, setTribePhoto] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset or pre-fill defaults
            setActivity(mode === 'wellbeing' ? WELLBEING_ACTIVITIES[0] : 'Walking');
            setDuration(30);
            setIntensity(5);
            setCustomOtherActivity('');
            setIsSavingFavorite(false);
            setNewFavoriteName('');
            setPhotoUploaded(false);
            setTribePhoto(null);

            // Load saved activities
            const saved = localStorage.getItem(`saved_activities_${currentUser}`);
            if (saved) {
                try {
                    setSavedActivities(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse saved activities", e);
                }
            }

            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (!userProfile) return;

        if (mode === 'wellbeing') {
            const vibeScore = Math.round(duration * (intensity / 5));
            setVibes(vibeScore);
            setCalories(0);
        } else {
            const baseMet = MET_VALUES[activity] || 5;
            // Adjust MET slightly by intensity
            // Intensity 1-10. 5 is standard.
            // Range 0.8x to 1.2x seems reasonable for a slider without changing the activity name
            const intensityMultiplier = 0.8 + (intensity / 10) * 0.4;
            const adjustedMet = baseMet * intensityMultiplier;

            const burned = calculateCalories(userProfile, adjustedMet, duration);
            setCalories(burned);
            setVibes(0);
        }

    }, [activity, duration, intensity, userProfile]);

    const handleSaveFavorite = () => {
        if (!newFavoriteName.trim()) return;

        const newFavorite: SavedActivity = {
            id: crypto.randomUUID(),
            name: newFavoriteName.trim(),
            activity,
            duration,
            intensity
        };

        const updated = [...savedActivities, newFavorite];
        setSavedActivities(updated);
        localStorage.setItem(`saved_activities_${currentUser}`, JSON.stringify(updated));

        setIsSavingFavorite(false);
        setNewFavoriteName('');
    };

    const handleDeleteFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedActivities.filter(sa => sa.id !== id);
        setSavedActivities(updated);
        localStorage.setItem(`saved_activities_${currentUser}`, JSON.stringify(updated));
    };

    const loadFavorite = (fav: SavedActivity) => {
        setActivity(fav.activity);
        setDuration(fav.duration);
        setIntensity(fav.intensity);
    };

    const handleSubmit = async () => {
        // Logic to check for commitment log to replace
        let logId: string = crypto.randomUUID();

        try {
            // We need to check if there is a commitment log to replace
            // This requires importing getUserLogs dynamically to avoid circular dependencies if any
            const { getUserLogs } = await import('../utils/storage');
            const allLogs = await getUserLogs(currentUser);
            const todayString = new Date().toDateString();

            const commitLog = allLogs.find(l => {
                const d = new Date(l.date);
                return l.type === 'COMMITMENT' && d.toDateString() === todayString;
            });

            if (commitLog) {
                logId = commitLog.id; // Reuse existing commitment ID
            }
        } catch (error) {
            console.error("Error checking for commitment logs", error);
        }

        const log: WorkoutLog = {
            id: logId as any,
            date: new Date().toISOString(),
            user: currentUser as any,
            type: WorkoutType.CUSTOM,
            exercises: [], // No gym exercises
            durationMinutes: duration,
            calories: calories,
            vibes: vibes > 0 ? vibes : undefined,
            image_data: tribePhoto || undefined,
            customActivity: (activity === 'Other' && customOtherActivity) ? customOtherActivity : activity,
            intensity: intensity
        };
        onSave(log, tribePhoto || undefined);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-scale-up">
                <div className={`${mode === 'wellbeing' ? 'bg-pink-500' : 'bg-emerald-600'} p-6 flex justify-between items-center relative overflow-hidden flex-shrink-0`}>
                    <div className="absolute inset-0 bg-[url('/assets/jungle_bg_pattern.webp')] opacity-10"></div>
                    <h2 className="text-2xl font-bold text-white font-['Fredoka'] relative z-10 flex items-center">
                        {mode === 'wellbeing' ? <Heart className="mr-2" /> : <Activity className="mr-2" />} {mode === 'wellbeing' ? 'Log Wellbeing' : 'Track Activity'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all active:scale-95 relative z-10">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Saved Favorites Section */}
                    {savedActivities.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center">
                                <Star size={12} className="mr-1 text-amber-400 fill-current" /> Favorites
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {savedActivities.map(fav => (
                                    <button
                                        key={fav.id}
                                        onClick={() => loadFavorite(fav)}
                                        className="flex-shrink-0 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl px-3 py-2 flex items-center transition-all active:scale-95 group"
                                    >
                                        <div className="text-left mr-2">
                                            <div className={`text-xs font-bold ${mode === 'wellbeing' ? 'text-pink-800' : 'text-emerald-800'}`}>{fav.name}</div>
                                            <div className={`text-[10px] ${mode === 'wellbeing' ? 'text-pink-600' : 'text-emerald-600'}`}>{fav.activity} • {fav.duration}m</div>
                                        </div>
                                        <div
                                            onClick={(e) => handleDeleteFavorite(fav.id, e)}
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-200 hover:text-emerald-700 transition-colors"
                                        >
                                            <X size={12} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity Selector & Save Favorite */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Activity</label>
                            {!isSavingFavorite ? (
                                <button
                                    onClick={() => setIsSavingFavorite(true)}
                                    className="text-xs font-bold text-emerald-500 hover:text-emerald-700 flex items-center transition-colors"
                                >
                                    <Star size={14} className="mr-1" /> Save as Favorite
                                </button>
                            ) : (
                                <div className="flex items-center animate-fade-in-right">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Name (e.g. Daily Walk)"
                                        value={newFavoriteName}
                                        onChange={(e) => setNewFavoriteName(e.target.value)}
                                        className="text-xs border border-emerald-300 rounded-lg px-2 py-1 mr-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-32"
                                    />
                                    <button
                                        onClick={handleSaveFavorite}
                                        disabled={!newFavoriteName.trim()}
                                        className="bg-emerald-500 text-white rounded-lg p-1 hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <button
                                        onClick={() => setIsSavingFavorite(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1 ml-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <select
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 ${mode === 'wellbeing' ? 'focus:ring-pink-400' : 'focus:ring-emerald-400'}`}
                        >
                            {(mode === 'wellbeing' ? WELLBEING_ACTIVITIES : ACTIVITIES_LIST).map(act => (
                                <option key={act} value={act}>
                                    {act}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activity === 'Other' && (
                        <div className="space-y-2 animate-fade-in">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Custom Activity Name</label>
                            <input
                                type="text"
                                value={customOtherActivity}
                                onChange={(e) => setCustomOtherActivity(e.target.value)}
                                placeholder="e.g. Pottery, Surfing..."
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 ${mode === 'wellbeing' ? 'focus:ring-pink-400' : 'focus:ring-emerald-400'}`}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        {/* Duration Input */}
                        <div className="space-y-2">
                            <label htmlFor="duration-input" className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center">
                                <Clock size={16} className="mr-1 text-emerald-500" /> Duration
                            </label>
                            <div className="flex items-center">
                                <input
                                    id="duration-input"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 ${mode === 'wellbeing' ? 'focus:ring-pink-400' : 'focus:ring-emerald-400'}`}
                                />
                                <span className="ml-2 text-sm font-bold text-slate-400">min</span>
                            </div>
                        </div>

                        {/* Calories or Vibes Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center">
                                {mode === 'wellbeing' ? (
                                    <><Heart size={16} className="mr-1 text-pink-500" /> Positive Vibes</>
                                ) : (
                                    <><Flame size={16} className="mr-1 text-orange-500" /> Burn</>
                                )}
                            </label>
                            <div className={`${mode === 'wellbeing' ? 'bg-pink-50 border-pink-100' : 'bg-orange-50 border-orange-100'} border rounded-xl px-4 py-3 flex items-center justify-center`}>
                                <span className={`text-2xl font-bold ${mode === 'wellbeing' ? 'text-pink-500' : 'text-orange-500'} font-['Fredoka']`}>
                                    {mode === 'wellbeing' ? vibes : calories}
                                </span>
                                <span className={`ml-1 text-xs font-bold ${mode === 'wellbeing' ? 'text-pink-400' : 'text-orange-400'}`}>
                                    {mode === 'wellbeing' ? 'vibes' : 'kcal'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Intensity Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label htmlFor="intensity-input" className="text-sm font-bold text-slate-700 uppercase tracking-wide">Intensity</label>
                            <span className={`text-xs font-bold ${mode === 'wellbeing' ? 'text-pink-600 bg-pink-100' : 'text-emerald-600 bg-emerald-100'} px-2 py-0.5 rounded-full`}>Level {intensity}</span>
                        </div>
                        <input
                            id="intensity-input"
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            className={`w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer ${mode === 'wellbeing' ? 'accent-pink-500' : 'accent-emerald-500'}`}
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                            <span>Easy</span>
                            <span>Moderate</span>
                            <span>Extreme</span>
                        </div>
                    </div>

                    {/* Victory Photo (Optional) */}
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                        <h3 className="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-2 flex items-center justify-center">
                            <Camera size={14} className="mr-2" /> Share Victory Selfie
                        </h3>

                        {!photoUploaded ? (
                            <label className={`block w-full cursor-pointer transition-all active:scale-95 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files[0] && userProfile) {
                                            setUploadingPhoto(true);
                                            try {
                                                const base64 = await compressImage(e.target.files[0]);
                                                await saveTribePhoto(base64, userProfile);
                                                setTribePhoto(base64);
                                                setPhotoUploaded(true);
                                            } catch (err) {
                                                console.error(err);
                                                alert("Failed to upload photo");
                                            } finally {
                                                setUploadingPhoto(false);
                                            }
                                        }
                                    }}
                                />
                                <div className="bg-white hover:bg-emerald-50 text-emerald-600 py-2 px-4 rounded-xl font-bold border border-emerald-200 shadow-sm flex items-center justify-center text-sm">
                                    {uploadingPhoto ? 'Uploading...' : 'Take Photo (Tribe Only)'}
                                </div>
                            </label>
                        ) : (
                            <div className="bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold flex items-center justify-center text-sm border border-emerald-200">
                                <CheckCircle size={16} className="mr-2" /> Photo Shared!
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSubmit}
                        className={`w-full ${mode === 'wellbeing' ? 'bg-pink-500 shadow-pink-200' : 'bg-emerald-600 shadow-emerald-200'} text-white py-4 rounded-xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center hover:brightness-110`}
                    >
                        <Save size={20} className="mr-2" /> {mode === 'wellbeing' ? 'Log Activity' : 'Log Workout'}
                    </button>

                </div>
            </div>
        </div>
    );
};
