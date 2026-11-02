export interface AppThemePalette {
    id: string;
    name: string;
    tagline: string;
    /** Hex color for <meta name="theme-color"> to blend mobile/Android status bar */
    statusBarColor: string;
    /** Page background color */
    pageBg: string;
    /** Header background image (if any) */
    headerBgImage?: string;
    /** Header base background gradient when no image or beneath image */
    headerBaseGradient: string;
    /** Header overlay gradient over the background image */
    headerOverlayGradient: string;
    /** Header border color */
    headerBorderColor: string;
    /** Header ambient glow color */
    headerGlowClass: string;
    /** XP progress bar fill gradient */
    xpBarGradient: string;
    /** Next Mission hero card background gradient */
    heroCardGradient: string;
    /** Next Mission hero card border */
    heroCardBorder: string;
    /** Next Mission ambient orb classes */
    heroOrbPrimary: string;
    heroOrbSecondary: string;
    /** Next Mission badge accent classes */
    heroBadgeClass: string;
    /** Primary CTA button ("Start Adventure") gradient & text */
    ctaGradient: string;
    ctaTextClass: string;
    /** Daily Wisdom card gradient & border */
    wisdomGradient: string;
    wisdomBorder: string;
    wisdomIconBg: string;
    /** Mobile floating dock & Desktop nav active styling */
    dockBackground: string;
    dockBorder: string;
    navActiveGradient: string;
    navActiveTextClass: string;
    navActiveDotClass: string;
    /** Victory Photo spotlight frame accent */
    victoryFrameGradient: string;
    victoryBadgeClass: string;
    /** 3 hex swatches for the Jungle Shop preview */
    swatches: [string, string, string];
}

