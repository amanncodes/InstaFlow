
export type AccountState = 'ACTIVE' | 'PAUSED' | 'FROZEN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type EventType = 
  | 'RATE_LIMIT_WARNING' 
  | 'LOGIN_FAILED' 
  | 'MANUAL_OVERRIDE' 
  | 'STATE_CHANGE' 
  | 'TRUST_RECOVERY'
  | 'AUTOMATION_BLOCKED'
  | 'ACTION_SUCCESS'
  | 'ACTION_FAILED'
  | 'ACTION_RETRY';

export interface AccountEvent {
  id: string;
  accountId: string;
  type: EventType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  timestamp: string;
  metadata?: {
    actionType?: string;
    target?: string;
    [key: string]: unknown;
  };
  source?: string;
}

export interface AccountNote {
  id: string;
  text: string;
  timestamp: string;
  operatorId: string;
}

export interface MetricPoint {
  time: string;
  score: number;
}

export interface FleetMetricPoint {
  time: string;
  avgTrust: number;
  totalActions: number;
}

export interface RiskAxis {
  subject: string;
  value: number;
  fullMark: number;
}

export interface ActivityPoint {
  hour: string;
  requests: number;
}

export interface PerformanceStats {
  success: number;
  failure: number;
  throttled: number;
  totalActions24h: number;
}

export interface Account {
  accountId: string;
  username: string;
  state: AccountState;
  trustScore: number;
  riskLevel: RiskLevel;
  lastEventAt: string;
  automationStatus?: 'Allowed' | 'Limited' | 'Blocked';
  tags?: string[];
  avatarUrl?: string;
  fullName?: string;
  bio?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  website?: string;
}

export interface AccountHealth extends Account {
  recentSignals: AccountEvent[];
  trustHistory?: MetricPoint[];
  riskDimensions?: RiskAxis[];
  activityPulse?: ActivityPoint[];
  performance?: PerformanceStats;
  notes?: AccountNote[];
}
