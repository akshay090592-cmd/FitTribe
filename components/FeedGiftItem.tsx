import React from 'react';
import { GiftTransaction } from '../types';
import { GIFT_ITEMS } from '../utils/gamification';
import { formatTimeAgo } from '../utils/dateUtils';

interface Props {
    gift: GiftTransaction;
}

export const FeedGiftItem: React.FC<Props> = React.memo(({ gift }) => {
    const giftImg = GIFT_ITEMS.find(g => g.id === gift.giftId)?.image;

    return (
        <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4 rounded-[24px] border border-pink-100 shadow-sm flex items-center space-x-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-pink-200/40 text-5xl transform rotate-12 select-none">🎁</div>
            <div className="relative z-10 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-pink-50 animate-bounce-slow">
                {giftImg ? <img src={giftImg} className="w-8 h-8 drop-shadow-sm" /> : <span className="text-xl">{gift.giftEmoji}</span>}
            </div>
            <div className="relative z-10 flex-1">
                <div className="text-sm text-purple-900 font-medium leading-snug">
                    <span className="font-bold text-purple-700">{gift.from}</span> sent a <span className="font-bold text-pink-600 bg-pink-100/50 px-1 rounded">{gift.giftName}</span> to {gift.to}!
                </div>
                <div className="text-[10px] text-purple-400 mt-1 font-bold uppercase tracking-wider bg-white/50 px-2 py-0.5 inline-block rounded-md">{formatTimeAgo(gift.date)}</div>
            </div>
        </div>
    );
});
