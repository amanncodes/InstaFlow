
import React from 'react';
import { AccountState } from '../types';

interface StatusBadgeProps {
  state: AccountState;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ state }) => {
  const styles = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FROZEN: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[state]}`}>
      {state}
    </span>
  );
};

export default StatusBadge;
