import React from 'react';

interface Props {
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<Props> = ({ fullScreen = false }) => {
  const containerClass = fullScreen
    ? "min-h-screen bg-[#F0FDF4] flex items-center justify-center"
    : "p-10 flex items-center justify-center h-full min-h-[50vh]";

  return (
    <div className={containerClass}>
      <div className="relative w-16 h-16" role="status" aria-label="Loading">
        <div className="absolute inset-0 border-4 border-emerald-200/70 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};
