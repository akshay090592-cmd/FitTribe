import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface Props {
    text: string;
    className?: string;
    iconSize?: number;
    color?: string;
}

export const InfoTooltip: React.FC<Props> = ({ text, className = '', iconSize = 16, color = 'text-emerald-400' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const tooltipWidth = 192; // w-48 is 12rem = 192px
            const padding = 10;

            let left = rect.left + rect.width / 2 - tooltipWidth / 2;
            let top = rect.top - 10; // Default above

            // Clamp horizontal position
            left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

            const spaceAbove = rect.top;

            let finalTop = 0;

            if (spaceAbove > 150) {
                // Show Above
                finalTop = rect.top - 8; // 8px buffer
            } else {
                // Show Below
                finalTop = rect.bottom + 8;
            }

            setPosition({ top: finalTop, left });
        }
    }, [isOpen]);

    const TooltipContent = () => {
        const isAbove = buttonRef.current ? position.top < buttonRef.current.getBoundingClientRect().top : true;

        return (
            <div
                className="fixed z-[9999] w-48 bg-emerald-900/95 text-white text-xs p-3 rounded-xl shadow-xl backdrop-blur-md border border-white/10 animate-fade-in pointer-events-none"
                style={{
                    top: position.top,
                    left: position.left,
                    transform: isAbove ? 'translateY(-100%)' : 'none'
                }}
            >
                {text}
            </div>
        );
    };

    return (
        <>
            <div className={`relative inline-flex items-center ml-2 ${className}`}>
                <div
                    ref={buttonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }
                    }}
                    className={`${color} hover:text-emerald-500 transition-colors p-1 rounded-full hover:bg-emerald-50 active:scale-95 cursor-pointer`}
                    aria-label="Info"
                    role="button"
                    tabIndex={0}
                >
                    <Info size={iconSize} />
                </div>
            </div>
            {isOpen && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9990] bg-transparent"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    ></div>
                    <TooltipContent />
                </>,
                document.body
            )}
        </>
    );
};
