
import * as React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { MetricPoint, RiskAxis, ActivityPoint, PerformanceStats, FleetMetricPoint } from '../types';

export const PerformancePie: React.FC<{ stats: PerformanceStats }> = ({ stats }) => {
  const data = [
    { name: 'Success', value: stats.success, color: '#10b981' },
    { name: 'Retries', value: stats.throttled, color: '#f59e0b' },
    { name: 'Failed', value: stats.failure, color: '#f43f5e' },
  ];

  return (
    <div className="h-full w-full relative min-h-[100px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            paddingAngle={5}
            dataKey="value"
            isAnimationActive={true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-black text-white leading-none">{stats.success}%</span>
        <span className="text-[7px] uppercase font-bold text-zinc-500">Health</span>
      </div>
    </div>
  );
};

export const TrustTrajectory: React.FC<{ data: MetricPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-[200px] flex items-center justify-center text-zinc-700 text-xs italic">No trajectory data</div>;

  return (
    <div className="h-[200px] w-full min-h-[200px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#4b5563" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            interval={6}
          />
          <YAxis 
            stroke="#4b5563" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#10b981" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorScore)" 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FleetHealthTrajectory: React.FC<{ data: FleetMetricPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-[180px] flex items-center justify-center text-zinc-700 text-xs italic">Awaiting fleet telemetry...</div>;

  return (
    <div className="h-[180px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFleetTrust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFleetActions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#3f3f46" 
            fontSize={8} 
            tickLine={false} 
            axisLine={false} 
            interval={4}
            fontFamily="JetBrains Mono"
          />
          <YAxis 
            yAxisId="left"
            stroke="#10b981" 
            fontSize={8} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 100]}
            fontFamily="JetBrains Mono"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#3b82f6" 
            fontSize={8} 
            tickLine={false} 
            axisLine={false} 
            fontFamily="JetBrains Mono"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="avgTrust" 
            name="Avg Trust Index"
            stroke="#10b981" 
            strokeWidth={1.5} 
            fillOpacity={1} 
            fill="url(#colorFleetTrust)" 
            isAnimationActive={true}
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="totalActions" 
            name="Global Volume"
            stroke="#3b82f6" 
            strokeWidth={1.5} 
            fillOpacity={1} 
            fill="url(#colorFleetActions)" 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskRadar: React.FC<{ data: RiskAxis[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-[300px] flex items-center justify-center text-zinc-700 text-xs italic">No vector data</div>;

  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="65%" 
          data={data}
          margin={{ top: 0, right: 30, bottom: 0, left: 30 }}
        >
          <PolarGrid stroke="#27272a" strokeWidth={0.5} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#9ca3af', fontSize: 8, fontWeight: 700 }} 
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Health"
            dataKey="value"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.4}
            isAnimationActive={true}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ActivityPulse: React.FC<{ data: ActivityPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-[120px] flex items-center justify-center text-zinc-700 text-xs italic">No pulse data</div>;

  return (
    <div className="h-[120px] w-full min-h-[120px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
          <Tooltip 
            cursor={{ fill: '#1f2937' }}
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
          />
          <Bar dataKey="requests" radius={[2, 2, 0, 0]} isAnimationActive={true}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.requests > 80 ? '#f43f5e' : entry.requests > 50 ? '#f59e0b' : '#10b981'} 
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
