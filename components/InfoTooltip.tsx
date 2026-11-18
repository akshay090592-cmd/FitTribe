import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  label?: string;
  align?: 'left' | 'right' | 'center';
  iconClassName?: string;
  buttonClassName?: string;
}

/**
 * Mobile-friendly accessible info icon + popover tooltip.
 * Stops click propagation so it can safely live inside clickable cards/buttons.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  label = 'More information',
  align = 'center',
  iconClassName = 'text-current',
  buttonClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const positionClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center align-middle shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/15 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors ${buttonClassName}`}
      >
        <Info size={13} className={iconClassName} />
      </button>

      {open && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-full mb-2 ${positionClass} z-50 w-56 sm:w-64 p-2.5 rounded-xl bg-slate-900/95 text-white text-[11px] font-medium leading-relaxed shadow-xl border border-white/15 backdrop-blur-md pointer-events-auto text-left normal-case tracking-normal`}
        >
          {content}
        </span>
      )}
    </span>
  );
};
