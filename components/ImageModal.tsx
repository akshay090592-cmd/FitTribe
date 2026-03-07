import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    altText?: string;
}

export const ImageModal: React.FC<Props> = ({ isOpen, onClose, imageUrl, altText = 'Fullscreen image' }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-2 transition-colors focus:outline-none"
                aria-label="Close fullscreen image"
            >
                <X size={24} />
            </button>
            <img
                src={imageUrl}
                alt={altText}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>,
        document.body
    );
};
