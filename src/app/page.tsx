'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Clock,
  Users,
  XCircle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  BarChart3,
  Users2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '../../lib/utils';
import { useAuth } from '@/components/auth-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

type PieItem = { name: string; pct: string; color: string; time: string };
type SeriesPoint = { name: string; productive: number; unproductive: number; neutral: number };
type DashboardMetrics = {
  connectedNow: { total: number; active: number; inactive: number };
  totals: { activeSeconds: number; productiveSeconds: number; unproductiveSeconds: number; neutralSeconds: number };
  series: SeriesPoint[];
  websites: PieItem[];
  apps: PieItem[];
  topMembers: { name: string; dept?: string; pct?: number; productiveSeconds?: number }[];
  lessMembers: { name: string; dept?: string; pct?: number; productiveSeconds?: number; unproductiveSeconds?: number }[];
};

const EMPTY_METRICS: DashboardMetrics = {
  connectedNow: { total: 0, active: 0, inactive: 0 },
  totals: { activeSeconds: 0, productiveSeconds: 0, unproductiveSeconds: 0, neutralSeconds: 0 },
  series: [],
  websites: [{ name: 'Other', pct: '0.0%', time: '', color: '#FACC15' }],
  apps: [{ name: 'Other', pct: '0.0%', time: '', color: '#FACC15' }],
  topMembers: [],
  lessMembers: [],
};

function secondsToHms(totalSeconds: number) {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad2 = (x: number) => String(x).padStart(2, '0');
  return `${hours}:${pad2(mins)}:${pad2(secs)}`;
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysYmd(ymd: string, deltaDays: number) {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// ── Shared Sub-components ─────────────────────────────────────────────────────

function formatHoursShort(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k hrs`;
  return `${hours}h`;
}

function getInitials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
    </div>
  );
}

function Dot({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-1.5 w-1.5 rounded-full', color)} />
      <span>{label}</span>
    </div>
  );
}

function StatCard({
  icon, value, label, badge, iconColor = 'text-primary',
}: { icon: React.ReactNode; value: string; label: string; badge?: string; iconColor?: string }) {
  return (
    <Card className="flex flex-col justify-between border-outline-variant p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <span className={iconColor}>{icon}</span>
        {badge && (
          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <h3 className="mt-1 text-3xl font-bold text-on-surface">{value}</h3>
      </div>
    </Card>
  );
}

function HourClassificationCard({ metrics }: { metrics: DashboardMetrics }) {
  const { totals } = metrics;
  const total = totals.activeSeconds || 1;
  const productivePct = Math.round((totals.productiveSeconds / total) * 100);
  const unproductivePct = Math.round((totals.unproductiveSeconds / total) * 100);
  const neutralPct = Math.max(0, 100 - productivePct - unproductivePct);

  const rows = [
    { label: 'Productive', seconds: totals.productiveSeconds, pct: productivePct, color: 'bg-primary' },
    { label: 'Unproductive', seconds: totals.unproductiveSeconds, pct: unproductivePct, color: 'bg-error' },
    { label: 'Neutral', seconds: totals.neutralSeconds, pct: neutralPct, color: 'bg-on-tertiary-container' },
  ];

  return (
    <Card className="flex flex-col border-outline-variant p-5 shadow-sm">
      <div className="mb-4 flex justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Hour Classification</p>
        <BarChart3 className="h-5 w-5 text-on-surface-variant" />
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-bold text-on-surface">{row.label}</span>
              <span className="text-on-surface-variant">{formatHoursShort(row.seconds)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className={cn('h-full rounded-full', row.color)} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UsageBarList({ items, variant }: { items: PieItem[]; variant: 'productive' | 'unproductive' }) {
  const filtered = items.filter((i) => i.name !== 'Other');
  const maxPct = Math.max(...filtered.map((i) => parseFloat(i.pct)), 1);

  return (
    <div className="space-y-6">
      {filtered.slice(0, 3).map((item) => (
        <div key={item.name}>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm font-bold text-on-surface">{item.name}</span>
            <div className="text-right">
              <span className="font-bold text-on-surface">{item.pct}</span>
              {item.time && (
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {item.time}
                </span>
              )}
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className={cn('h-full rounded-full', variant === 'productive' ? 'bg-primary' : 'bg-error')}
              style={{ width: `${(parseFloat(item.pct) / maxPct) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberItem({
  name,
  dept,
  pct,
  hoursLabel,
  variant = 'top',
}: {
  name: string;
  dept?: string;
  pct?: number;
  hoursLabel?: string;
  variant?: 'top' | 'low';
}) {
  return (
    <div className="flex items-center justify-between p-5 transition-colors hover:bg-surface-container-low">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold',
            variant === 'top'
              ? 'border-primary bg-surface-container text-primary'
              : 'border-outline-variant bg-surface-container-low text-on-surface-variant',
          )}
        >
          {getInitials(name)}
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{name}</p>
          {dept && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{dept}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        {pct !== undefined && (
          <p className={cn('text-lg font-bold', variant === 'top' ? 'text-primary' : 'text-error')}>
            {pct}%
          </p>
        )}
        {hoursLabel && (
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider',
              variant === 'top' ? 'text-emerald-600' : 'text-error',
            )}
          >
            {hoursLabel}
          </p>
        )}
      </div>
    </div>
  );
}

function StatMiniCard({
  icon, value, label, iconBg,
}: { icon: React.ReactNode; value: string; label: string; iconBg: string }) {
  return (
    <Card className="flex flex-col gap-3 p-5 border-none shadow-sm">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
        {icon}
      </div>
      <div>
        <h4 className="text-[14px] font-bold text-slate-900">{value}</h4>
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      </div>
    </Card>
  );
}

function DataBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
      <p className="mb-1.5 text-[8px] text-white/50 uppercase tracking-widest font-bold">{label}</p>
      <p className="text-[11px] font-bold text-white">{value}</p>
    </div>
  );
}

