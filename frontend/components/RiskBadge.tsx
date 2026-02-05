
import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const styles = {
    LOW: "bg-emerald-500 text-white",
    MEDIUM: "bg-amber-500 text-white",
    HIGH: "bg-rose-600 text-white",
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${styles[level]}`}>
      {level} RISK
    </span>
  );
};

export default RiskBadge;
