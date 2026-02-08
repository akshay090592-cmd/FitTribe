import React from 'react';
import { Quest } from '../types';
import { CheckCircle2, Circle, Dumbbell, Heart, Gift, GlassWater, Apple, Activity, Footprints, Moon, Lock, User as UserIcon, Users } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  quests: Quest[];
  onboardingQuests?: Quest[];
  onManualComplete: (questId: string) => void;
  loading?: boolean;
  hasLoggedWorkouts?: boolean;
}

const QuestIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const icons: Record<string, any> = {
    Dumbbell,
    Heart,
    Gift,
    GlassWater,
    Apple,
    Activity,
    Footprints,
    Moon,
    User: UserIcon,
    Users
  };
  const Icon = icons[name] || Activity;
  return <Icon size={size} className={className} />;
};

const QuestItem: React.FC<{ quest: Quest, onManualComplete: (id: string) => void, theme?: 'emerald' | 'indigo' }> = ({ quest, onManualComplete, theme = 'emerald' }) => {
  const isManual = quest.type === 'manual';

  const colors = theme === 'indigo' ? {
    bgCompleted: 'bg-indigo-50 border-indigo-100',
    textCompleted: 'text-indigo-800',
    iconCompletedBg: 'bg-indigo-200 text-indigo-700',
    hoverBorder: 'hover:border-indigo-200',
    progressBg: 'bg-indigo-100/30',
    rewardBg: 'bg-indigo-100 text-indigo-600',
    checkColor: 'text-indigo-500',
    radioHover: 'group-hover:border-indigo-400'
  } : {
    bgCompleted: 'bg-emerald-50 border-emerald-100',
    textCompleted: 'text-emerald-800',
    iconCompletedBg: 'bg-emerald-200 text-emerald-700',
    hoverBorder: 'hover:border-emerald-200',
    progressBg: 'bg-emerald-100/30',
    rewardBg: 'bg-emerald-100 text-emerald-600',
    checkColor: 'text-emerald-500',
    radioHover: 'group-hover:border-emerald-400'
  };

  return (
    <div
      onClick={() => isManual && !quest.completed ? onManualComplete(quest.id) : null}
      className={`flex items-center p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${quest.completed
        ? `${colors.bgCompleted} opacity-80`
        : isManual
          ? `bg-white border-slate-100 ${colors.hoverBorder} hover:bg-slate-50 cursor-pointer active:scale-[0.98] shadow-sm`
          : 'bg-slate-50/50 border-slate-100'
        }`}
    >
      {/* Progress Bar Background for non-manual */}
      {!quest.completed && !isManual && (
        <div
          className={`absolute left-0 top-0 bottom-0 ${colors.progressBg} transition-all duration-500`}
          style={{ width: `${(quest.progress / quest.target) * 100}%` }}
        ></div>
      )}

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 transition-colors ${quest.completed ? colors.iconCompletedBg : 'bg-slate-100 text-slate-400'
        }`}>
        <QuestIcon name={quest.icon} />
      </div>

      <div className="flex-1 min-w-0 mr-2 relative z-10">
        <h4 className={`text-sm font-bold truncate ${quest.completed ? `${colors.textCompleted} line-through` : 'text-slate-700'}`}>
          {quest.title}
        </h4>
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-medium truncate pr-2">{quest.description}</p>
          {!quest.completed && (
            <div className={`text-[10px] font-bold ${colors.rewardBg} px-1.5 py-0.5 rounded-md whitespace-nowrap`}>
              +{quest.rewardXp} XP
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10">
        {quest.completed ? (
          <CheckCircle2 className={`${colors.checkColor} animate-scale-up`} size={24} />
        ) : isManual ? (
          <div className={`w-6 h-6 rounded-full border-2 border-slate-300 ${colors.radioHover} transition-colors`}></div>
        ) : (
          <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
            {quest.progress}/{quest.target}
          </span>
        )}
      </div>
    </div>
  );
};

export const QuestBoard: React.FC<Props> = ({ quests, onboardingQuests, onManualComplete, loading = false, hasLoggedWorkouts = false }) => {
  if (loading) return <div className="animate-pulse h-32 bg-emerald-50 rounded-[24px] w-full"></div>;

  const completedCount = quests.filter(q => q.completed).length;
  const allComplete = completedCount === quests.length && quests.length > 0;

  const onboardingCompletedCount = onboardingQuests?.filter(q => q.completed).length || 0;
  const showOnboarding = !hasLoggedWorkouts && onboardingQuests && onboardingQuests.length > 0 && onboardingCompletedCount < onboardingQuests.length;

  return (
    <>
      {showOnboarding && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-5 mb-6 relative overflow-hidden group">
          {/* Header for Onboarding */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h3 className="font-bold text-indigo-900 text-lg font-['Fredoka'] flex items-center">
                New Recruit Mission
              </h3>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                {onboardingCompletedCount}/{onboardingQuests!.length} Completed
              </p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            {onboardingQuests!.map(quest => (
              <QuestItem key={quest.id} quest={quest} onManualComplete={onManualComplete} theme="indigo" />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-[24px] shadow-lg shadow-emerald-100/50 border border-emerald-50 mb-6 relative overflow-hidden group">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>

        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="font-bold text-emerald-900 text-lg font-['Fredoka'] flex items-center">
              Daily Quest
            </h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              {allComplete ? 'All missions complete!' : `${completedCount}/${quests.length} Completed`}
            </p>
          </div>
          {allComplete && (
            <div className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-sm">
              🎉 Bonus Unlocked!
            </div>
          )}
        </div>

        <div className="space-y-3 relative z-10">
          {quests.map((quest) => (
            <QuestItem key={quest.id} quest={quest} onManualComplete={onManualComplete} theme="emerald" />
          ))}
        </div>
      </div>
    </>
  );
};
