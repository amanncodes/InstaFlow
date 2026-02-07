
import * as React from 'react';
import { api } from '../api/client';
import { AccountHealth, AccountState, AccountEvent, AccountNote } from '../types';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import TrustScore from '../components/TrustScore';
import Tag from '../components/Tag';
import ThemedSelect from '../components/ThemedSelect';
import { TrustTrajectory, RiskRadar, ActivityPulse, PerformancePie } from '../components/VisualMetrics';
import { 
  ArrowLeft, RefreshCw, Pause, Play, Snowflake, History, 
  Tag as TagIcon, Activity, Zap, BarChart3, Info, ExternalLink, 
  Globe, Target, CheckCircle2, AlertCircle, Clock, Search, 
  XCircle, Filter, ShieldAlert, FileText, Send
} from 'lucide-react';

const { useEffect, useState, useRef, useMemo } = React;

interface AccountDetailProps {
  accountId: string;
  onBack: () => void;
}

type LogCategory = 'ALL' | 'SYSTEM' | 'AUTOMATION' | 'ERROR';

const AccountDetail: React.FC<AccountDetailProps> = ({ accountId, onBack }) => {
  const [data, setData] = useState<AccountHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logCategory, setLogCategory] = useState<LogCategory>('ALL');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchHealth = async () => {
    try {
      const health = await api.getAccountHealth(accountId);
      setData(health);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [accountId]);

  const handleAction = async (action: () => Promise<void>) => {
    setActing(true);
    await action();
    await fetchHealth();
    setActing(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setActing(true);
    await api.addNote(accountId, newNote.trim());
    setNewNote('');
    await fetchHealth();
    setActing(false);
  };

  const filteredLogs = useMemo(() => {
    if (!data) return [];
    return data.recentSignals.filter(event => {
      const desc = (event.description || "").toLowerCase();
      const type = (event.type || "").toLowerCase();
      const matchesSearch = 
        desc.includes(logSearch.toLowerCase()) || 
        type.includes(logSearch.toLowerCase());
      
      const isError = event.severity === 'CRITICAL';
      const isAutomation = event.type.startsWith('ACTION_');
      const isSystem = !isAutomation;

      if (!matchesSearch) return false;
      if (logCategory === 'ERROR') return isError;
      if (logCategory === 'AUTOMATION') return isAutomation;
      if (logCategory === 'SYSTEM') return isSystem;
      return true;
    });
  }, [data, logSearch, logCategory]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const trustHistory = data.trustHistory ?? [];
  const riskDimensions = data.riskDimensions ?? [];
  const activityPulse = data.activityPulse ?? [];
  const performance = data.performance;
  const displayUsername = data.username || data.accountId;

  const formatOptionalNumber = (value?: number) =>
    value === null || value === undefined ? "—" : value.toLocaleString();

  const renderMetadata = (metadata?: Record<string, unknown>) => {
    if (!metadata) return null;
    const entries = Object.entries(metadata).filter(([_, v]) => v !== null && v !== undefined);
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {entries.slice(0, 6).map(([key, value]) => (
          <span
            key={key}
            className="bg-zinc-950 px-2 py-0.5 rounded text-[9px] border border-zinc-800 text-zinc-500 font-mono font-bold uppercase tracking-wider"
          >
            {key}:{String(value)}
          </span>
        ))}
      </div>
    );
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };

  const getEventIcon = (event: AccountEvent) => {
    if (event.severity === 'CRITICAL') return <ShieldAlert size={18} className="text-rose-500" />;
    if (event.type === 'ACTION_SUCCESS') return <CheckCircle2 size={18} className="text-emerald-500" />;
    if (event.type === 'ACTION_RETRY' || event.severity === 'WARNING') return <Clock size={18} className="text-amber-500" />;
    return <Info size={18} className="text-blue-500" />;
  };

  const logCategoryOptions = [
    { value: 'ALL', label: 'All Activity' },
    { value: 'SYSTEM', label: 'System Logs', dotColor: 'bg-emerald-500' },
    { value: 'AUTOMATION', label: 'Automation Actions', dotColor: 'bg-blue-500' },
    { value: 'ERROR', label: 'Incident Errors', dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#09090b] text-zinc-200 scroll-smooth no-scrollbar">
      {/* Header Navigation - Removed sticky top-0 and backdrop blur to let it scroll with page */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/50">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors group shrink-0"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Exit to Fleet Overview</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <h2 className="text-xl font-black tracking-tighter">OPERATOR_IDENTITY_VIEW</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{data.accountId}</p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <StatusBadge state={data.state} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Stats & Health Sidebar */}
        <div className="lg:col-span-1 space-y-8 order-2 lg:order-1">
          {/* Identity Card */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className={`p-1 rounded-full bg-gradient-to-tr ${
                data.riskLevel === 'HIGH' ? 'from-rose-600 to-rose-400' : 
                data.riskLevel === 'MEDIUM' ? 'from-amber-600 to-amber-400' : 
                'from-emerald-600 to-emerald-400'
              }`}>
                <div className="bg-zinc-900 p-1 rounded-full">
                  <img src={data.avatarUrl} alt={data.username} className="w-24 h-24 rounded-full border-2 border-zinc-900 shadow-inner" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tighter">@{displayUsername}</h3>
                <RiskBadge level={data.riskLevel} />
              </div>
              <div className="w-full pt-4 border-t border-zinc-800 space-y-3">
                <TrustScore score={data.trustScore} size="lg" />
              </div>
              <div className="grid grid-cols-3 gap-2 w-full pt-2">
                <div className="text-center"><p className="text-xs font-black">{formatOptionalNumber(data.postsCount)}</p><p className="text-[8px] text-zinc-500 uppercase font-bold">Posts</p></div>
                <div className="text-center"><p className="text-xs font-black">{formatOptionalNumber(data.followersCount)}</p><p className="text-[8px] text-zinc-500 uppercase font-bold">Fans</p></div>
                <div className="text-center"><p className="text-xs font-black">{formatOptionalNumber(data.followingCount)}</p><p className="text-[8px] text-zinc-500 uppercase font-bold">Flow</p></div>
              </div>
            </div>
          </section>

          {/* Health Vectors Radar */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Target size={14} className="text-emerald-500" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Telemetry Radar</p>
            </div>
            {riskDimensions.length > 0 ? (
              <div className="h-[250px]"><RiskRadar data={riskDimensions} /></div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                No telemetry data
              </div>
            )}
          </section>

          {/* Operator Notes Section */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-blue-500" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Operator Notes</p>
            </div>
            
            <div className="relative group/note">
              <textarea 
                placeholder="Commit new contextual note..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all placeholder:text-zinc-700 min-h-[80px] resize-none"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button 
                onClick={handleAddNote}
                disabled={acting || !newNote.trim()}
                className="absolute bottom-2 right-2 p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all disabled:opacity-0"
              >
                <Send size={14} />
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
              {data.notes.length > 0 ? (
                data.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-xl space-y-1.5 hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                      <span className="text-blue-500">{note.operatorId}</span>
                      <span className="text-zinc-600">{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400 italic">"{note.text}"</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 opacity-20">
                    <FileText size={24} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Operator Logs</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Controls */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 size={18} className="text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">Control Plane</h3>
            </div>
            <div className="space-y-3">
              {data.state === 'ACTIVE' ? (
                <button onClick={() => handleAction(() => api.pauseAccount(data.accountId))} disabled={acting} className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"><Pause size={14} /> Pause</button>
              ) : (
                <button onClick={() => handleAction(() => api.resumeAccount(data.accountId))} disabled={acting} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"><Play size={14} /> Resume</button>
              )}
              <button onClick={() => handleAction(() => api.resetTrust(data.accountId))} disabled={acting} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600/10 text-blue-400 border border-blue-400/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"><RefreshCw size={14} /> Reset Trust</button>
              <div className="h-px bg-zinc-800 my-4" />
              <button onClick={() => handleAction(() => api.freezeAccount(data.accountId))} disabled={acting || data.state === 'FROZEN'} className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600/10 text-rose-500 border border-rose-500/30 rounded-xl hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"><Snowflake size={14} /> Kill Sessions</button>
            </div>
          </section>
        </div>

        {/* Central Activity & Performance Column */}
        <div className="lg:col-span-3 space-y-8 order-1 lg:order-2">
          {/* Performance Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-6">
              {performance ? (
                <>
                  <div className="shrink-0 w-20 h-20"><PerformancePie stats={performance} /></div>
                  <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stability Ratio</p><p className="text-2xl font-black text-emerald-400">{performance.success}%</p></div>
                </>
              ) : (
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-600">No performance data</div>
              )}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-6">
              <div className="p-3 bg-amber-500/10 rounded-2xl"><Zap size={24} className="text-amber-500" /></div>
              <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Request Load</p><p className="text-2xl font-black text-zinc-100">{performance ? performance.totalActions24h.toLocaleString() : "—"}</p></div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl"><Globe size={24} className="text-blue-500" /></div>
              <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Node Uptime</p><p className="text-2xl font-black text-zinc-100">—</p></div>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl"><Activity size={20} className="text-emerald-500" /></div>
                  <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest">Trust Index Volatility</h3>
               </div>
               {trustHistory.length > 0 ? (
                 <div className="h-[200px]"><TrustTrajectory data={trustHistory} /></div>
               ) : (
                 <div className="h-[200px] flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                   No trust history
                 </div>
               )}
            </section>
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-amber-500/10 rounded-2xl"><Zap size={20} className="text-amber-500" /></div>
                  <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest">Interaction Pulse</h3>
              </div>
              {activityPulse.length > 0 ? (
                <div className="h-[200px]"><ActivityPulse data={activityPulse} /></div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  No activity data
                </div>
              )}
            </section>
          </div>

          {/* Central Unified Activity Timeline */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col min-h-[700px]">
            <div className="p-8 border-b border-zinc-800 bg-zinc-950/30 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><History size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Unified Identity Timeline</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Immutable Account-Specific Activity Log</p>
                  </div>
                </div>
                
                <div className="hidden lg:flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> SYSTEM</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> AUTOMATION</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" /> ERROR</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input 
                    type="text"
                    placeholder="Search chronological events (keyword, target, action)..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-zinc-200 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all placeholder:text-zinc-700 font-medium"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                  {logSearch && <button onClick={() => setLogSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"><XCircle size={16} /></button>}
                </div>
                <ThemedSelect 
                  options={logCategoryOptions}
                  value={logCategory}
                  onChange={(val) => setLogCategory(val as LogCategory)}
                  icon={<Filter size={14} />}
                  className="w-full sm:w-56"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-900/50">
              {filteredLogs.length === 0 ? (
                <div className="p-32 text-center text-zinc-700 flex flex-col items-center gap-6">
                  <div className="p-6 bg-zinc-950 rounded-full border border-zinc-800"><Filter size={48} className="opacity-10" /></div>
                  <p className="text-sm font-black uppercase tracking-[0.3em]">No Telemetry Logs Detected</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/30">
                  {filteredLogs.map((event) => (
                    <div 
                      key={event.id} 
                      className={`p-6 flex gap-6 hover:bg-zinc-800/40 transition-all group items-start border-l-[6px] ${
                        event.severity === 'CRITICAL' ? 'border-rose-500' : 
                        event.severity === 'WARNING' ? 'border-amber-500' : 'border-emerald-500/30'
                      }`}
                    >
                      <div className="mt-1 p-2 bg-zinc-950 rounded-xl border border-zinc-800/50 group-hover:border-zinc-700 group-hover:scale-110 transition-all shrink-0">
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                              event.severity === 'CRITICAL' ? 'text-rose-400' : 
                              event.type.startsWith('ACTION_') ? 'text-blue-400' : 'text-emerald-400/80'
                            }`}>
                              {event.type.replace(/_/g, ' ')}
                            </span>
                            {event.metadata?.actionType && (
                              <span className="bg-zinc-950 px-2 py-0.5 rounded text-[9px] border border-zinc-800 text-zinc-500 font-mono font-bold uppercase tracking-wider">
                                {event.metadata.actionType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                            <Clock size={12} />
                            <span className="text-[10px] font-black mono tracking-tighter">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[15px] text-zinc-400 group-hover:text-zinc-100 transition-colors leading-relaxed font-medium">
                          {event.description}
                        </p>
                        {renderMetadata(event.metadata as Record<string, unknown> | undefined)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-zinc-950/40 border-t border-zinc-800 flex justify-between items-center px-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">Audit Trail Syncing</p>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{filteredLogs.length} Total Telemetry Entries</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
