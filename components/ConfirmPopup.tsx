import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmPopupProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  isOpen,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info"
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      bg: 'bg-red-500/10 border-red-100',
      text: 'text-red-900',
      btn: 'bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-700 shadow-md shadow-red-200',
      icon: <AlertTriangle className="text-red-500" size={24} />
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-100',
      text: 'text-amber-900',
      btn: 'bg-amber-500 hover:bg-amber-600 text-white border-b-4 border-amber-700 shadow-md shadow-amber-200',
      icon: <AlertTriangle className="text-amber-500" size={24} />
    },
    info: {
      bg: 'bg-emerald-500/10 border-emerald-100',
      text: 'text-emerald-900',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white border-b-4 border-emerald-800 shadow-md shadow-emerald-200',
      icon: <span className="text-2xl" role="img" aria-label="panda">🐼</span>
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      data-testid="confirm-popup-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden animate-scale-up border border-emerald-100 shadow-2xl"
        data-testid="confirm-popup-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            {config.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-800 font-['Fredoka'] mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all cursor-pointer"
            data-testid="confirm-popup-cancel-btn"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all cursor-pointer ${config.btn}`}
            data-testid="confirm-popup-confirm-btn"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
