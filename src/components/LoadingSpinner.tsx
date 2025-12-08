'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Animated Logo Container */}
      <div className="relative mb-8">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 w-28 h-28 border-4 border-transparent border-t-columbia-navy border-r-columbia-navy/50 rounded-full animate-spin" />
        
        {/* Inner pulsing circle */}
        <div className="w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center animate-pulse">
          <img 
            src="/cuems-logo.png" 
            alt="CUEMS" 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>

      {/* Animated text */}
      <div className="flex items-center gap-1">
        <span className="text-xl font-semibold text-columbia-navy tracking-wide">
          {message}
        </span>
        <span className="flex gap-1">
          <span className="w-2 h-2 bg-columbia-navy rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-columbia-navy rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-columbia-navy rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
};

