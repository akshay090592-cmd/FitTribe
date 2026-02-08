import React, { useState, useEffect } from 'react';
import { UserProfile, CustomChallenge } from '../types';
import { X, Calendar, Target, Award } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challenge: CustomChallenge) => void;
}

export const CreateChallengeModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('');

  // Update target based on type change
  useEffect(() => {
    if (type === 'daily') {
        setTarget(1);
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const endDate = new Date();

    if (type === 'daily') endDate.setDate(now.getDate() + 1); // Until end of today effectively
    if (type === 'weekly') endDate.setDate(now.getDate() + 7);
    if (type === 'monthly') endDate.setDate(now.getDate() + 30);

    // Reset time to end of day for cleaner expiration
    endDate.setHours(23, 59, 59, 999);

    const newChallenge: CustomChallenge = {
      id: crypto.randomUUID(),
      title,
      type,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      target: Number(target),
      progress: 0,
      unit: type === 'daily' ? undefined : (unit || 'times'),
      completed: false
    };

    onSave(newChallenge);
    onClose();
  };

  const getXpReward = () => {
    if (type === 'daily') return 10;
    if (type === 'weekly') return 50;
    return 300;
  };

  const getExample = () => {
    if (type === 'daily') return "e.g. Walk 5km today, Drink 2L water";
    if (type === 'weekly') return "e.g. Run 3 times this week, Gym 4 days";
    return "e.g. Do 1000 pushups, Meditate 15 times";
  };

  const getTargetLabel = () => {
      if (type === 'daily') return "Target";
      if (type === 'weekly') return "Days / Times per Week";
      return "Days / Times per Month";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-scale-up">
        <div className="bg-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold font-['Fredoka']">Create Challenge</h2>
          <p className="opacity-90 text-sm">Set your own goal and earn XP!</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
             {['daily', 'weekly', 'monthly'].map((t) => (
               <button
                 key={t}
                 type="button"
                 onClick={() => setType(t as any)}
                 className={`p-3 rounded-xl border-2 font-bold text-sm capitalize transition-all ${
                   type === t
                     ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                     : 'border-slate-100 text-slate-400 hover:border-emerald-200'
                 }`}
               >
                 {t}
               </button>
             ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Challenge Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getExample()}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
            />
          </div>

          {type !== 'daily' && (
            <div className="flex gap-4 animate-fade-in">
              <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-700 mb-2">{getTargetLabel()}</label>
                 <div className="relative">
                   <Target className="absolute left-3 top-3.5 text-slate-400" size={18} />
                   <input
                     type="number"
                     min="1"
                     required
                     value={target}
                     onChange={(e) => setTarget(parseInt(e.target.value))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
                   />
                 </div>
              </div>
              <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-700 mb-2">Unit (Optional)</label>
                 <input
                   type="text"
                   value={unit}
                   onChange={(e) => setUnit(e.target.value)}
                   placeholder="e.g. days, reps"
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
                 />
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-xl flex items-center text-yellow-800 border border-yellow-100">
             <Award className="mr-3 text-yellow-600" size={24} />
             <div>
               <div className="font-bold text-sm">Reward</div>
               <div className="text-xs opacity-80">Completing this {type} challenge earns <span className="font-bold">{getXpReward()} XP</span></div>
             </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform hover:brightness-110"
          >
            Start Challenge
          </button>
        </form>
      </div>
    </div>
  );
};
