// components/Badges.jsx
// Small coloured labels used on the dashboard and the ticket page.
import { slaStatus } from '../utils/format';

const base = 'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap';

const PRIORITY_STYLES = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-gray-100 text-gray-700',
  Low: 'bg-slate-100 text-slate-500',
};

const STATUS_STYLES = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-800',
  'Resolved': 'bg-green-100 text-green-700',
};

const SLA_STYLES = {
  ok: 'text-gray-500',
  warn: 'text-amber-700',
  late: 'text-red-600',
  done: 'text-green-700',
};

export function PriorityBadge({ priority }) {
  return <span className={`${base} ${PRIORITY_STYLES[priority]}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`${base} ${STATUS_STYLES[status]}`}>{status}</span>;
}

export function SlaLabel({ ticket }) {
  const { label, tone } = slaStatus(ticket);
  return <span className={`text-xs font-medium ${SLA_STYLES[tone]}`}>{label}</span>;
}
