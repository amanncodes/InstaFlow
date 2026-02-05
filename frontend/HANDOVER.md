# InstaFlow Frontend-to-Backend Handover Document

## 1. Core Mental Model
InstaFlow is a **SaaS Control Plane**, not a social media manager. It serves as "Air Traffic Control" for automation infrastructure. The UI prioritizes **Account Health (Trust Score)** and **Risk Mitigation** over content creation.

## 2. Technical Stack
- **Framework**: React 18 (ESM via esm.sh)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts (Custom themed)
- **State Management**: Current local state (Ready for React Query / SWR)
- **Auth**: Simple session-based `operator_id` (stored in `sessionStorage`)

---

## 3. Domain Entity Schemas
The backend must provide JSON objects matching these TypeScript interfaces defined in `types.ts`:

### Account (Overview)
Used in the Dashboard list view.
```typescript
{
  accountId: string;       // Unique ID (e.g., "acc_001")
  username: string;        // IG Username
  state: 'ACTIVE' | 'PAUSED' | 'FROZEN';
  trustScore: number;      // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastEventAt: string;     // ISO 8601 Timestamp
  tags: string[];          // Metadata strings
  avatarUrl: string;       // Profile image URL
}
```

### AccountHealth (Deep Dive)
Extends Account with telemetry for the Detail View.
```typescript
{
  ...Account,
  recentSignals: AccountEvent[]; // Mixed System + Automation logs
  trustHistory: MetricPoint[];   // Historical trust scores for the Line Chart
  riskDimensions: RiskAxis[];    // Data for the Radar Chart (5-6 metrics)
  activityPulse: ActivityPoint[]; // 24h request volume for the Bar Chart
  performance: PerformanceStats; // Success/Failure/Throttled ratios
  notes: AccountNote[];          // Operator-added context
}
```

---

## 4. API Endpoints Required

### Fleet Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/accounts` | Returns an array of all Accounts. |
| `GET` | `/api/accounts/:id/health` | Returns full `AccountHealth` object. |
| `GET` | `/api/fleet-metrics` | Returns 24h historical averages for the Global Events chart. |

### Global Audit
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/global-events` | Returns chronological list of all `AccountEvent` across the fleet. |

### Admin Actions (Overrides)
All actions are expected to be idempotent. The UI expects a `200 OK` or `204 No Content` response to refresh data.
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/accounts/:id/pause` | Set state to `PAUSED`. Stop automation. |
| `POST` | `/api/admin/accounts/:id/resume` | Set state to `ACTIVE`. |
| `POST` | `/api/admin/accounts/:id/freeze` | Set state to `FROZEN`. Kill all active sessions. |
| `POST` | `/api/admin/accounts/:id/reset-trust` | Reset `trustScore` to 100 and `riskLevel` to `LOW`. |
| `POST` | `/api/admin/accounts/:id/notes` | Payload: `{ text: string }`. Adds operator note. |

---

## 5. Mock Logic to Replace
Currently, the frontend generates data in `api/client.ts` and `api/mockData.ts`. 

### Required Backend Logic for Parity:
1. **Trust Score Calculation**: The backend should determine trust based on rate limits and login successes.
2. **Risk Dimensioning**: The Radar Chart expects 5 vectors: *Proxy Stability, Req Velocity, Session TTL, Engagement Quality, Auth Integrity*.
3. **Event Severity**: 
   - `INFO`: Standard operations (Resume, Like).
   - `WARNING`: Rate limits, retries.
   - `CRITICAL`: Login failures, session checkpoints, system-level freezes.

---

## 6. Implementation Notes for Integration
1. **Timestamp Format**: Always use ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`). The UI uses a custom formatter to display `YYYY-MM-DD HH:mm:ss`.
2. **Avatar Generation**: Currently uses `dicebear.com` for mocks. Replace with actual Instagram profile picture URLs.
3. **Error Handling**: The UI handles loading states via local boolean flags. If an API returns `4xx/5xx`, ensure the response body contains a readable `message` for operator feedback.
4. **Optimistic UI**: The dashboard actions currently wait for the API response before refreshing the account object. For a smoother experience, consider implementing Optimistic UI on the Pause/Resume actions.

---

## 7. Security / Access
- **Operator Access**: The login page currently checks for `OP_402` / `admin`. This should be replaced with a real JWT or OIDC flow. 
- **Guest Access**: The logic is in place to deny "Guest" logins to protect infrastructure telemetry.
