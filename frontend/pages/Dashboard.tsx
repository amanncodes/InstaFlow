
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { Account, AccountState, RiskLevel } from '../types';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import TrustScore from '../components/TrustScore';
import Tag from '../components/Tag';
import ThemedSelect from '../components/ThemedSelect';
import { Search, ChevronRight, Activity, AlertTriangle, Play, Pause, Filter, X, Hash } from 'lucide-react';

interface DashboardProps {
  onSelectAccount: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectAccount }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Advanced filters
  const [stateFilter, setStateFilter] = useState<AccountState | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | 'ALL'>('ALL');

  const fetchAccounts = async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    accounts.forEach(a => (a.tags ?? []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [accounts]);

  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = 
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.accountId.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags ?? []).some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesState = stateFilter === 'ALL' || a.state === stateFilter;
    const matchesRisk = riskFilter === 'ALL' || a.riskLevel === riskFilter;
    const matchesTag = selectedTag === 'ALL' || (a.tags ?? []).includes(selectedTag);

    return matchesSearch && matchesState && matchesRisk && matchesTag;
  });

  const accountNumberById = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((account, index) => {
      map.set(account.accountId, account.displayId ?? `acc_${String(index + 1).padStart(3, '0')}`);
    });
    return map;
  }, [accounts]);

  const [avatarNonce, setAvatarNonce] = useState<Record<string, number>>({});
  const bumpAvatarNonce = (id: string) => {
    setAvatarNonce((prev) => {
      const next = (prev[id] ?? 0) + 1;
      if (next > 3) return prev;
      return { ...prev, [id]: next };
    });
  };

  const resetFilters = () => {
    setSearch('');
    setStateFilter('ALL');
    setRiskFilter('ALL');
    setSelectedTag('ALL');
  };

  const hasActiveFilters = search !== '' || stateFilter !== 'ALL' || riskFilter !== 'ALL' || selectedTag !== 'ALL';

  const stats = {
    total: accounts.length,
    highRisk: accounts.filter(a => a.riskLevel === 'HIGH').length,
    active: accounts.filter(a => a.state === 'ACTIVE').length
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const stateOptions = [
    { value: 'ALL', label: 'All States' },
    { value: 'ACTIVE', label: 'Active', dotColor: 'bg-emerald-500' },
    { value: 'PAUSED', label: 'Paused', dotColor: 'bg-amber-500' },
    { value: 'FROZEN', label: 'Frozen', dotColor: 'bg-rose-500' },
  ];

  const riskOptions = [
    { value: 'ALL', label: 'All Risks' },
    { value: 'LOW', label: 'Low Risk', dotColor: 'bg-emerald-500' },
    { value: 'MEDIUM', label: 'Med Risk', dotColor: 'bg-amber-500' },
    { value: 'HIGH', label: 'High Risk', dotColor: 'bg-rose-500' },
  ];

  const tagOptions = [
    { value: 'ALL', label: 'All Tags' },
    ...allTags.map(tag => ({ value: tag, label: tag }))
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090b]">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">Fleet Overview</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-wide">Infrastructure Health & Identity Risk Monitor</p>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-emerald-500 transition-all bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 shadow-lg active:scale-95"
          >
            <X size={14} /> Clear All Filters
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Total Identities</p>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-black mono text-zinc-100">{stats.total}</span>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Activity className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-rose-900/30 p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-rose-500/80 uppercase tracking-[0.2em] mb-3">High Risk Alert</p>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-black mono text-rose-500">{stats.highRisk}</span>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-emerald-900/30 p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em] mb-3">Active Threads</p>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-black mono text-emerald-500">{stats.active}</span>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Play className="text-emerald-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/40 flex flex-col xl:flex-row items-center gap-4">
          <div className="relative min-w-[320px] flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Filter by identity, ID, or metadata..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all text-zinc-200 placeholder:text-zinc-600 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <ThemedSelect 
              options={stateOptions}
              value={stateFilter}
              onChange={(val) => setStateFilter(val as any)}
              icon={<Filter size={14} />}
              className="w-full sm:w-40"
            />
            <ThemedSelect 
              options={riskOptions}
              value={riskFilter}
              onChange={(val) => setRiskFilter(val as any)}
              icon={<AlertTriangle size={14} />}
              className="w-full sm:w-40"
            />
            <ThemedSelect 
              options={tagOptions}
              value={selectedTag}
              onChange={setSelectedTag}
              icon={<Hash size={14} />}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-zinc-950/60">
              <tr className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.15em]">
                <th className="px-6 py-4">Identity Profile</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4 w-48">Trust Health</th>
                <th className="px-6 py-4">Risk Vector</th>
                <th className="px-6 py-4">Context Tags</th>
                <th className="px-6 py-4 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <tr 
                    key={account.accountId}
                    className="hover:bg-zinc-800/40 cursor-pointer group transition-all"
                    onClick={() => onSelectAccount(account.accountId)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-900 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                          {account.avatarUrl ? (
                            <img
                              src={`${account.avatarUrl}${account.avatarUrl.includes('?') ? '&' : '?'}t=${avatarNonce[account.accountId] ?? 0}`}
                              alt={account.username}
                              className="w-full h-full object-cover"
                              onError={() => bumpAvatarNonce(account.accountId)}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-tight truncate">@{account.username}</div>
                          <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest truncate">
                            {account.accountId.startsWith("acc_")
                              ? account.accountId
                              : account.displayId ?? accountNumberById.get(account.accountId) ?? account.accountId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge state={account.state} />
                    </td>
                    <td className="px-6 py-5">
                      <TrustScore score={account.trustScore} />
                    </td>
                    <td className="px-6 py-5">
                      <RiskBadge level={account.riskLevel} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2 max-w-[240px]">
                        {(account.tags ?? []).length > 0 ? (
                          (account.tags ?? []).map(tag => (
                            <Tag key={tag} label={tag} />
                          ))
                        ) : (
                          <span className="text-zinc-700 text-[9px] font-black uppercase italic">Unclassified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-emerald-500/10 group-hover:text-emerald-400 text-zinc-700 transition-all border border-transparent group-hover:border-emerald-500/20 shadow-sm">
                        <ChevronRight size={18} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-600">
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <Filter size={40} className="opacity-10" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest opacity-50">Filter Mismatch: No matches found</p>
                      <button 
                        onClick={resetFilters}
                        className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-[0.2em] border-b border-emerald-500/30 pb-0.5"
                      >
                        Purge Filter State
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 flex justify-between items-center px-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Fleet Pulse Active</p>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{filteredAccounts.length} / {accounts.length} identities visualized</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
