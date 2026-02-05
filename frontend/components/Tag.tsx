
import React from 'react';
import { X } from 'lucide-react';

interface TagProps {
  label: string;
  onRemove?: () => void;
  interactive?: boolean;
}

const Tag: React.FC<TagProps> = ({ label, onRemove, interactive = false }) => {
  const isRemovable = !!onRemove;
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded border mono font-bold text-[10px] tracking-tight transition-all duration-200
        ${isRemovable 
          ? 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-400 group cursor-pointer' 
          : 'border-zinc-800 bg-zinc-950 text-zinc-500'
        }
        ${interactive && !isRemovable ? 'hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-300' : ''}
      `}
    >
      <span className="shrink-0 opacity-60">#</span>
      <span className="truncate">{label}</span>
      
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-sm opacity-30 group-hover:opacity-100 hover:bg-rose-500/20 transition-all focus:outline-none"
          aria-label={`Remove tag ${label}`}
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </span>
  );
};

export default Tag;