// ── Web & Apps Section ────────────────────────────────────────────────────────

function WebAppsSection({
  webData, appData,
}: {
  webData: PieItem[];
  appData: PieItem[];
}) {
  return (
    <Card className="border-outline-variant p-5 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-on-surface">App &amp; Web Resource Analysis</h3>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Most Used Productive Assets
          </h4>
          <UsageBarList items={appData} variant="productive" />
        </div>
        <div>
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-error">
            Time Sink &amp; Leisure Assets
          </h4>
          <UsageBarList items={webData} variant="unproductive" />
        </div>
      </div>
    </Card>
  );
}

// ── Productive Graph ──────────────────────────────────────────────────────────

function ProductiveGraph({ data }: { data: SeriesPoint[] }) {
  return (
    <Card className="border-outline-variant p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-on-surface">Productivity Over Time</h3>
        <div className="flex items-center gap-4">
          <LegendDot color="bg-primary" label="Current Period" />
          <LegendDot color="bg-outline-variant" label="Breakdown" />
        </div>
      </div>
      <div className="mb-4 flex gap-5">
        <LegendDot color="bg-emerald-500" label="Productive" />
        <LegendDot color="bg-error" label="Unproductive" />
        <LegendDot color="bg-amber-500" label="Neutral" />
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dx={-8} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #c6c6cd', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
            <Line type="monotone" dataKey="productive" stroke="#0058be" strokeWidth={2.5} dot={{ r: 3, fill: '#0058be', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="unproductive" stroke="#ba1a1a" strokeWidth={2} dot={{ r: 3, fill: '#ba1a1a', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="neutral" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Top/Less Productive Sidebar Cards ─────────────────────────────────────────

function ProductivitySideCards({
  topMembers, lessMembers,
}: {
  topMembers: DashboardMetrics['topMembers'];
  lessMembers: DashboardMetrics['lessMembers'];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden border-outline-variant p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-5 py-4">
          <h3 className="text-lg font-semibold text-on-surface">Top Productive Members</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {topMembers.length === 0 ? (
            <p className="p-5 text-sm text-on-surface-variant">No data available</p>
          ) : (
            topMembers.map((m) => (
              <MemberItem
                key={m.name}
                name={m.name}
                dept={m.dept}
                pct={m.pct}
                hoursLabel={m.productiveSeconds ? `${formatHoursShort(m.productiveSeconds)} Productive` : undefined}
                variant="top"
              />
            ))
          )}
        </div>
      </Card>

      <Card className="overflow-hidden border-outline-variant p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-5 py-4">
          <h3 className="text-lg font-semibold text-on-surface">Underperforming Pulse</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {lessMembers.length === 0 ? (
            <p className="p-5 text-sm text-on-surface-variant">No data available</p>
          ) : (
            lessMembers.map((m) => (
              <MemberItem
                key={m.name}
                name={m.name}
                dept={m.dept}
                pct={m.pct}
                hoursLabel={
                  m.unproductiveSeconds
                    ? `${formatHoursShort(m.unproductiveSeconds)} Unproductive`
                    : undefined
                }
                variant="low"
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}


function OrganizationView({ metrics }: { metrics: DashboardMetrics }) {
  const activePct =
    metrics.connectedNow.total > 0
      ? Math.round((metrics.connectedNow.active / metrics.connectedNow.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users2 className="h-5 w-5" />}
          value={String(metrics.connectedNow.total)}
          label="Total Members"
        />
        <StatCard
          icon={<Check className="h-5 w-5" />}
          value={String(metrics.connectedNow.active)}
          label="Active Members"
          badge={`${activePct}% Active`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-on-surface-variant" />}
          value={formatHoursShort(metrics.totals.activeSeconds)}
          label="Total Active Hours"
          badge="This Week"
          iconColor="text-on-surface-variant"
        />
        <HourClassificationCard metrics={metrics} />
      </div>

      <ProductiveGraph data={metrics.series} />
      <ProductivitySideCards topMembers={metrics.topMembers} lessMembers={metrics.lessMembers} />
      <WebAppsSection webData={metrics.websites} appData={metrics.apps} />
    </div>
  );
}

function TeamView({ metrics }: { metrics: DashboardMetrics }) {
  return <OrganizationView metrics={metrics} />;
}

function IndividualView() {
  // Calendar helpers
  const year = 2026, month = 3; // April
  const firstDay = new Date(year, month, 1).getDay(); // 3 = Wednesday
  const daysInMonth = 31;

  return (
    <div className="space-y-6">
      {/* Top stat cards + Today's Data */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatMiniCard icon={<ArrowUp className="h-4 w-4 text-green-500" />} value="00:00:00 hrs" label="No Productive Hours" iconBg="bg-green-50" />
          <StatMiniCard icon={<Clock className="h-4 w-4 text-red-400" />} value="00:00:00 hrs" label="No Unproductive Hours" iconBg="bg-red-50" />
          <StatMiniCard icon={<Clock className="h-4 w-4 text-orange-400" />} value="00:00:00 hrs" label="No Neutral Time" iconBg="bg-orange-50" />
          <StatMiniCard icon={<Clock className="h-4 w-4 text-blue-400" />} value="00:00:00 hrs" label="No Active Time" iconBg="bg-blue-50" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-full rounded-2xl bg-[#5E35B1] p-5 text-white shadow-lg shadow-purple-500/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Today&apos;s Data</h3>
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <DataBox label="Start Time" value="--:--:-- am" />
              <DataBox label="Last Active Time" value="--:--:-- pm" />
              <DataBox label="Total Active Hours" value="--:--:-- hrs" />
            </div>
          </div>
        </div>
      </div>

      {/* Graph area + Right sidebar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Empty graph */}
        <div className="lg:col-span-9">
          <Card className="flex h-[380px] flex-col p-6 border-none shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-on-surface">Productive vs Unproductive Graph</h3>
                <p className="text-[11px] text-on-surface-variant">Overview of time spent for the selected date range</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-slate-50">
                <BarChart3 className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-lg font-bold text-slate-200">No Active Data</p>
            </div>
          </Card>
        </div>

        {/* Right: Top Apps + Calendar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Apps empty */}
          <Card className="p-5 border-none shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-900">Top Apps/Webs used</h3>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-50">
                <BarChart3 className="h-6 w-6 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-200">No Active Data</p>
            </div>
          </Card>

          {/* Calendar */}
          <Card className="p-4 border-none shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-900">April 2026</h3>
              <div className="flex gap-1">
                <ChevronLeft className="h-4 w-4 text-slate-400 cursor-pointer" />
                <ChevronRight className="h-4 w-4 text-slate-400 cursor-pointer" />
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center text-[9px] text-slate-400 font-medium mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
              {/* Empty cells before April 1 (Wednesday = index 3) */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === 1;
                return (
                  <div
                    key={day}
                    className={cn(
                      'py-1.5 rounded-lg cursor-pointer text-[10px] font-medium transition-colors',
                      isToday
                        ? 'bg-green-500 text-white'
                        : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1.5">
              <LegendDot color="bg-green-500" label="Present" />
              <LegendDot color="bg-pink-500" label="Absent" />
              <LegendDot color="bg-blue-500" label="Holiday" />
              <LegendDot color="bg-teal-500" label="Working Holiday" />
            </div>
          </Card>
        </div>
      </div>

      {/* Time Tracker Report Table */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant p-5">
          <div>
            <h3 className="text-[15px] font-bold text-on-surface">Time Tracker Report</h3>
            <p className="text-[11px] text-on-surface-variant">
              Total Productivity : <span className="font-bold text-on-surface">0hrs 0Min 0Sec</span>
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/60 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Activity Span</th>
                <th className="px-5 py-3"><Dot label="Active" color="bg-blue-500" /></th>
                <th className="px-5 py-3"><Dot label="Productive" color="bg-green-500" /></th>
                <th className="px-5 py-3"><Dot label="Unproductive" color="bg-red-500" /></th>
                <th className="px-5 py-3"><Dot label="Neutral" color="bg-orange-500" /></th>
                <th className="px-5 py-3"><Dot label="Idle" color="bg-yellow-400" /></th>
                <th className="px-5 py-3"><Dot label="Away" color="bg-slate-300" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {['1 Apr 2026', '31 Mar 2026', '30 Mar 2026', '29 Mar 2026', '28 Mar 2026', '27 Mar 2026'].map(date => (
                <tr key={date} className="text-slate-600">
                  <td className="px-5 py-3 font-medium text-[11px]">{date}</td>
                  <td className="px-5 py-3">
                    <div className="text-[9px] text-slate-400">12:00:00 AM</div>
                    <div className="text-[9px] text-slate-400">12:00:00 AM</div>
                  </td>
                  {['Active', 'Productive', 'Unproductive', 'Neutral', 'Idle', 'Away'].map(col => (
                    <td key={col} className="px-5 py-3 font-bold text-slate-800">0hrs 0Min 0Sec</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const hideOrgView = user?.role === 'manager';

  const [startDate] = useState<string>(() => addDaysYmd(todayYmd(), -6));
  const [endDate] = useState<string>(() => todayYmd());
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<'org' | 'team' | 'ind'>(() =>
    user?.role === 'manager' ? 'team' : 'org'
  );

  useEffect(() => {
    if (hideOrgView && activeView === 'org') {
      setActiveView('team');
    }
  }, [hideOrgView, activeView]);

  useEffect(() => {
    if (activeView === 'ind') return;

    const ac = new AbortController();
    setMetricsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/metrics?startDate=${startDate}&endDate=${endDate}`, {
          signal: ac.signal,
          cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          setMetrics(EMPTY_METRICS);
          return;
        }
        setMetrics({
          connectedNow: json.connectedNow || EMPTY_METRICS.connectedNow,
          totals: json.totals || EMPTY_METRICS.totals,
          series: Array.isArray(json.series) ? json.series : [],
          websites: Array.isArray(json.websites) ? json.websites : EMPTY_METRICS.websites,
          apps: Array.isArray(json.apps) ? json.apps : EMPTY_METRICS.apps,
          topMembers: Array.isArray(json.topMembers) ? json.topMembers : [],
          lessMembers: Array.isArray(json.lessMembers) ? json.lessMembers : [],
        });
      } finally {
        setMetricsLoading(false);
      }
    })();

    return () => ac.abort();
  }, [activeView, startDate, endDate]);

  const viewTabs = [
    ...(!hideOrgView
      ? [{ key: 'org' as const, icon: <Users2 className="h-3.5 w-3.5" />, label: 'Organization View' }]
      : []),
    { key: 'team' as const, icon: <Users className="h-3.5 w-3.5" />, label: 'Team View' },
    { key: 'ind' as const, icon: <User className="h-3.5 w-3.5" />, label: 'Individual View' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">Productivity Overview</h2>
          <p className="text-sm text-on-surface-variant">Real-time engagement and output analytics</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-fit rounded-xl border border-outline-variant bg-surface-container p-1">
            {viewTabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                  activeView === key
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {label.replace(' View', '')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-on-surface">{startDate}</span>
            <span className="text-outline-variant">—</span>
            <span className="text-xs font-medium text-on-surface">{endDate}</span>
            <Calendar className="ml-1 h-4 w-4 text-on-surface-variant" />
          </div>
        </div>
      </div>

      {metricsLoading && activeView !== 'ind' && (
        <div className="mb-4 text-xs font-medium text-on-surface-variant">Loading dashboard data…</div>
      )}

      {activeView === 'org' && <OrganizationView metrics={metrics} />}
      {activeView === 'team' && <TeamView metrics={metrics} />}
      {activeView === 'ind' && <IndividualView />}
    </DashboardLayout>
  );
}
