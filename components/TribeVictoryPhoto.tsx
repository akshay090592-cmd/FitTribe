import React, { useEffect, useState, useCallback } from 'react';
import * as storage from '../utils/storage';
import { compressImage } from '../utils/imageUtils';
import { TribePhoto, UserProfile } from '../types';
import { Camera, Sparkles, Flame, Maximize2, X, Upload, Trophy, Clock } from 'lucide-react';
import { getThemePalette } from '../utils/themeConfig';

interface Props {
    tribeId?: string;
    userProfile?: UserProfile | null;
    themeId?: string;
    showEmptyCta?: boolean;
    variant?: 'feed' | 'dashboard';
}

function formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export const TribeVictoryPhoto: React.FC<Props> = ({
    tribeId,
    userProfile,
    themeId = 'default',
    showEmptyCta = false,
    variant = 'feed',
}) => {
    const [photo, setPhoto] = useState<TribePhoto | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hypeCount, setHypeCount] = useState(0);
    const [hasHyped, setHasHyped] = useState(false);
    const [hypeBurst, setHypeBurst] = useState(false);

    const palette = getThemePalette(themeId);

    const fetchPhoto = useCallback(async () => {
        try {
            if (typeof storage.getLatestTribePhoto === 'function') {
                const data = await storage.getLatestTribePhoto(tribeId);
                setPhoto(data || null);
                if (data?.id) {
                    const storedCount = Number(localStorage.getItem(`victory_hype_${data.id}`) || '0');
                    const storedHyped = localStorage.getItem(`victory_hyped_by_me_${data.id}`) === '1';
                    setHypeCount(storedCount);
                    setHasHyped(storedHyped);
                }
            } else {
                setPhoto(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [tribeId]);

    useEffect(() => {
        fetchPhoto();

        const handlePhotoUpdated = (e: Event) => {
            const customEvent = e as CustomEvent<TribePhoto | undefined>;
            if (customEvent.detail) {
                setPhoto(customEvent.detail);
                setHypeCount(0);
                setHasHyped(false);
            } else {
                fetchPhoto();
            }
        };

        window.addEventListener('fittribe-victory-photo-updated', handlePhotoUpdated);
        return () => window.removeEventListener('fittribe-victory-photo-updated', handlePhotoUpdated);
    }, [fetchPhoto]);

    const handleHype = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!photo) return;
        const nextCount = hypeCount + 1;
        setHypeCount(nextCount);
        setHasHyped(true);
        setHypeBurst(true);
        localStorage.setItem(`victory_hype_${photo.id}`, String(nextCount));
        localStorage.setItem(`victory_hyped_by_me_${photo.id}`, '1');
        setTimeout(() => setHypeBurst(false), 650);
    };

    const handleFileUpload = async (file?: File | null) => {
        if (!file || !userProfile) return;
        setUploading(true);
        try {
            const base64 = await compressImage(file);
            if (typeof storage.saveTribePhoto === 'function') {
                await storage.saveTribePhoto(base64, userProfile);
            }
            const optimisticPhoto: TribePhoto = {
                id: String(Date.now()),
                userId: userProfile.id,
                userName: userProfile.displayName,
                imageData: base64,
                createdAt: new Date().toISOString(),
            };
            setPhoto(optimisticPhoto);
            setHypeCount(1);
            setHasHyped(true);
            window.dispatchEvent(new CustomEvent('fittribe-victory-photo-updated', { detail: optimisticPhoto }));
        } catch (err) {
            console.error('Failed to upload victory photo', err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return null;

    if (!photo) {
        if (!showEmptyCta) return null;
        return (
            <div
                className="mb-5 relative overflow-hidden rounded-[28px] p-5 text-white shadow-xl border transition-all"
                style={{
                    background: palette.victoryFrameGradient,
                    borderColor: palette.headerBorderColor,
                }}
            >
                <div className={`absolute -top-10 -right-10 w-36 h-36 ${palette.heroOrbPrimary} rounded-full blur-2xl pointer-events-none`} />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/12 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                            <Camera size={22} className="text-amber-300" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-1 border bg-white/10 text-amber-200 border-white/20">
                                <Trophy size={10} className="text-amber-300" /> Latest Victory Frame
                            </div>
                            <h3 className="text-base sm:text-lg font-bold font-['Fredoka'] text-white leading-snug">
                                Claim the Tribe Victory Spotlight!
                            </h3>
                            <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                                Snap a post-workout victory pic to inspire your tribe on the home screen.
                            </p>
                        </div>
                    </div>
                    {userProfile && (
                        <label
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-lg shrink-0 ${palette.ctaTextClass} ${uploading ? 'opacity-60 pointer-events-none' : 'hover:brightness-105'}`}
                            style={{ background: palette.ctaGradient }}
                        >
                            <Camera size={15} />
                            <span>{uploading ? 'Posting...' : 'Snap Victory Pic'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    }

    const relativeTime = formatRelativeTime(photo.createdAt);

    return (
        <>
            <div
                className="mb-5 rounded-[30px] p-1.5 shadow-xl relative overflow-hidden group transition-all duration-300 hover:shadow-2xl"
                style={{
                    background: palette.victoryFrameGradient,
                    border: `2px solid ${palette.headerBorderColor}`,
                }}
            >
                {/* Top Spotlight Header Strip */}
                <div className="flex items-center justify-between px-3.5 py-2 text-white">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${palette.victoryBadgeClass}`}>
                            <Sparkles size={11} className="text-amber-300 fill-amber-300 shrink-0" />
                            <span>Latest Victory</span>
                        </span>
                        {relativeTime && (
                            <span className="text-[11px] text-white/70 font-semibold flex items-center gap-1 truncate">
                                <Clock size={11} className="opacity-75 shrink-0" />
                                {relativeTime}
                            </span>
                        )}
                    </div>

                    {userProfile && (
                        <label
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-full border border-white/20 cursor-pointer transition-all active:scale-95 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                            title="Post a new Victory Pic"
                        >
                            <Camera size={12} className="text-amber-300" />
                            <span>{uploading ? 'Posting...' : 'Post Yours'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                            />
                        </label>
                    )}
                </div>

                {/* Main Victory Photo Showcase */}
                <div
                    onClick={() => setIsFullscreen(true)}
                    className={`relative w-full ${variant === 'dashboard' ? 'aspect-[16/10] sm:aspect-[16/9]' : 'aspect-[4/3] sm:aspect-[16/10]'} rounded-[24px] overflow-hidden bg-slate-950 cursor-pointer`}
                >
                    <img
                        src={photo.imageData}
                        alt="Victory"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Subtle Top & Bottom Cinematic Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25 pointer-events-none" />

                    {/* Top-right Expand Button */}
                    <button
                        type="button"
                        aria-label="Expand victory photo"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(true);
                        }}
                        className="absolute top-3 right-3 bg-black/45 hover:bg-black/65 backdrop-blur-md text-white/90 p-2 rounded-full border border-white/20 transition-all shadow-md"
                    >
                        <Maximize2 size={14} />
                    </button>

                    {/* Bottom Overlay: Champion Info + Interactive Hype Button */}
                    <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 flex items-end justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 p-0.5 shadow-lg shrink-0">
                                <div className="w-full h-full rounded-[14px] bg-slate-900/90 flex items-center justify-center text-base">
                                    🏆
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 flex items-center gap-1">
                                    <span>Tribe Champion</span>
                                </div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-white font-black text-base sm:text-lg leading-tight font-['Fredoka'] drop-shadow-sm truncate">
                                        {photo.userName}
                                    </span>
                                    <span className="text-white/60 text-[11px] font-medium">
                                        {new Date(photo.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Hype / Cheer Pill */}
                        <button
                            type="button"
                            onClick={handleHype}
                            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs transition-all active:scale-90 border shadow-lg shrink-0 ${
                                hasHyped
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-amber-300/60 shadow-orange-500/30'
                                    : 'bg-black/55 hover:bg-black/75 text-white border-white/25 backdrop-blur-md'
                            }`}
                        >
                            <Flame size={15} className={hasHyped ? 'fill-yellow-200 text-yellow-200 animate-bounce' : 'text-orange-400'} />
                            <span>{hypeCount > 0 ? `${hypeCount} Hype` : 'Hype'}</span>
                            {hypeBurst && (
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black text-amber-300 animate-ping pointer-events-none">
                                    +1 🔥
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Lightbox Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-slate-900/90 border border-white/15 rounded-[32px] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xl">🏆</span>
                                <div>
                                    <div className="text-white font-bold text-sm font-['Fredoka']">{photo.userName}&apos;s Victory Pic</div>
                                    <div className="text-white/60 text-[11px]">{new Date(photo.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                aria-label="Close fullscreen photo"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-black flex items-center justify-center max-h-[72vh] overflow-hidden">
                            <img
                                src={photo.imageData}
                                alt="Victory Fullscreen"
                                className="max-w-full max-h-[72vh] object-contain"
                            />
                        </div>

                        <div className="px-5 py-3.5 flex items-center justify-between bg-slate-950/90 border-t border-white/10">
                            <span className="text-xs text-white/75 font-medium flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-300" />
                                Tribe Victory Spotlight
                            </span>
                            <button
                                type="button"
                                onClick={handleHype}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md active:scale-95 transition-all"
                            >
                                <Flame size={15} className="fill-yellow-200 text-yellow-200" />
                                <span>Send Hype ({hypeCount})</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
