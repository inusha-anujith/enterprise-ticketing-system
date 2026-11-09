// pages/Analytics.jsx
// Real numbers from GET /api/tickets/stats. The charts are plain HTML + Tailwind
// (no chart library), so every bar is just a div whose height is a percentage.
import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Two series colours, chosen to stay distinguishable for colour-blind users
const CREATED_COLOR = '#2a78d6';
const RESOLVED_COLOR = '#eb6834';

function Kpi({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, children, action }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function LegendItem({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-gray-600">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

// Created vs resolved per day, as pairs of bars.
// Every other day is labelled, counting back from today so the latest day always has a label.
function DailyChart({ daily }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(1, ...daily.flatMap((d) => [d.created, d.resolved]));
  const label = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <div>
      <div className="flex gap-4 mb-3">
        <LegendItem color={CREATED_COLOR} label="Created" />
        <LegendItem color={RESOLVED_COLOR} label="Resolved" />
      </div>
      <div className="relative">
        {/* Tooltip for the hovered day */}
        {hovered !== null && (
          <div style={{ left: `${((hovered + 0.5) / daily.length) * 100}%` }}
            className="absolute -top-2 -translate-x-1/2 -translate-y-full bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 whitespace-nowrap">
            <p className="font-semibold">{label(daily[hovered].day)}</p>
            <p>Created: {daily[hovered].created} · Resolved: {daily[hovered].resolved}</p>
          </div>
        )}
        <div className="flex items-end gap-1 h-48 border-b border-gray-200">
          {daily.map((d, i) => (
            <div key={d.day}
              className={`flex-1 h-full flex items-end justify-center gap-[2px] rounded-t ${hovered === i ? 'bg-gray-100' : ''}`}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className="w-1/3 max-w-[14px] rounded-t" style={{ height: `${(d.created / max) * 100}%`, background: CREATED_COLOR }} />
              <div className="w-1/3 max-w-[14px] rounded-t" style={{ height: `${(d.resolved / max) * 100}%`, background: RESOLVED_COLOR }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-2 text-[11px] text-gray-500">
          {daily.map((d, i) => (
            <span key={d.day} className="flex-1 text-center">{(daily.length - 1 - i) % 2 === 0 ? label(d.day) : ''}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyTable({ daily }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="py-2 font-medium">Day</th>
          <th className="py-2 font-medium text-right">Created</th>
          <th className="py-2 font-medium text-right">Resolved</th>
        </tr>
      </thead>
      <tbody>
        {daily.map((d) => (
          <tr key={d.day} className="border-b border-gray-100">
            <td className="py-1.5">{d.day}</td>
            <td className="py-1.5 text-right">{d.created}</td>
            <td className="py-1.5 text-right">{d.resolved}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Open tickets per priority, as horizontal bars with the number printed next to each
function PriorityBars({ byPriority }) {
  const order = ['Urgent', 'High', 'Normal', 'Low'];
  const max = Math.max(1, ...order.map((p) => byPriority[p]));
  return (
    <ul className="space-y-3">
      {order.map((p) => (
        <li key={p} className="flex items-center gap-3 text-sm">
          <span className="w-16 text-gray-600">{p}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded">
            <div className="h-full rounded" style={{ width: `${(byPriority[p] / max) * 100}%`, background: CREATED_COLOR }} />
          </div>
          <span className="w-6 text-right font-semibold text-gray-900">{byPriority[p]}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    api('/api/tickets/stats').then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 text-red-700 p-4">{error}</p>;
  if (!stats) return <p className="text-gray-500">Loading analytics…</p>;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-500 mt-1">How the support team is performing against its SLAs.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total tickets" value={stats.total} hint={`${stats.byStatus.resolved} resolved`} />
        <Kpi label="SLA compliance" value={`${stats.slaComplianceRate}%`} hint="Handled before the deadline" />
        <Kpi label="Avg. resolution" value={stats.avgResolutionHours === null ? '–' : `${stats.avgResolutionHours} h`} hint="From creation to resolved" />
        <Kpi label="Breached & open" value={stats.breachedOpen} hint="Need attention now" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Tickets per day (last 14 days)"
            action={
              <button onClick={() => setShowTable(!showTable)} className="text-sm text-blue-600 hover:underline">
                {showTable ? 'Show chart' : 'Show table'}
              </button>
            }>
            {showTable ? <DailyTable daily={stats.daily} /> : <DailyChart daily={stats.daily} />}
          </Card>
        </div>

        <Card title="Open tickets by priority">
          <PriorityBars byPriority={stats.byPriority} />
        </Card>

        <div className="lg:col-span-3">
          <Card title="Agent workload">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Agent</th>
                  <th className="py-2 font-medium text-right">Open</th>
                  <th className="py-2 font-medium text-right">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {stats.agentWorkload.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{a.name}</td>
                    <td className="py-2 text-right">{a.openTickets}</td>
                    <td className="py-2 text-right">{a.resolvedTickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
