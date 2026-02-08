
import React, { useState, useEffect } from 'react';
import { User, SocialComment, UserProfile } from '../types';
import { getComments, addComment, getCurrentProfile } from '../utils/storage';
import { MessageCircle, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    logId: string;
    currentUser: User;
    logOwner: string;
}

export const CommentSection: React.FC<Props> = ({ logId, currentUser, logOwner }) => {
    const [comments, setComments] = useState<SocialComment[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        loadComments();
        loadProfile();
    }, [logId]);

    const loadProfile = async () => {
        const p = await getCurrentProfile();
        setProfile(p);
    };

    const loadComments = async () => {
        const data = await getComments(logId);
        setComments(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !profile) return;

        setLoading(true);
        try {
            await addComment(logId, text, profile);

            // Notify owner if it's not their own comment
            if (currentUser !== logOwner) {
                // Import dynamically or assume it's available? 
                // Better to import at top. I will add import in next step or use require if needed?
                // Actually I need to add import to top of file.
                // For now I'll just write the logic and then fix imports.
                await import('../services/notificationService').then(mod =>
                    mod.notifyComment(currentUser, logOwner, text)
                );
            }

            setText('');
            await loadComments();
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch {
            return 'just now';
        }
    };

    return (
        <div className="mt-4 border-t border-emerald-50 pt-3">
            <div className="space-y-3 mb-3">
                {comments.map((comment, idx) => (
                    <div key={comment.id || idx} className="flex items-start space-x-2 text-sm bg-emerald-50/50 p-2 rounded-xl">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-100 flex-shrink-0 bg-emerald-100 flex items-center justify-center">
                            <img
                                src={getAvatarPath(undefined)} // Fallback for now as comments don't have avatarId yet
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = comment.userName.charAt(0).toUpperCase();
                                    e.currentTarget.parentElement!.className = "w-6 h-6 rounded-full overflow-hidden border border-emerald-100 flex-shrink-0 bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-800";
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <span className="font-bold text-emerald-900 mr-2">{comment.userName}</span>
                            <span className="text-emerald-800 break-words">{comment.text}</span>
                            <div className="text-[10px] text-emerald-400 mt-0.5">{formatTime(comment.date)}</div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                    type="text"
                    placeholder="Hype them up..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full bg-slate-50 border border-emerald-100 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all font-medium"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || loading}
                    className="absolute right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                >
                    {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send size={14} />}
                </button>
            </form>
        </div>
    );
};
