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
      <div className="w-16 h-16 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );
};
