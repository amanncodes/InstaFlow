
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onLogin: (operatorId: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'selection' | 'guest-name' | 'login' | 'guest-denied'>('selection');
  const [guestName, setGuestName] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim().length > 1) {
      setView('guest-denied');
    } else {
      setError('A valid identification name is required.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorId === import.meta.env.VITE_OPERATOR_ID && password === import.meta.env.VITE_OPERATOR_HASH) {
      onLogin(operatorId);
    } else {
      setError('Invalid operator credentials.');
    }
  };

  return (
    <div className="geist-theme min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-zinc-400 relative overflow-hidden">
      {/* Background Grid/Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-12">
          <div className="w-12 h-1.5 bg-emerald-500 mb-6 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">INSTAFLOW</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mono">Infrastructure Access Point</p>
        </div>

        {view === 'selection' && (
          <div className="space-y-3 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => { setView('guest-name'); setError(''); }}
              className="w-full group p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500 group-hover:text-zinc-100 transition-colors">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-zinc-100 uppercase tracking-widest mono">Guest Registration</h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Basic visitor telemetry access.</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
            </button>

            <button 
              onClick={() => { setView('login'); setError(''); }}
              className="w-full group p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:bg-zinc-900 hover:border-emerald-500/40 transition-all text-left shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-zinc-100 uppercase tracking-widest mono">Operator Console</h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Secure automation fleet control.</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
              </div>
            </button>
          </div>
        )}

        {view === 'guest-name' && (
          <form onSubmit={handleGuestSubmit} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-zinc-500" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mono">Identification</p>
              </div>
              <div>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Enter your name..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-700"
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setError(''); }}
                />
                {error && <p className="mt-2 text-[10px] text-rose-500 font-bold uppercase tracking-widest mono">{error}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setView('selection')}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors mono"
              >
                Back
              </button>
              <button 
                type="submit"
                className="flex-[2] py-3 bg-zinc-100 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 mono"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mono">Operator Credentials</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mono">Operator_ID</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="OP_402"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500/50 mono transition-all placeholder:text-zinc-800"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mono">Access_Hash</label>
                <input 
                  type="password" 
                  placeholder="admin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="mt-2 text-[10px] text-rose-500 font-bold uppercase tracking-widest mono">{error}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setView('selection')}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors mono"
              >
                Abort
              </button>
              <button 
                type="submit"
                className="flex-[2] py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 mono"
              >
                Authorize <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {view === 'guest-denied' && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-2">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Access Tier Restricted</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Identity <span className="text-zinc-300 font-bold">"{guestName}"</span> recognized. <br/>
              InstaFlow core infrastructure is strictly reserved for authorized operators. 
              Guest telemetry is currently disabled.
            </p>
            <button 
              onClick={() => setView('selection')}
              className="mt-6 text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-[0.2em] border-b border-emerald-500/30 pb-0.5 mono"
            >
              Return to Selection
            </button>
          </div>
        )}
      </div>

      <footer className="absolute bottom-10 text-[9px] font-bold text-zinc-800 uppercase tracking-[0.8em] pl-[0.8em] mono">
        System Version 4.02.20 - Node: {Math.random().toString(36).substr(2, 5).toUpperCase()}
      </footer>
    </div>
  );
};

export default LandingPage;
