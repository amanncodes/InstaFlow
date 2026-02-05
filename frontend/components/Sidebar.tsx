
import React from 'react';
import { LayoutDashboard, History, Settings, UserCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'System Events', icon: History },
  ];

  return (
    <div className="w-64 border-r border-zinc-800 flex flex-col h-screen bg-zinc-950/50 backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center gap-2 text-zinc-100 font-black text-2xl tracking-tighter">
          <div className="w-2 h-6 bg-emerald-500 rounded-full" />
          <span>INSTAFLOW</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Operator Control Plane</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeTab === item.id 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">OP</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-100 truncate">Operator #402</p>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Standard Access</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-rose-500 transition-colors"
        >
          <LogOut size={14} /> Terminate Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
