import React from 'react';
import { ExerciseArchetype, ExerciseEquipment } from '../types';
import { resolveExerciseVisualMeta, ExerciseVisualMeta } from '../utils/exerciseVisuals';

/**
 * Crisp inline vector SVG icons for each fitness equipment type.
 * 100% offline-safe, zero network overhead, and theme-aware.
 */
export const EquipmentSvgIcon: React.FC<{
  equipment: ExerciseEquipment;
  size?: number;
  className?: string;
}> = React.memo(({ equipment, size = 12, className = '' }) => {
  switch (equipment) {
    case 'dumbbell':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M6.5 6.5 17.5 17.5" />
          <path d="M3 10l7-7" />
          <path d="M14 21l7-7" />
          <path d="M2 6l4-4" />
          <path d="M18 22l4-4" />
        </svg>
      );
    case 'barbell':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="6" y1="6" x2="6" y2="18" />
          <line x1="18" y1="6" x2="18" y2="18" />
          <line x1="3" y1="8" x2="3" y2="16" />
          <line x1="21" y1="8" x2="21" y2="16" />
        </svg>
      );
    case 'cable':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <circle cx="12" cy="6" r="3" />
          <path d="M12 9v8" />
          <path d="M8 20h8" />
          <path d="M9 17l3 3 3-3" />
        </svg>
      );
    case 'machine':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </svg>
      );
    case 'kettlebell':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          <circle cx="12" cy="14" r="6" />
        </svg>
      );
    case 'band':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8Z" />
          <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4Z" />
        </svg>
      );
    case 'cardio':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'mobility':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M12 3c2.5 3.5 3.5 6.5 3.5 9A3.5 3.5 0 0 1 8.5 12c0-2.5 1-5.5 3.5-9Z" />
          <path d="M5 12c2.5 0 5 1.5 7 4.5-3.5 1-6.5.5-8.5-1.5" />
          <path d="M19 12c-2.5 0-5 1.5-7 4.5 3.5 1 6.5.5 8.5-1.5" />
        </svg>
      );
    case 'bodyweight':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <circle cx="12" cy="5" r="2.5" />
          <path d="M7 10h10" />
          <path d="M12 10v6" />
          <path d="M9 21l3-5 3 5" />
        </svg>
      );
  }
});

EquipmentSvgIcon.displayName = 'EquipmentSvgIcon';

interface ExerciseThumbnailProps {
  name: string;
  customImage?: string;
  visualArchetype?: ExerciseArchetype;
  equipment?: ExerciseEquipment;
  meta?: ExerciseVisualMeta;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showPhaseSplitOverlay?: boolean;
  className?: string;
}

/**
 * Tier 1 + Tier 2 Panda Exercise Thumbnail with:
 * - Resolved Concentric/Eccentric Panda `.webp` illustration
 * - Muscle-group color-tinted border & gradient aura
 * - Corner SVG Equipment Badge pill (`DB`, `BB`, `CBL`, `MCH`, `BW`, `KB`, etc.)
 */
