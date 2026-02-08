import React, { useEffect, useState } from 'react';
import { TribePhoto } from '../types';
import { getLatestTribePhoto } from '../utils/storage';
import { Clock } from 'lucide-react';

interface Props {
    tribeId?: string;
}

export const TribeVictoryPhoto: React.FC<Props> = ({ tribeId }) => {
    const [photo, setPhoto] = useState<TribePhoto | null>(null);

    useEffect(() => {
        getLatestTribePhoto(tribeId).then(setPhoto);
    }, [tribeId]);

    if (!photo) return null;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return 'Yesterday';
    };

    return (
        <div className="mb-4 relative animate-fade-in group">
            <div className="absolute inset-0 bg-emerald-500 rounded-[32px] rotate-1 opacity-20 blur-sm group-hover:rotate-2 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative bg-white p-3 rounded-[32px] shadow-xl border-4 border-emerald-50 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-400 opacity-50"></div>

                <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-emerald-100 mb-3 group-hover:scale-[1.02] transition-transform duration-500">
                    <img src={photo.imageData} alt="Victory" className="w-full h-full object-cover" />

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 flex items-end justify-between">
                        <div>
                            <div className="text-white font-bold text-lg font-['Fredoka'] drop-shadow-md flex items-center">
                                <span className="mr-2">🔥</span> {photo.userName}
                            </div>
                            <div className="text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center">
                                <Clock size={10} className="mr-1" /> {timeAgo(photo.createdAt)}
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold border border-white/30 uppercase tracking-widest shadow-sm">
                            Latest Victory
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
