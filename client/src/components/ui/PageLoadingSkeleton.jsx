import React from 'react';

/**
 * Shimmering skeleton placeholder block
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-[#D6D1BE]/40 rounded-xl ${className}`}
    />
  );
}

/**
 * PageLoadingSkeleton - Premium glass skeleton layout for GridShare views
 */
export default function PageLoadingSkeleton({ variant = 'dashboard' }) {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. SKELETON HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D6D1BE]">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-48 sm:w-64" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 🌟 2. SKELETON METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* 🌟 3. SKELETON MAIN VIEWPORT */}
      {variant === 'dashboard' && (
        <div className="glass-card rounded-2xl p-6 sm:p-10 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 w-full">
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-10 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-3 pt-3">
              <Skeleton className="h-10 w-36 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
          <div className="flex-1 w-full flex items-center justify-center p-4">
            <Skeleton className="w-full h-64 sm:h-80 rounded-2xl" />
          </div>
        </div>
      )}

      {variant === 'map' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-44 rounded-xl" />
          </div>
          <Skeleton className="w-full h-[480px] rounded-xl" />
        </div>
      )}

      {variant === 'marketplace' && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        </div>
      )}

      {variant === 'generic' && (
        <div className="glass-card rounded-2xl p-8 space-y-5">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* 🌟 4. SKELETON TWO-PANEL BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="glass-card rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>

    </div>
  );
}
