import React, { useState, useEffect, memo } from 'react';
import { User, UserGamificationState, GiftItem, UserProfile, Badge, Theme } from '../types';
import { getGamificationState, saveGamificationState, sendGift, getTribeMembers, addPointLog, getPointLogs } from '../utils/storage';
import { notifyOnGiftReceived } from '../services/notificationService';
import { BADGES_DB, getTeamStats, getStreaks, GIFT_ITEMS, SHOP_THEMES } from '../utils/gamification';
import { Trophy, Lock, Gift, Zap, Crown, Star, Send, Target, MessageCircle, Store, Palette, CheckCircle, LogOut, X } from 'lucide-react';
import { useToast } from './Toast';
import { InfoTooltip } from './InfoTooltip';
import { StatsDetailPopup } from './StatsDetailPopup';
import { getUserLogs } from '../utils/storage';
import { updateQuestProgress } from '../utils/questUtils';
import { TribeStatusCard } from './TribeStatusCard';
import { getAvatarPath } from '../utils/avatar';


interface Props {
  currentUser: User;
  profile: UserProfile;
  isVisible?: boolean;
  onFetching?: (fetching: boolean) => void;
}

export const RewardsPage: React.FC<Props> = memo(({ currentUser, profile, isVisible = true, onFetching }) => {
  const [gameState, setGameState] = useState<Record<User, UserGamificationState> | null>(() => {
    try {
      const saved = localStorage.getItem('cache_gamification_state');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [teamStats, setTeamStats] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('cache_team_stats');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [tribeMembers, setTribeMembers] = useState<UserProfile[]>([]);
  const [streaks, setStreaks] = useState<number>(0);
  const [giftModalItem, setGiftModalItem] = useState<GiftItem | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(() => !localStorage.getItem('cache_gamification_state'));
  const [hasLoaded, setHasLoaded] = useState(() => !!localStorage.getItem('cache_gamification_state'));
  const [activePointsPopup, setActivePointsPopup] = useState(false);
  const [pointsLogs, setPointsLogs] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (isVisible || !hasLoaded) {
      loadData(hasLoaded);
    }
  }, [isVisible, currentUser]);

  const loadData = async (silent = false) => {
    if (!silent && !hasLoaded) setLoading(true);
    else onFetching?.(true);

    try {
      // BOLT: Parallelize independent data fetches and ensure cache alignment by passing tribeId
      const [state, stats, str, members] = await Promise.all([
        getGamificationState(profile.tribeId),
        getTeamStats(profile.tribeId),
        getStreaks(currentUser, profile.tribeId),
        profile.tribeId ? getTribeMembers(profile.tribeId) : Promise.resolve([])
      ]);

      setTribeMembers(members);

      setGameState(state);
      localStorage.setItem('cache_gamification_state', JSON.stringify(state));
      setTeamStats(stats);
      localStorage.setItem('cache_team_stats', JSON.stringify(stats));
      setStreaks(str);
      if (!silent) setLoading(false);
      setHasLoaded(true);
    } finally {
      onFetching?.(false);
    }
  };

  const myState = gameState ? gameState[currentUser] : { badges: [], inventory: [], points: 0 };

  const handleSendGift = async (toUser: User) => {
    if (!giftModalItem || !gameState) return;

    const newState = { ...gameState };
    const inventoryItem = newState[currentUser].inventory.find(i => i.id === giftModalItem.id);

    if (inventoryItem && inventoryItem.count > 0) {
      inventoryItem.count--;
      if (inventoryItem.count === 0) {
        newState[currentUser].inventory = newState[currentUser].inventory.filter(i => i.id !== giftModalItem.id);
      }

      // Save state optimistically locally, then sync
      setGameState(newState);
      await saveGamificationState(profile, newState[currentUser]);

      const giftTransaction = {
        id: Date.now().toString(),
        from: currentUser,
        to: toUser,
        giftId: giftModalItem.id,
        giftName: giftModalItem.name,
        giftEmoji: giftModalItem.emoji,
        message: "Keep crushing it!",
        date: new Date().toISOString()
      };

      await sendGift(profile, giftTransaction);
      notifyOnGiftReceived(giftTransaction);

      updateQuestProgress(currentUser, profile, 'social_gift', 1);

      setGiftModalItem(null);
      showToast(`Sent ${giftModalItem.name} to ${toUser}!`, 'success');
    }
  };

  const BadgeIcon = ({ name, size = 24 }: { name: string, size?: number }) => {
    const icons: any = {
      Footprints: Zap,
      Sword: Trophy,
      Sun: Star,
      Moon: Star,
      Flame: Zap,
      Dumbbell: Crown,
      Users: Trophy,
      Coffee: Star,
      Crown: Crown,
      MessageCircle: MessageCircle,
      Target: Target
    };
    const Icon = icons[name] || Trophy;
    return <Icon size={size} />;
  };

  const getGiftImage = (giftId: string) => {
    return GIFT_ITEMS.find(g => g.id === giftId)?.image;
  }

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda';
  };

  const handleOpenPointsHistory = async () => {
    if (!gameState) return;

    // Fetch real Point Logs from DB
    const logs = await getPointLogs(profile.id);

    // BOLT: Removed redundant client-side sort as DB already returns DESC order
    setPointsLogs(logs);
    setActivePointsPopup(true);
  };

  if (loading || !teamStats) return <div className="p-10 text-center text-emerald-600 font-bold animate-pulse">Loading Treasures...</div>;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 space-y-5 animate-fade-in">
      <div className="relative mb-4 text-center">
        <h2 className="text-2xl font-bold text-emerald-900 font-['Fredoka'] drop-shadow-sm flex items-center justify-center">
          Treasure Trove
        </h2>
        <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Loot & Rewards</p>
      </div>

      {/* Team Stats Card - Mobile Only (Desktop uses sidebar) */}
      <div className="md:hidden">
        <TribeStatusCard teamStats={teamStats} />
      </div>

      {/* My Stats Rows */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 rounded-[24px] spring-transition flex flex-col items-center justify-center relative group cursor-default">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <InfoTooltip text="Days in a row you've worked out." iconSize={12} color="text-orange-400" />
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-orange-500" style={{ background: 'linear-gradient(135deg, hsl(38,95%,92%), hsl(25,95%,88%))' }}>
            <Zap size={24} className="fill-current" />
          </div>
          <span className="text-2xl font-bold text-slate-800 font-['Fredoka']">{streaks}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak</span>
        </div>
        <div className="glass-panel p-3 rounded-[24px] spring-transition flex flex-col items-center justify-center relative group cursor-default">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <InfoTooltip text="Special awards for hitting milestones." iconSize={12} color="text-purple-400" />
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-purple-500" style={{ background: 'linear-gradient(135deg, hsl(270,65%,94%), hsl(285,60%,90%))' }}>
            <Trophy size={24} className="fill-current" />
          </div>
          <span className="text-2xl font-bold text-slate-800 font-['Fredoka']">{myState.badges.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Badges</span>
        </div>
        <div
          onClick={handleOpenPointsHistory}
          className="glass-panel p-3 rounded-[24px] spring-transition flex flex-col items-center justify-center relative group cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <InfoTooltip text="Currency to buy shop items. Earn by working out!" iconSize={12} color="text-blue-400" />
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-blue-500" style={{ background: 'linear-gradient(135deg, hsl(210,80%,93%), hsl(215,75%,88%))' }}>
            <Star size={24} className="fill-current" />
          </div>
          <span className="text-2xl font-bold text-slate-800 font-['Fredoka']">{myState.points || 0}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</span>
        </div>
      </div>

      <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 text-center flex items-center justify-center">
        <p className="text-xs text-emerald-700 font-bold mr-2">💡 Tip: Plan workouts earn 10 Points. Long custom workouts earn points too!</p>
        <InfoTooltip text="Plan A/B: 10 Pts. Custom (<30m): 0 Pts. Custom (>30m): 1 Pt per 10 mins (Max 6 Pts)." iconSize={14} color="text-emerald-500" />
      </div>

      {/* Badge Cabinet */}
      <div className="glass-panel rounded-[32px] p-5" style={{ background: 'linear-gradient(160deg, hsl(48,80%,97%) 0%, hsl(140,50%,96%) 100%)', border: '1px solid hsl(48,60%,88%)' }}>
        {/* Bamboo shelf header */}
        <div className="relative mb-5">
          <div className="absolute inset-x-0 bottom-0 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(33,65%,45%), hsl(33,60%,52%), hsl(33,65%,45%))', boxShadow: '0 2px 8px hsla(33,65%,45%,0.4)' }} />
          <h3 className="font-bold text-amber-900 mb-3 flex items-center font-['Fredoka'] text-lg relative z-10">
            <span className="rounded-xl mr-3 text-yellow-600 text-xl">🎖️</span>
            Achievements
          </h3>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {BADGES_DB.map(badge => {
            const isUnlocked = myState.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center group cursor-pointer transition-all active:scale-95"
                onClick={() => setSelectedBadge(badge)}
              >
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center mb-3 transition-all transform duration-300 ${
                  isUnlocked
                    ? 'text-yellow-900 group-hover:rotate-6 group-hover:scale-110 bamboo-glow'
                    : 'bg-slate-100 text-slate-300 grayscale opacity-60'
                  }`}
                  style={isUnlocked ? { background: 'linear-gradient(135deg, hsl(48,95%,68%), hsl(38,90%,55%))' } : {}}
                >
                  {isUnlocked ? <BadgeIcon name={badge.icon} size={32} /> : <Lock size={24} />}
                </div>
                <span className={`text-[10px] font-bold leading-tight line-clamp-2 ${isUnlocked ? 'text-amber-900' : 'text-slate-300'}`}>{badge.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory / Gifting */}
      <div className="glass-panel rounded-[32px] p-5" style={{ background: 'linear-gradient(160deg, hsl(350,70%,97%) 0%, hsl(330,60%,96%) 100%)', border: '1px solid hsl(350,60%,90%)' }}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-pink-900 mb-1 flex items-center font-['Fredoka'] text-xl">
              <span className="bg-pink-100 p-2 rounded-xl mr-3 text-pink-500"><Gift size={20} /></span>
              Goodie Bag
              <InfoTooltip text="Items you find can be gifted to tribe members to encourage them." color="text-pink-400" />
            </h3>
            <p className="text-xs text-pink-400 font-bold ml-12">Treat your tribe!</p>
          </div>
          <button className="text-pink-400 hover:text-pink-600 font-bold text-xs bg-pink-50 px-3 py-1 rounded-full transition-colors">History &rarr;</button>
        </div>

        {myState.inventory.length === 0 ? (
          <div className="text-center py-10 bg-pink-50/50 rounded-3xl border-2 border-dashed border-pink-200 flex flex-col items-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-300 mb-3"><Gift size={32} /></div>
            <p className="text-pink-800 font-bold">Your bag is empty!</p>
            <p className="text-pink-400 text-xs mt-1 font-bold">Complete workouts to find treats.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {myState.inventory.map(item => {
              const img = getGiftImage(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setGiftModalItem(item)}
                  className="rarity-common spring-transition flex flex-col items-center p-2 rounded-2xl relative group"
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    {img ? <img src={img} className="max-w-full max-h-full drop-shadow-sm" /> : <span className="text-3xl">{item.emoji}</span>}
                  </div>
                  <span className="text-[10px] font-bold text-pink-900 truncate w-full text-center">{item.name}</span>
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm px-1">{item.count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Jungle Shop */}
      <div className="bg-white border border-indigo-100 rounded-[32px] p-5 shadow-xl shadow-indigo-100/20">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-indigo-900 mb-1 flex items-center font-['Fredoka'] text-xl">
              <span className="bg-indigo-100 p-2 rounded-xl mr-3 text-indigo-500"><Store size={20} /></span>
              Jungle Shop
              <InfoTooltip text="Spend points to unlock new themes and personalize your app!" color="text-indigo-400" />
            </h3>
            <p className="text-xs text-indigo-400 font-bold ml-12">Customize your vibe!</p>
          </div>
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 font-bold text-xs flex items-center">
            <Star size={12} className="mr-1 fill-current" /> {myState.points} pts
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHOP_THEMES.map(theme => {
            const isUnlocked = myState.unlockedThemes?.includes(theme.id);
            const isActive = myState.activeTheme === theme.id;
            const canAfford = myState.points >= theme.price;

            const handlePurchaseOrEquip = async () => {
              if (!gameState) return;
              const newState = { ...gameState };
              const currentUserState = newState[currentUser];

              if (isActive) {
                // Unequip
                currentUserState.activeTheme = 'default';
                showToast(`Theme removed. Default header restored!`, 'success');
              } else if (isUnlocked) {
                // Equip
                currentUserState.activeTheme = theme.id;
                showToast(`Theme updated to ${theme.name}!`, 'success');
              } else {
                // Buy
                if (currentUserState.points >= theme.price) {
                  currentUserState.points -= theme.price;
                  currentUserState.unlockedThemes = [...(currentUserState.unlockedThemes || ['default']), theme.id];
                  showToast(`Purchased ${theme.name}!`, 'success');

                  // Log spending
                  await addPointLog(profile.id, -theme.price, 'spent', 'shop', theme.id);
                } else {
                  showToast('Not enough points!', 'error');
                  return;
                }
              }
              setGameState(newState);
              await saveGamificationState(profile, currentUserState);
              window.location.reload();
            };


            return (
              <div key={theme.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 border border-indigo-100 overflow-hidden relative shadow-sm">
                    {theme.type === 'color' ? (
                      <div className={`w-full h-full ${theme.value.replace('bg-', 'bg-')}`}></div>
                    ) : (
                      <img src={theme.value} className="w-full h-full object-cover" />
                    )}
                    {isActive && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><CheckCircle className="text-white drop-shadow-md" size={24} /></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{theme.name}</h4>
                    <p className="text-xs text-slate-400 font-bold">{theme.description}</p>
                  </div>
                </div>
                <button
                  onClick={handlePurchaseOrEquip}
                  disabled={!isActive && !isUnlocked && !canAfford}
                  className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm ${isActive
                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    : isUnlocked
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400'
                    }`}
                >
                  {isActive ? 'Unequip' :
                    isUnlocked ? 'Equip' :
                      <span className="flex items-center">{theme.price} <Star size={12} className="ml-1 fill-current" /></span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gift Modal */}
      {giftModalItem && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm animate-scale-up shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-pink-50 to-transparent"></div>

            <button onClick={() => setGiftModalItem(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2"><LogOut size={20} className="rotate-180" /></button>

            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-pink-100 rounded-full animate-ping opacity-20"></div>
                <div className="w-full h-full bg-pink-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg relative z-10">
                  {getGiftImage(giftModalItem.id) ?
                    <img src={getGiftImage(giftModalItem.id)!} className="w-14 h-14 animate-bounce-slow" /> :
                    <div className="text-4xl animate-bounce-slow">{giftModalItem.emoji}</div>
                  }
                </div>
                <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                  x{giftModalItem.count}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-emerald-900 font-['Fredoka'] mb-1">Share the Love</h3>
              <p className="text-emerald-500 text-xs font-bold mb-8">Send a {giftModalItem.name} to a friend!</p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {tribeMembers.filter(m => m.displayName !== currentUser).map(m => (
                  <button
                    key={m.displayName}
                    onClick={() => handleSendGift(m.displayName)}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/30 border border-slate-100 hover:border-emerald-200 flex items-center space-x-4 transition-all group relative overflow-hidden"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-emerald-300 transition-colors">
                      <img src={getAvatarPath(m.avatarId)} onError={handleImgError} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-slate-700 text-lg group-hover:text-emerald-800 text-left flex-1">{m.displayName}</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-100 transition-all shadow-sm">
                      <Send size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Details Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedBadge(null)}>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-xs animate-scale-up shadow-2xl text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent"></div>

            <div className="relative z-10">
              <div className={`w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-xl ${myState.badges.includes(selectedBadge.id) ? 'bg-gradient-to-br from-yellow-300 to-amber-400 text-yellow-900 rotate-3' : 'bg-slate-100 text-slate-300'}`}>
                <BadgeIcon name={selectedBadge.icon} size={48} />
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2 font-['Fredoka']">{selectedBadge.title}</h3>
              <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 border border-slate-200">
                {selectedBadge.rarity} Tier
              </div>

              <p className="text-slate-500 mb-8 font-medium leading-relaxed text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedBadge.description}
              </p>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all hover:bg-emerald-600"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Points History Popup */}
      <StatsDetailPopup
        isOpen={activePointsPopup}
        onClose={() => setActivePointsPopup(false)}
        type="points"
        logs={pointsLogs}
      />
    </div>
  );
});