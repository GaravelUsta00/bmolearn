'use client';


export const SkeletonLoading = () => (
  <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 space-y-8 animate-pulse">
    <div className="w-64 h-16 bg-[var(--card)] rounded-3xl"></div>
    <div className="w-full max-w-2xl h-14 bg-[var(--card)] rounded-full"></div>
    <div className="flex gap-4">
       <div className="w-32 h-20 bg-[var(--card)] rounded-2xl"></div>
       <div className="w-32 h-20 bg-[var(--card)] rounded-2xl"></div>
       <div className="w-32 h-20 bg-[var(--card)] rounded-2xl"></div>
    </div>
  </div>
);
