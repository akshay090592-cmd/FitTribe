import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  children?: React.ReactNode;
  type?: 'default' | 'success' | 'alert';
}

export const NotificationPopup: React.FC<Props> = ({ isOpen, onClose, title, body, children, type = 'default' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white w-full max-w-sm flex flex-col rounded-[24px] overflow-hidden shadow-2xl animate-scale-up border-4 ${type === 'alert' ? 'border-red-100' : 'border-emerald-100'}`}>
        <div className={`${type === 'alert' ? 'bg-red-50' : 'bg-emerald-50'} p-6 flex items-start relative`}>
          <div className={`bg-white p-3 rounded-2xl shadow-sm ${type === 'alert' ? 'text-red-600' : 'text-emerald-600'} mr-4`}>
            <Bell size={28} className={type === 'alert' ? 'fill-red-100' : 'fill-emerald-100'} />
          </div>
          <div className="flex-1 pr-6">
            <h3 className={`text-xl font-bold ${type === 'alert' ? 'text-red-900' : 'text-emerald-900'} font-['Fredoka'] leading-tight mb-1`}>{title}</h3>
            <span className={`text-[10px] font-bold ${type === 'alert' ? 'text-red-500' : 'text-emerald-500'} uppercase tracking-widest`}>Notification</span>
          </div>
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 ${type === 'alert' ? 'text-red-900/40 hover:text-red-900' : 'text-emerald-900/40 hover:text-emerald-900'} transition-colors p-1`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-2 bg-white">
          {children ? children : (
            <p className="text-slate-600 font-medium leading-relaxed">{body}</p>
          )}

          <button
            onClick={onClose}
            className={`mt-6 w-full ${type === 'alert' ? 'bg-red-600 shadow-red-200' : 'bg-emerald-600 shadow-emerald-200'} text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all hover:brightness-110`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
