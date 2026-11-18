import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content?: string;
  text?: string;
  label?: string;
  align?: 'left' | 'right' | 'center';
  iconClassName?: string;
  color?: string;
  iconSize?: number;
  buttonClassName?: string;
}

const VIEWPORT_MARGIN = 12;
const TRIGGER_GAP = 8;

/**
 * Mobile-friendly accessible info icon + viewport-clamped popover tooltip.
 * Renders via portal with fixed positioning so it never overflows the screen
 * or gets clipped by overflow-hidden parent cards.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  text,
  label = 'More information',
  align = 'center',
  iconClassName,
  color,
  iconSize = 13,
  buttonClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const resolvedContent = content ?? text ?? '';
  const resolvedIconClass = iconClassName ?? color ?? 'text-current';

  const updatePosition = useCallback(() => {
    const buttonEl = buttonRef.current;
    const tipEl = tooltipRef.current;
    if (!buttonEl || !tipEl) return;

    const triggerRect = buttonEl.getBoundingClientRect();
    const tipRect = tipEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tipW = tipRect.width || Math.min(256, vw - VIEWPORT_MARGIN * 2);
    const tipH = tipRect.height || 64;

    let idealLeft: number;
    if (align === 'left') {
      idealLeft = triggerRect.left;
    } else if (align === 'right') {
      idealLeft = triggerRect.right - tipW;
    } else {
      idealLeft = triggerRect.left + triggerRect.width / 2 - tipW / 2;
    }

    const maxLeft = Math.max(VIEWPORT_MARGIN, vw - tipW - VIEWPORT_MARGIN);
    const clampedLeft = Math.min(Math.max(idealLeft, VIEWPORT_MARGIN), maxLeft);

    let top = triggerRect.top - tipH - TRIGGER_GAP;
    if (top < VIEWPORT_MARGIN && triggerRect.bottom + TRIGGER_GAP + tipH <= vh - VIEWPORT_MARGIN) {
      top = triggerRect.bottom + TRIGGER_GAP;
    }
    const maxTop = Math.max(VIEWPORT_MARGIN, vh - tipH - VIEWPORT_MARGIN);
    const clampedTop = Math.min(Math.max(top, VIEWPORT_MARGIN), maxTop);

    setCoords({ top: clampedTop, left: clampedLeft });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, resolvedContent, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!tooltipRef.current || !tooltipRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  if (!resolvedContent) return null;

  const tooltipNode = open ? (
    <span
      ref={tooltipRef}
      role="tooltip"
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', top: coords.top, left: coords.left }}
      className="z-[9999] w-56 sm:w-64 max-w-[calc(100vw-24px)] p-2.5 rounded-xl bg-slate-900/95 text-white text-[11px] font-medium leading-relaxed shadow-xl border border-white/15 backdrop-blur-md pointer-events-auto text-left normal-case tracking-normal"
    >
      {resolvedContent}
    </span>
  ) : null;

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center align-middle shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
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
        <Info size={iconSize} className={resolvedIconClass} />
      </button>

      {tooltipNode && typeof document !== 'undefined'
        ? createPortal(tooltipNode, document.body)
        : tooltipNode}
    </span>
  );
};
