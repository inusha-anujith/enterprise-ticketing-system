// utils/format.js
// The API sends times in UTC. new Date() converts them to the viewer's local time.

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatDuration(ms) {
  const minutes = Math.round(Math.abs(ms) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}

// Short SLA status for a ticket, e.g. { label: 'Due in 45 min', tone: 'ok' }
export function slaStatus(ticket) {
  if (ticket.status === 'Resolved') {
    return ticket.sla_breached
      ? { label: 'Resolved after SLA', tone: 'late' }
      : { label: 'Resolved within SLA', tone: 'done' };
  }
  const remaining = new Date(ticket.sla_due_at).getTime() - Date.now();
  if (ticket.sla_breached || remaining <= 0) {
    return { label: `SLA breached ${formatDuration(remaining)} ago`, tone: 'late' };
  }
  return { label: `Due in ${formatDuration(remaining)}`, tone: remaining < 30 * 60000 ? 'warn' : 'ok' };
}
