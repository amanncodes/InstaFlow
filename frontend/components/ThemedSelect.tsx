
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  dotColor?: string;
}

interface ThemedSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

const ThemedSelect: React.FC<ThemedSelectProps> = ({ options, value, onChange, icon, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <span className="text-zinc-500 shrink-0">{icon}</span>}
          {selectedOption.dotColor && (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedOption.dotColor}`} />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 truncate">
            {selectedOption.label}
          </span>
        </div>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0c0c0e] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors group ${
                  value === option.value ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full ${option.dotColor}`} />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    value === option.value ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    {option.label}
                  </span>
                </div>
                {value === option.value && <Check size={12} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemedSelect;
