
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { AccountEvent, FleetMetricPoint, EventType } from '../types';
import { Filter, ShieldAlert, AlertTriangle, Info, Activity, Terminal, Zap, X, Search, Clock } from 'lucide-react';
import { FleetHealthTrajectory } from '../components/VisualMetrics';
import ThemedSelect from '../components/ThemedSelect';

type SeverityFilter = 'ALL' | 'INFO' | 'WARNING' | 'CRITICAL';

const EventsFeed: React.FC = () => {
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      const [eventData, metricData] = await Promise.all([
        api.getGlobalEvents(),
        api.getFleetMetrics()
      ]);
      setEvents(eventData);
      setFleetMetrics(metricData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach(e => types.add(e.type));
    return Array.from(types).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const desc = (event.description || "").toLowerCase();
      const account = (event.accountId || "").toLowerCase();
      const type = (event.type || "").toLowerCase();
      const matchesSearch = 
        desc.includes(searchTerm.toLowerCase()) || 
        account.includes(searchTerm.toLowerCase()) ||
        type.includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === 'ALL' || event.severity === severityFilter;
      const matchesType = typeFilter === 'ALL' || event.type === typeFilter;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [events, searchTerm, severityFilter, typeFilter]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const latestMetric = fleetMetrics[fleetMetrics.length - 1];

  const severityOptions = [
    { value: 'ALL', label: 'All Severities' },
    { value: 'INFO', label: 'Info', dotColor: 'bg-emerald-500' },
    { value: 'WARNING', label: 'Warning', dotColor: 'bg-amber-500' },
    { value: 'CRITICAL', label: 'Critical', dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' },
  ];

  const typeOptions = [
    { value: 'ALL', label: 'All Action Types' },
    ...eventTypes.map(t => ({ value: t, label: t.replace(/_/g, ' ') }))
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setSeverityFilter('ALL');
    setTypeFilter('ALL');
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

  return (
    <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-[#09090b]">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500">
              <Terminal size={20} />
            </div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">System Audit Log</h1>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Immutable Fleet Telemetry & Infrastructure Trace</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500"><Activity size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Fleet Health Index</p>
              <p className="text-sm font-black mono text-emerald-400">{latestMetric ? `${latestMetric.avgTrust}%` : "—"}</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500"><Zap size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Action Flux</p>
              <p className="text-sm font-black mono text-zinc-100">{latestMetric ? `${latestMetric.totalActions.toLocaleString()}/h` : "—"}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Fleet Telemetry Pulse Visual Indicator - Positions ABOVE logs */}
      <section className="mb-10 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Activity size={180} />
        </div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h3 className="text-xs font-black text-zinc-300 uppercase tracking-[0.3em]">Fleet Infrastructure Trajectory</h3>
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trust Index Avg</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Action Volume</span>
          </div>
        </div>
        <div className="relative z-10 h-[200px]">
          {fleetMetrics.length > 0 ? (
            <FleetHealthTrajectory data={fleetMetrics} />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
              No fleet telemetry yet
            </div>
          )}
        </div>
      </section>

      <div className="space-y-6">
        {/* Active Filters Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Search audit stream by account, type, or description..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all text-zinc-200 placeholder:text-zinc-700 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <ThemedSelect 
              options={severityOptions}
              value={severityFilter}
              onChange={(val) => setSeverityFilter(val as SeverityFilter)}
              icon={<ShieldAlert size={14} />}
              className="w-full sm:w-44"
            />
            <ThemedSelect 
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              icon={<Filter size={14} />}
              className="w-full sm:w-56"
            />
            {(searchTerm || severityFilter !== 'ALL' || typeFilter !== 'ALL') && (
              <button 
                onClick={resetFilters}
                className="p-2 text-zinc-500 hover:text-rose-500 transition-colors bg-zinc-950 border border-zinc-800 rounded-lg"
                title="Clear Filters"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
            Chronological Sequence {filteredEvents.length !== events.length && `(${filteredEvents.length} filtered)`}
          </h3>
          <div className="h-px flex-1 mx-6 bg-zinc-800/50" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
            <Activity size={14} className="animate-pulse text-emerald-500" /> 
            Live Feed Active
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                className="group flex gap-8 p-6 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl hover:bg-zinc-800/40 transition-all border-l-[6px] shadow-sm"
                style={{ borderLeftColor: event.severity === 'CRITICAL' ? '#e11d48' : event.severity === 'WARNING' ? '#f59e0b' : '#10b981' }}
              >
                <div className="shrink-0 pt-1">
                  {event.severity === 'CRITICAL' ? (
                    <ShieldAlert className="text-rose-500" size={24} />
                  ) : event.severity === 'WARNING' ? (
                    <AlertTriangle className="text-amber-500" size={24} />
                  ) : (
                    <Info className="text-emerald-500" size={24} />
                  )}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="col-span-1">
                    <p className="text-[11px] font-black text-zinc-500 mono uppercase tracking-tighter mb-1">{event.accountId}</p>
                    <p className="text-xs font-black text-zinc-100 uppercase tracking-widest group-hover:text-emerald-400 transition-colors truncate">
                      {event.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="col-span-1 text-right">
                    <p className="text-[10px] font-bold text-zinc-400 mono bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center justify-end gap-2">
                      <Clock size={12} className="text-zinc-600" />
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-600 border border-zinc-800 border-dashed rounded-3xl bg-zinc-950/20">
            <Filter size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest opacity-50">Log Null: No Matching Sequences</p>
            <button 
              onClick={resetFilters}
              className="mt-4 text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-[0.2em] border-b border-emerald-500/30 pb-0.5"
            >
              Purge Filter State
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-12 py-8 border-t border-zinc-800/50 flex items-center justify-center gap-4 text-zinc-700">
        <Activity size={14} className="animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">End of Real-time Sequence Trace</p>
      </div>
    </div>
  );
};

export default EventsFeed;
