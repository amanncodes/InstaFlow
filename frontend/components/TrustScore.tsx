
import React from 'react';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'lg';
}

const TrustScore: React.FC<TrustScoreProps> = ({ score, size = 'sm' }) => {
  const getColor = (s: number) => {
    if (s > 70) return 'bg-emerald-500';
    if (s > 30) return 'bg-amber-500';
    return 'bg-rose-600';
  };

  const getTextColor = (s: number) => {
    if (s > 70) return 'text-emerald-400';
    if (s > 30) return 'text-amber-400';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between items-end">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Trust Score</span>
        <span className={`font-bold mono ${size === 'lg' ? 'text-2xl' : 'text-sm'} ${getTextColor(score)}`}>
          {score}%
        </span>
      </div>
      <div className={`w-full bg-zinc-800 rounded-full overflow-hidden ${size === 'lg' ? 'h-3' : 'h-1.5'}`}>
        <div 
          className={`h-full transition-all duration-500 ease-out ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default TrustScore;
