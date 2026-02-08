export const getAvatarPath = (avatarId: string | undefined, mood: string = 'normal') => {
    const base = avatarId || 'male';
    if (mood === 'normal') return `/assets/panda_${base}.webp`;
    return `/assets/panda_${base}_${mood}.webp`;
};
