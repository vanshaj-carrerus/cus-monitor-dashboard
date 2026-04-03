'use client';

import { useState } from 'react';
import {
  Calendar,
  User,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  BarChart3,
  Info,
  MoreVertical,
  Users2,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '../../lib/utils';
// ── Data ──────────────────────────────────────────────────────────────────────

const lineDataOrg = [
  { name: '27th Mar', productive: 45, unproductive: 12, neutral: 125 },
  { name: '28th Mar', productive: 35, unproductive: 10, neutral: 65 },
  { name: '29th Mar', productive: 15, unproductive: 5, neutral: 10 },
  { name: '30th Mar', productive: 60, unproductive: 15, neutral: 185 },
  { name: '31st Mar', productive: 65, unproductive: 14, neutral: 175 },
  { name: '1st Apr', productive: 55, unproductive: 12, neutral: 90 },
  { name: '2nd Apr', productive: 35, unproductive: 18, neutral: 70 },
];

const lineDataTeam = [
  { name: '27th Mar', productive: 85, unproductive: 5, neutral: 100 },
  { name: '28th Mar', productive: 35, unproductive: 10, neutral: 115 },
  { name: '29th Mar', productive: 38, unproductive: 8, neutral: 120 },
  { name: '30th Mar', productive: 40, unproductive: 5, neutral: 10 },
  { name: '31st Mar', productive: 50, unproductive: 15, neutral: 160 },
  { name: '1st Apr', productive: 60, unproductive: 10, neutral: 120 },
  { name: '2nd Apr', productive: 40, unproductive: 8, neutral: 45 },
];

const attendanceData = [
  { name: '27th Mar', present: 42, absent: 8 },
  { name: '28th Mar', present: 18, absent: 32 },
  { name: '29th Mar', present: 52, absent: 12 },
  { name: '30th Mar', present: 40, absent: 10 },
  { name: '31st Mar', present: 36, absent: 15 },
  { name: '1st Apr', present: 42, absent: 10 },
  { name: '2nd Apr', present: 20, absent: 32 },
];

const webDataOrg = [
  { name: 'https://linkedin.com', pct: '30.1%', time: '120:33:03', color: '#4ADE80' },
  { name: 'https://mail.google.com', pct: '23.2%', time: '97:26:40', color: '#60A5FA' },
  { name: 'https://docs.google.com', pct: '14.8%', time: '59:58:19', color: '#F87171' },
  { name: 'https://web.whatsapp.com', pct: '3.6%', time: '27:57:04', color: '#A78BFA' },
  { name: 'Other', pct: '28.3%', time: '', color: '#FACC15' },
];

const appDataOrg = [
  { name: 'chrome.exe', pct: '71.1%', time: '286:30:19', color: '#4ADE80' },
  { name: 'whatsapp.root', pct: '19.9%', time: '80:10:45', color: '#60A5FA' },
  { name: 'windows explorer', pct: '3.5%', time: '14:20:06', color: '#F87171' },
  { name: 'microsoft word', pct: '3.3%', time: '13:34:18', color: '#A78BFA' },
  { name: 'Other', pct: '2.2%', time: '', color: '#FACC15' },
];

const webDataTeam = [
  { name: 'https://linkedin.com', pct: '41.6%', time: '81:30:12', color: '#4ADE80' },
  { name: 'https://mail.google.com', pct: '29.3%', time: '59:01:42', color: '#60A5FA' },
  { name: 'https://drive.google.com', pct: '12.4%', time: '24:17:23', color: '#F87171' },
  { name: 'https://job-boards.greenhouse.io', pct: '10.4%', time: '19:20:54', color: '#A78BFA' },
  { name: 'Other', pct: '6.3%', time: '', color: '#FACC15' },
];

const appDataTeam = [
  { name: 'chrome.exe', pct: '66.0%', time: '146:06:35', color: '#4ADE80' },
  { name: 'whatsapp.exe', pct: '23.7%', time: '52:34:25', color: '#60A5FA' },
  { name: 'window-explorer', pct: '4.4%', time: '09:47:09', color: '#F87171' },
  { name: 'microsoft-word', pct: '3.9%', time: '09:07:18', color: '#A78BFA' },
  { name: 'Other', pct: '2.0%', time: '', color: '#FACC15' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toPieData(items: { name: string; pct: string; color: string; time: string }[]) {
  return items.map(i => ({ ...i, value: parseFloat(i.pct) }));
}

// ── Shared Sub-components ─────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2 w-2 rounded-full', color)} />
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
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
  icon, value, label, iconBg,
}: { icon: React.ReactNode; value: string; label: string; iconBg: string }) {
  return (
    <Card className="relative flex flex-col items-start gap-8 p-6 overflow-hidden border-none shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform', iconBg)}>
        {icon}
      </div>
      <div>
        <h4 className="text-[22px] font-bold text-slate-900 leading-tight">{value}</h4>
        <p className="text-[12px] text-slate-400 font-medium">{label}</p>
      </div>
      <Info className="absolute top-4 right-4 h-4 w-4 text-slate-200 cursor-help" />
    </Card>
  );
}

function SideMiniStat({
  label, value, color, icon,
}: { label: string; value: string; color: 'blue' | 'green' | 'pink' | 'orange'; icon: React.ReactNode }) {
  const themes = {
    blue: { bg: 'bg-blue-50' },
    green: { bg: 'bg-green-50' },
    pink: { bg: 'bg-pink-50' },
    orange: { bg: 'bg-orange-50' },
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3 shadow-sm">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', themes[color].bg)}>
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function MemberItem({ name, dept }: { name: string; dept?: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className="text-[13px] font-semibold text-slate-800">{name}</p>
        {dept && <p className="text-[11px] text-slate-400">{dept}</p>}
      </div>
      <MoreVertical className="h-4 w-4 text-slate-200 cursor-pointer transition-colors" />
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
  webData: typeof webDataOrg;
  appData: typeof appDataOrg;
}) {
  const [activeWebIndex, setActiveWebIndex] = useState<number | null>(null);
  const [activeAppIndex, setActiveAppIndex] = useState<number | null>(null);

  const wPie = toPieData(webData);
  const aPie = toPieData(appData);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct, index, activeIndex }: any) => {
    const isExploded = index === activeIndex;
    const offset = isExploded ? 6 : 0;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + offset;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className={cn("text-[10px] font-bold pointer-events-none drop-shadow-sm", isExploded && "text-[11px]")}
      >
        {pct}
      </text>
    );
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <filter id="shadow" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="white"
          strokeWidth={2}
          filter="url(#shadow)"
          style={{ transition: 'all 0.3s ease-out', cursor: 'pointer' }}
        />
      </g>
    );
  };

  const PieComponent = Pie as any;

  return (
    <Card className="p-6 border-none shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Web &amp; Apps</h3>
          <p className="text-[11px] text-slate-400">View the most used websites &amp; apps</p>
        </div>
        <ExternalLink className="h-5 w-5 text-slate-300 cursor-pointer" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Websites */}
        <div className="rounded-2xl border-none bg-white p-8 flex flex-col items-center shadow-sm">
          <h4 className="mb-8 text-sm font-bold text-slate-900">Websites</h4>
          <div className="h-[200px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <PieComponent
                  data={wPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={0}
                  labelLine={false}
                  label={(props: any) => renderCustomLabel({ ...props, activeIndex: activeWebIndex })}
                  activeIndex={activeWebIndex ?? undefined}                >
                  {wPie.map((e, i) => (
                    <Cell
                      key={i}
                      fill={e.color}
                      stroke="white"
                      strokeWidth={activeWebIndex === i ? 0 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />
                  ))}
                </PieComponent>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-4">
            {webData.filter(i => i.name !== 'Other').map((item, idx) => (
              <div
                key={item.name}
                className={cn(
                  "flex items-center justify-between text-[12px] transition-all rounded-lg p-1",
                  activeWebIndex === idx ? "bg-slate-50" : "bg-transparent"
                )}
                onMouseEnter={() => setActiveWebIndex(idx)}
                onMouseLeave={() => setActiveWebIndex(null)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-6 w-1 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className={cn("text-slate-500 truncate max-w-[200px] font-medium", activeWebIndex === idx && "text-slate-900")}>{item.name}</span>
                </div>
                <span className={cn("text-slate-700 font-bold ml-4", activeWebIndex === idx && "text-slate-900")}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Applications */}
        <div className="rounded-2xl border-none bg-white p-8 flex flex-col items-center shadow-sm">
          <h4 className="mb-8 text-sm font-bold text-slate-900">Applications</h4>
          <div className="h-[200px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <PieComponent
                  data={aPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={0}
                  labelLine={false}
                  label={(props: any) => renderCustomLabel({ ...props, activeIndex: activeAppIndex })}
                  activeIndex={activeAppIndex ?? undefined}
                >
                  {aPie.map((e, i) => (
                    <Cell
                      key={i}
                      fill={e.color}
                      stroke="white"
                      strokeWidth={activeAppIndex === i ? 0 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />
                  ))}
                </PieComponent>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-4">
            {appData.filter(i => i.name !== 'Other').map((item, idx) => (
              <div
                key={item.name}
                className={cn(
                  "flex items-center justify-between text-[12px] transition-all rounded-lg p-1",
                  activeAppIndex === idx ? "bg-slate-50" : "bg-transparent"
                )}
                onMouseEnter={() => setActiveAppIndex(idx)}
                onMouseLeave={() => setActiveAppIndex(null)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-6 w-1 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className={cn("text-slate-500 truncate max-w-[200px] font-medium", activeAppIndex === idx && "text-slate-900")}>{item.name}</span>
                </div>
                <span className={cn("text-slate-700 font-bold ml-4", activeAppIndex === idx && "text-slate-900")}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Attendance Chart ──────────────────────────────────────────────────────────

function AttendanceSection() {
  return (
    <Card className="p-6 border-none shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Attendance</h3>
          <p className="text-[11px] text-slate-400">Overview of the attendance for the last 07 days</p>
        </div>
        <ExternalLink className="h-5 w-5 text-slate-300 cursor-pointer" />
      </div>
      <div className="mb-4 flex gap-5">
        <LegendDot color="bg-green-400" label="Present" />
        <LegendDot color="bg-pink-400" label="On Leave" />
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={attendanceData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dx={-8} />
            <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="present" fill="#4ADE80" radius={[4, 4, 0, 0]} barSize={22} />
            <Bar dataKey="absent" fill="#F472B6" radius={[4, 4, 0, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-slate-100"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <button className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-slate-100"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </Card>
  );
}

// ── Productive Graph ──────────────────────────────────────────────────────────

function ProductiveGraph({ data }: { data: typeof lineDataOrg }) {
  return (
    <Card className="p-6 border-none shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Productive vs Unproductive Graph</h3>
          <p className="text-[11px] text-slate-400">Overview of the time spent by the members for the selected date range</p>
        </div>
        <ExternalLink className="h-5 w-5 text-slate-300 cursor-pointer" />
      </div>
      <div className="mb-4 flex gap-5">
        <LegendDot color="bg-green-400" label="Productive" />
        <LegendDot color="bg-red-400" label="Unproductive" />
        <LegendDot color="bg-orange-400" label="Neutral" />
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dx={-8} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="productive" stroke="#4ADE80" strokeWidth={2.5} dot={{ r: 4, fill: '#4ADE80', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="unproductive" stroke="#F87171" strokeWidth={2.5} dot={{ r: 4, fill: '#F87171', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="neutral" stroke="#FB923C" strokeWidth={2.5} dot={{ r: 4, fill: '#FB923C', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-slate-100"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <button className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-slate-100"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </Card>
  );
}

// ── Top/Less Productive Sidebar Cards ─────────────────────────────────────────

function ProductivitySideCards({
  topMembers, lessMembers,
}: {
  topMembers: { name: string; dept?: string }[];
  lessMembers: { name: string; dept?: string }[];
}) {
  return (
    <div className="space-y-5">
      <Card className="p-5 border-none shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-green-500" />
            <h3 className="text-[13px] font-bold text-slate-900">Top Productive</h3>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
        <div className="space-y-4">
          {topMembers.map((m) => <MemberItem key={m.name} name={m.name} dept={m.dept} />)}
        </div>
      </Card>

      <Card className="p-5 border-none shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-red-500 rotate-180" />
            <h3 className="text-[13px] font-bold text-slate-900">Less Productive</h3>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
        <div className="space-y-4">
          {lessMembers.map((m) => <MemberItem key={m.name} name={m.name} dept={m.dept} />)}
        </div>
      </Card>
    </div>
  );
}


function OrganizationView() {
  return (
    <div className="space-y-6">
      {/* Connected Now + Side Stats */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 ">
        <div className="lg:col-span-9 bg-white p-5 rounded-xl shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-slate-900">Connected Now</h3>
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={<Users2 className="h-5 w-5 text-purple-600" />} value="51 members" label="All Devices" iconBg="bg-purple-50" />
            <StatCard icon={<Check className="h-5 w-5 text-green-600" />} value="2 members" label="Active Signal" iconBg="bg-green-50" />
            <StatCard icon={<X className="h-5 w-5 text-slate-400" />} value="49 members" label="No Signal" iconBg="bg-slate-100" />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-2.5">
          <SideMiniStat label="Total Active hours" value="1127:49:27 hrs" color="blue" icon={<Clock className="h-4 w-4 text-blue-500" />} />
          <SideMiniStat label="Total Productive hours" value="286:36:19 hrs" color="green" icon={<TrendingUp className="h-4 w-4 text-green-500" />} />
          <SideMiniStat label="Total Unproductive hours" value="--:--:-- hrs" color="pink" icon={<Activity className="h-4 w-4 text-pink-500" />} />
          <SideMiniStat label="Total Neutral hours" value="841:13:08 hrs" color="orange" icon={<XCircle className="h-4 w-4 text-orange-500" />} />
        </div>
      </div>

      {/* Graph + Top/Less Productive */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <ProductiveGraph data={lineDataOrg} />
        </div>
        <div className="lg:col-span-3">
          <ProductivitySideCards
            topMembers={[{ name: 'Adoreen', dept: 'Sales' }, { name: 'Arsh Saiyed' }, { name: 'Fatima' }]}
            lessMembers={[{ name: 'Lekisha', dept: 'Sales' }, { name: 'prasad pawar', dept: 'Sales' }]}
          />
        </div>
      </div>

      <WebAppsSection webData={webDataOrg} appData={appDataOrg} />
      <AttendanceSection />
    </div>
  );
}

function TeamView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-slate-900">Connected Now</h3>
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={<Users2 className="h-5 w-5 text-purple-600" />} value="28 members" label="All Devices" iconBg="bg-purple-50" />
            <StatCard icon={<Check className="h-5 w-5 text-green-600" />} value="19 members" label="Active Signal" iconBg="bg-green-50" />
            <StatCard icon={<X className="h-5 w-5 text-slate-400" />} value="9 members" label="No Signal" iconBg="bg-slate-100" />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-2.5">
          <SideMiniStat label="Total Active hours" value="710:53:48 hrs" color="blue" icon={<Clock className="h-4 w-4 text-blue-500" />} />
          <SideMiniStat label="Total Productive hours" value="146:06:35 hrs" color="green" icon={<TrendingUp className="h-4 w-4 text-green-500" />} />
          <SideMiniStat label="Total Unproductive hours" value="--:--:-- hrs" color="pink" icon={<Activity className="h-4 w-4 text-pink-500" />} />
          <SideMiniStat label="Total Neutral hours" value="564:47:13 hrs" color="orange" icon={<XCircle className="h-4 w-4 text-orange-500" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <ProductiveGraph data={lineDataTeam} />
        </div>
        <div className="lg:col-span-3">
          <ProductivitySideCards
            topMembers={[{ name: 'Fatima' }, { name: 'Arsh Saiyed' }, { name: 'pournima' }]}
            lessMembers={[{ name: 'Abhishek Sadhu' }, { name: 'Alfaiz khatri' }]}
          />
        </div>
      </div>

      <WebAppsSection webData={webDataTeam} appData={appDataTeam} />
      <AttendanceSection />
    </div>
  );
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
                <h3 className="text-[15px] font-bold text-slate-900">Productive vs Unproductive Graph</h3>
                <p className="text-[11px] text-slate-400">Overview of the time spent by the members for the selected date range</p>
              </div>
              <ExternalLink className="h-5 w-5 text-slate-300 cursor-pointer" />
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
        <div className="flex items-center justify-between border-b border-slate-50 p-5">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Time Tracker Report</h3>
            <p className="text-[11px] text-slate-400">
              Total Productivity : <span className="font-bold text-slate-900">0hrs 0Min 0Sec</span>
            </p>
          </div>
          <ExternalLink className="h-5 w-5 text-slate-300 cursor-pointer" />
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
  const [activeView, setActiveView] = useState<'org' | 'team' | 'ind'>('org');

  return (
    <DashboardLayout>
      {/* View Switcher + Date Row */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1 border border-slate-100 overflow-x-auto whitespace-nowrap w-full lg:w-auto relative">
          {[
            { key: 'org', icon: <Users2 className="h-3.5 w-3.5" />, label: 'Organization View' },
            { key: 'team', icon: <Users className="h-3.5 w-3.5" />, label: 'Team View' },
            { key: 'ind', icon: <User className="h-3.5 w-3.5" />, label: 'Individual View' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as 'org' | 'team' | 'ind')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-bold transition-all',
                activeView === key
                  ? 'bg-white text-[#5E35B1] shadow-sm border border-[#5E35B1]/20'
                  : 'text-slate-500 hover:text-slate-900',
              )}
            >
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-md transition-colors',
                activeView === key ? 'text-[#5E35B1]' : 'text-slate-400',
              )}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* Date + Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          {activeView !== 'org' && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm cursor-pointer min-w-[170px]">
              <Search className="h-3.5 w-3.5 text-slate-300" />
              <span className="flex-1 text-[12px] text-slate-500">Yash sapkale</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm cursor-pointer">
            <span className="text-[12px] font-medium text-slate-600">2026-03-27</span>
            <span className="text-slate-300 text-xs">—</span>
            <span className="text-[12px] font-medium text-slate-600">2026-04-02</span>
            <Calendar className="ml-1 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Trial Banner */}
      <div className="mb-6 rounded-xl bg-[#5E35B1] py-2.5 text-center text-[13px] font-bold text-white shadow-lg shadow-purple-500/20">
        The trial will expire in 6 days.
      </div>

      {activeView === 'org' && <OrganizationView />}
      {activeView === 'team' && <TeamView />}
      {activeView === 'ind' && <IndividualView />}
    </DashboardLayout>
  );
}
