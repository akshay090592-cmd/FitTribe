import React from 'react';
import { Crown } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  teamStats: any;
}

export const TribeStatusCard: React.FC<Props> = ({ teamStats }) => {
  if (!teamStats) return null;

  return (
    <div className="bg-gradient-to-br from-[#5D4037] to-[#3E2723] rounded-[32px] p-5 text-[#F1F8E9] shadow-2xl relative overflow-hidden border-4 border-[#8D6E63]/30 group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 mix-blend-overlay"></div>
      {/* Shine effect */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/5 to-transparent rotate-45 transform translate-x-full transition-transform duration-[2s] group-hover:translate-x-[-100%]"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold flex items-center font-['Fredoka'] text-amber-100">
              <Crown className="mr-2 text-yellow-400 fill-current drop-shadow-md" size={24} /> Tribe Status
              <InfoTooltip text="Your team's combined workout consistency. Keep the fire burning together!" color="text-amber-100/70" />
            </h3>
            <p className="text-[#D7CCC8] text-[10px] font-bold uppercase tracking-wider ml-8">Consistency Level</p>
          </div>
          <div className="text-right bg-black/20 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="text-2xl font-bold text-yellow-400 drop-shadow-md">{teamStats.teamStreak} 🔥</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-3 font-bold">
              <span className="text-amber-100/80">Weekly Bamboo</span>
              <span className="text-lime-300">{Math.round((teamStats.weeklyCount / teamStats.weeklyTarget) * 100)}%</span>
            </div>
            <div
              className="h-8 rounded-full overflow-hidden ring-4 ring-[#3E2723] bg-[#2d1b18] relative shadow-inner"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-600 via-lime-500 to-emerald-500 shadow-[0_0_15px_rgba(132,204,22,0.4)] transition-all duration-1000 relative"
                style={{ width: `${Math.min(100, (teamStats.weeklyCount / teamStats.weeklyTarget) * 100)}%` }}
              >

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