export const ExerciseThumbnail: React.FC<ExerciseThumbnailProps> = React.memo(({
  name,
  customImage,
  visualArchetype,
  equipment,
  meta: providedMeta,
  size = 'md',
  onClick,
  className = '',
}) => {
  const meta = providedMeta || resolveExerciseVisualMeta(name, { customImage, visualArchetype, equipment });

  const sizeClasses =
    size === 'xs'
      ? 'w-9 h-9 rounded-lg'
      : size === 'sm'
        ? 'w-11 h-11 rounded-xl'
        : size === 'lg'
          ? 'w-16 h-16 rounded-2xl'
          : 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl';

  const badgeSizeClasses =
    size === 'xs' || size === 'sm'
      ? 'px-1 py-0.2 text-[8px] -bottom-1 -right-1'
      : 'px-1.5 py-0.5 text-[9px] -bottom-1 -right-1';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative shrink-0 group ${sizeClasses} p-0.5 border shadow-xs transition-transform ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${meta.muscleTheme.border} ${className}`}
      style={{ background: meta.muscleTheme.tintGradient }}
      aria-label={onClick ? `View form guide and muscle badges for ${name}` : undefined}
      title={`${name} • ${meta.primaryMuscle} (${meta.equipmentLabel} • ${meta.archetypeLabel})`}
    >
      <div className="w-full h-full rounded-[inherit] overflow-hidden bg-white relative">
        <img
          src={meta.image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {/* Subtle muscle-color top accent bar */}
        <span
          className={`absolute top-0 inset-x-0 h-0.5 opacity-80 ${meta.muscleTheme.dot}`}
          aria-hidden="true"
        />
      </div>

      {/* Tier 2 Corner Equipment Badge Pill */}
      <span
        className={`absolute ${badgeSizeClasses} rounded-md font-black uppercase tracking-tighter flex items-center gap-0.5 shadow-xs border border-white bg-slate-800/95 text-white leading-none pointer-events-none`}
      >
        <EquipmentSvgIcon equipment={meta.equipment} size={size === 'sm' ? 8 : 9} className="text-emerald-300 shrink-0" />
        <span>{meta.equipmentShort}</span>
      </span>
    </Wrapper>
  );
});

ExerciseThumbnail.displayName = 'ExerciseThumbnail';

interface ExerciseBadgeRowProps {
  name: string;
  customImage?: string;
  visualArchetype?: ExerciseArchetype;
  equipment?: ExerciseEquipment;
  meta?: ExerciseVisualMeta;
  compact?: boolean;
  showSecondaryMuscles?: boolean;
  showArchetype?: boolean;
  className?: string;
}

/**
 * Tier 2 Exercise Badge Row:
 * Renders cohesive, color-coded pills for:
 * 1. Primary Muscle Group (with colored dot)
 * 2. Equipment Type (with vector SVG icon)
 * 3. Movement Pattern Archetype (e.g., Horizontal Push, Knee-Dominant, Hip Hinge)
 * 4. Optional Secondary Muscle Groups
 */
export const ExerciseBadgeRow: React.FC<ExerciseBadgeRowProps> = React.memo(({
  name,
  customImage,
  visualArchetype,
  equipment,
  meta: providedMeta,
  compact = false,
  showSecondaryMuscles = false,
  showArchetype = false,
  className = '',
}) => {
  const meta = providedMeta || resolveExerciseVisualMeta(name, { customImage, visualArchetype, equipment });

  const pillPadding = compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`} data-testid="exercise-badge-row">
      {/* 1. Primary Muscle Group Pill */}
      <span
        className={`inline-flex items-center gap-1 rounded-md font-extrabold uppercase tracking-wider border leading-tight ${pillPadding} ${meta.muscleTheme.bg} ${meta.muscleTheme.text} ${meta.muscleTheme.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.muscleTheme.dot}`} aria-hidden="true" />
        {meta.primaryMuscle}
      </span>

      {/* 2. Equipment Badge with SVG Icon */}
      <span
        className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider border border-slate-200/90 bg-slate-100/90 text-slate-700 leading-tight ${pillPadding}`}
      >
        <EquipmentSvgIcon equipment={meta.equipment} size={compact ? 9 : 10} className="text-slate-600 shrink-0" />
        {meta.equipmentLabel}
      </span>

      {/* 3. Movement Archetype Pattern Badge */}
      {showArchetype && (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider border border-emerald-200/70 bg-emerald-50/70 text-emerald-800 leading-tight ${pillPadding}`}
        >
          {meta.archetypeLabel}
        </span>
      )}

      {/* 4. Secondary Muscle Pills (optional, e.g. in Form Guide modal) */}
      {showSecondaryMuscles &&
        meta.secondaryMuscles.map((secMuscle) => (
          <span
            key={secMuscle}
            className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider border border-slate-200/70 bg-white/90 text-slate-500 leading-tight ${pillPadding}`}
          >
            + {secMuscle}
          </span>
        ))}
    </div>
  );
});

ExerciseBadgeRow.displayName = 'ExerciseBadgeRow';