export const THEME_PALETTES: Record<string, AppThemePalette> = {
    default: {
        id: 'default',
        name: 'Emerald Canopy',
        tagline: 'Classic lush bamboo & jungle emerald',
        statusBarColor: '#052e1e',
        pageBg: '#F0FDF4',
        headerBaseGradient: 'linear-gradient(155deg, hsl(158, 78%, 11%) 0%, hsl(142, 65%, 19%) 55%, hsl(148, 60%, 15%) 100%)',
        headerOverlayGradient: 'linear-gradient(180deg, rgba(4, 32, 20, 0.72) 0%, rgba(6, 55, 36, 0.55) 50%, rgba(5, 42, 28, 0.85) 100%)',
        headerBorderColor: 'rgba(52, 211, 153, 0.25)',
        headerGlowClass: 'bg-lime-400/20',
        xpBarGradient: 'linear-gradient(90deg, #a3e635 0%, #34d399 55%, #fef08a 100%)',
        heroCardGradient: 'linear-gradient(135deg, hsl(145, 70%, 14%) 0%, hsl(152, 68%, 19%) 50%, hsl(140, 65%, 11%) 100%)',
        heroCardBorder: 'rgba(52, 211, 153, 0.35)',
        heroOrbPrimary: 'bg-lime-400/15',
        heroOrbSecondary: 'bg-emerald-400/15',
        heroBadgeClass: 'bg-lime-400/20 text-lime-300 border-lime-400/35',
        ctaGradient: 'linear-gradient(135deg, #bef264 0%, #4ade80 50%, #2dd4bf 100%)',
        ctaTextClass: 'text-emerald-950',
        wisdomGradient: 'linear-gradient(135deg, rgba(236, 253, 245, 0.9) 0%, rgba(247, 254, 231, 0.9) 100%)',
        wisdomBorder: 'rgba(167, 243, 208, 0.7)',
        wisdomIconBg: 'bg-emerald-100 border-emerald-200/60',
        dockBackground: 'linear-gradient(135deg, hsla(145, 68%, 10%, 0.94) 0%, hsla(152, 72%, 7%, 0.97) 100%)',
        dockBorder: 'hsla(142, 60%, 40%, 0.28)',
        navActiveGradient: 'linear-gradient(135deg, hsla(142, 70%, 42%, 0.32) 0%, hsla(82, 80%, 50%, 0.18) 100%)',
        navActiveTextClass: 'text-lime-300',
        navActiveDotClass: 'bg-lime-400 shadow-[0_0_8px_#a3e635]',
        victoryFrameGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)',
        victoryBadgeClass: 'bg-lime-400/20 text-lime-200 border-lime-400/40',
        swatches: ['#064e3b', '#10b981', '#a3e635'],
    },
    jungle_night: {
        id: 'jungle_night',
        name: 'Jungle Night',
        tagline: 'Bioluminescent midnight indigo & electric cyan',
        statusBarColor: '#090d1e',
        pageBg: '#EEF2FF',
        headerBgImage: '/assets/jungle_night_bg.webp',
        headerBaseGradient: 'linear-gradient(155deg, #090d1e 0%, #172554 55%, #1e1b4b 100%)',
        headerOverlayGradient: 'linear-gradient(180deg, rgba(9, 13, 30, 0.78) 0%, rgba(23, 37, 84, 0.58) 50%, rgba(15, 23, 42, 0.88) 100%)',
        headerBorderColor: 'rgba(56, 189, 248, 0.35)',
        headerGlowClass: 'bg-cyan-400/25',
        xpBarGradient: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 55%, #c084fc 100%)',
        heroCardGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 52%, #172554 100%)',
        heroCardBorder: 'rgba(56, 189, 248, 0.4)',
        heroOrbPrimary: 'bg-cyan-400/20',
        heroOrbSecondary: 'bg-indigo-500/20',
        heroBadgeClass: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
        ctaGradient: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 55%, #c084fc 100%)',
        ctaTextClass: 'text-slate-950',
        wisdomGradient: 'linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(224, 242, 254, 0.92) 100%)',
        wisdomBorder: 'rgba(165, 180, 252, 0.7)',
        wisdomIconBg: 'bg-indigo-100 border-indigo-200/70',
        dockBackground: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(23, 21, 58, 0.97) 100%)',
        dockBorder: 'rgba(56, 189, 248, 0.32)',
        navActiveGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(129, 140, 248, 0.22) 100%)',
        navActiveTextClass: 'text-cyan-300',
        navActiveDotClass: 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]',
        victoryFrameGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)',
        victoryBadgeClass: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
        swatches: ['#0f172a', '#38bdf8', '#818cf8'],
    },
    volcano: {
        id: 'volcano',
        name: 'Volcano Core',
        tagline: 'Molten crimson, obsidian & magma gold',
        statusBarColor: '#2a0808',
        pageBg: '#FFF7ED',
        headerBgImage: '/assets/volcano_bg.webp',
        headerBaseGradient: 'linear-gradient(155deg, #2a0808 0%, #7f1d1d 55%, #450a0a 100%)',
        headerOverlayGradient: 'linear-gradient(180deg, rgba(42, 8, 8, 0.78) 0%, rgba(127, 29, 29, 0.56) 50%, rgba(69, 10, 10, 0.88) 100%)',
        headerBorderColor: 'rgba(251, 146, 60, 0.4)',
        headerGlowClass: 'bg-orange-500/25',
        xpBarGradient: 'linear-gradient(90deg, #facc15 0%, #fb923c 50%, #ef4444 100%)',
        heroCardGradient: 'linear-gradient(135deg, #450a0a 0%, #7c2d12 52%, #3b0712 100%)',
        heroCardBorder: 'rgba(251, 146, 60, 0.45)',
        heroOrbPrimary: 'bg-orange-500/25',
        heroOrbSecondary: 'bg-red-500/20',
        heroBadgeClass: 'bg-orange-400/25 text-amber-200 border-orange-400/45',
        ctaGradient: 'linear-gradient(135deg, #fde047 0%, #fb923c 55%, #f97316 100%)',
        ctaTextClass: 'text-red-950',
        wisdomGradient: 'linear-gradient(135deg, rgba(255, 247, 237, 0.94) 0%, rgba(254, 242, 242, 0.92) 100%)',
        wisdomBorder: 'rgba(253, 186, 116, 0.7)',
        wisdomIconBg: 'bg-orange-100 border-orange-200/70',
        dockBackground: 'linear-gradient(135deg, rgba(50, 10, 10, 0.95) 0%, rgba(32, 6, 8, 0.97) 100%)',
        dockBorder: 'rgba(251, 146, 60, 0.35)',
        navActiveGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.34) 0%, rgba(250, 204, 21, 0.2) 100%)',
        navActiveTextClass: 'text-amber-300',
        navActiveDotClass: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
        victoryFrameGradient: 'linear-gradient(135deg, #450a0a 0%, #7c2d12 50%, #5b0e14 100%)',
        victoryBadgeClass: 'bg-orange-500/25 text-amber-200 border-orange-400/45',
        swatches: ['#450a0a', '#f97316', '#facc15'],
    },
    deep_forest: {
        id: 'deep_forest',
        name: 'Deep Forest',
        tagline: 'Mystical abyssal teal & enchanted gold',
        statusBarColor: '#032426',
        pageBg: '#F0FDFA',
        headerBgImage: '/assets/deep_jungle_bg.webp',
        headerBaseGradient: 'linear-gradient(155deg, #032426 0%, #115e59 55%, #042f2e 100%)',
        headerOverlayGradient: 'linear-gradient(180deg, rgba(3, 36, 38, 0.76) 0%, rgba(17, 94, 89, 0.56) 50%, rgba(4, 47, 46, 0.88) 100%)',
        headerBorderColor: 'rgba(45, 212, 191, 0.38)',
        headerGlowClass: 'bg-teal-300/25',
        xpBarGradient: 'linear-gradient(90deg, #2dd4bf 0%, #34d399 50%, #fde047 100%)',
        heroCardGradient: 'linear-gradient(135deg, #042f2e 0%, #134e4a 52%, #064e3b 100%)',
        heroCardBorder: 'rgba(45, 212, 191, 0.42)',
        heroOrbPrimary: 'bg-teal-400/20',
        heroOrbSecondary: 'bg-amber-300/15',
        heroBadgeClass: 'bg-teal-400/20 text-teal-200 border-teal-400/40',
        ctaGradient: 'linear-gradient(135deg, #fde68a 0%, #5eead4 55%, #2dd4bf 100%)',
        ctaTextClass: 'text-teal-950',
        wisdomGradient: 'linear-gradient(135deg, rgba(240, 253, 250, 0.94) 0%, rgba(254, 249, 195, 0.85) 100%)',
        wisdomBorder: 'rgba(153, 246, 228, 0.75)',
        wisdomIconBg: 'bg-teal-100 border-teal-200/70',
        dockBackground: 'linear-gradient(135deg, rgba(4, 47, 46, 0.95) 0%, rgba(3, 30, 32, 0.98) 100%)',
        dockBorder: 'rgba(45, 212, 191, 0.35)',
        navActiveGradient: 'linear-gradient(135deg, rgba(45, 212, 191, 0.32) 0%, rgba(250, 204, 21, 0.2) 100%)',
        navActiveTextClass: 'text-teal-200',
        navActiveDotClass: 'bg-teal-300 shadow-[0_0_8px_#2dd4bf]',
        victoryFrameGradient: 'linear-gradient(135deg, #042f2e 0%, #115e59 50%, #064e3b 100%)',
        victoryBadgeClass: 'bg-teal-400/25 text-teal-100 border-teal-300/40',
        swatches: ['#042f2e', '#14b8a6', '#fde047'],
    },
    celestial_sanctum: {
        id: 'celestial_sanctum',
        name: 'Celestial Sanctum',
        tagline: 'Royal astral amethyst, obsidian & gilded aurora',
        statusBarColor: '#120724',
        pageBg: '#FAF5FF',
        headerBgImage: '/assets/celestial_sanctum_bg.webp',
        headerBaseGradient: 'linear-gradient(155deg, #120724 0%, #2e1065 55%, #1e1b4b 100%)',
        headerOverlayGradient: 'linear-gradient(180deg, rgba(18, 7, 36, 0.74) 0%, rgba(46, 16, 101, 0.52) 50%, rgba(19, 9, 39, 0.88) 100%)',
        headerBorderColor: 'rgba(251, 191, 36, 0.45)',
        headerGlowClass: 'bg-fuchsia-400/25',
        xpBarGradient: 'linear-gradient(90deg, #fde047 0%, #c084fc 52%, #38bdf8 100%)',
        heroCardGradient: 'linear-gradient(135deg, #170930 0%, #2e1065 50%, #3b0764 100%)',
        heroCardBorder: 'rgba(251, 191, 36, 0.45)',
        heroOrbPrimary: 'bg-amber-400/20',
        heroOrbSecondary: 'bg-fuchsia-500/20',
        heroBadgeClass: 'bg-amber-400/20 text-amber-200 border-amber-400/45',
        ctaGradient: 'linear-gradient(135deg, #fde047 0%, #f59e0b 48%, #c084fc 100%)',
        ctaTextClass: 'text-purple-950',
        wisdomGradient: 'linear-gradient(135deg, rgba(250, 245, 255, 0.94) 0%, rgba(254, 243, 199, 0.88) 100%)',
        wisdomBorder: 'rgba(216, 180, 254, 0.75)',
        wisdomIconBg: 'bg-purple-100 border-purple-200/70',
        dockBackground: 'linear-gradient(135deg, rgba(23, 9, 48, 0.95) 0%, rgba(15, 5, 32, 0.98) 100%)',
        dockBorder: 'rgba(251, 191, 36, 0.38)',
        navActiveGradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.34) 0%, rgba(251, 191, 36, 0.22) 100%)',
        navActiveTextClass: 'text-amber-300',
        navActiveDotClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
        victoryFrameGradient: 'linear-gradient(135deg, #1e0b3b 0%, #3b0764 50%, #4c1d95 100%)',
        victoryBadgeClass: 'bg-amber-400/25 text-amber-200 border-amber-400/45',
        swatches: ['#1e0b3b', '#a855f7', '#fbbf24'],
    },
};

export function getThemePalette(themeId?: string | null): AppThemePalette {
    if (!themeId || !THEME_PALETTES[themeId]) {
        return THEME_PALETTES.default;
    }
    return THEME_PALETTES[themeId];
}
