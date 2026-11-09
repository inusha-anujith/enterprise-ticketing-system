// pages/TicketDetail.jsx
// One ticket: description, conversation, details, history. Staff can change status and assign.
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge, SlaLabel } from '../components/Badges';
import { formatDateTime, timeAgo } from '../utils/format';

// Mirrors ALLOWED_TRANSITIONS on the server. The server still checks; this only decides which buttons to show.
const NEXT_STATUSES = {
  'Open': [{ to: 'In Progress', label: 'Start working' }, { to: 'Resolved', label: 'Resolve' }],
  'In Progress': [{ to: 'Resolved', label: 'Resolve' }, { to: 'Open', label: 'Move back to Open' }],
  'Resolved': [{ to: 'Open', label: 'Reopen' }],
};

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 text-right">{children}</dd>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const loadTicket = useCallback(async () => {
    try {
      setTicket(await api(`/api/tickets/${id}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (isStaff) api('/api/users/agents').then(setAgents).catch(() => setAgents([]));
  }, [isStaff]);

  // Runs an action, then reloads the ticket so the history timeline updates too
  const runAction = async (request) => {
    setBusy(true);
    setActionError('');
    try {
      await request();
      await loadTicket();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status) =>
    runAction(() => api(`/api/tickets/${id}/status`, { method: 'PATCH', body: { status } }));

  const assign = (e) => {
    const agentId = e.target.value ? Number(e.target.value) : null;
    runAction(() => api(`/api/tickets/${id}/assign`, { method: 'PATCH', body: { agentId } }));
  };

  const sendReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    runAction(async () => {
      await api(`/api/tickets/${id}/comments`, { method: 'POST', body: { body: reply } });
      setReply('');
    });
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-lg font-semibold text-gray-800">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline mt-3 inline-block">← Back to tickets</Link>
      </div>
    );
  }

  if (!ticket) return <p className="text-gray-500">Loading ticket…</p>;

  return (
    <>
      <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to tickets</Link>

      <header className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm text-gray-400 font-mono">#{ticket.id}</span>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <SlaLabel ticket={ticket} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{ticket.subject}</h1>
      </header>

      {actionError && <p className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{actionError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: description + conversation */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-3">
              {ticket.customer_name} opened this {timeAgo(ticket.created_at)}
            </p>
            <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-800 mb-4">Conversation</h2>
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">No replies yet.</p>
            ) : (
              <ul className="space-y-4 mb-6">
                {ticket.comments.map((c) => (
                  <li key={c.id}
                    className={`rounded-lg p-4 ${c.user_role === 'customer' ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <p className="text-sm mb-1">
                      <span className="font-semibold text-gray-900">{c.user_name}</span>
                      <span className="text-gray-500"> · {c.user_role === 'customer' ? 'Customer' : 'Support'} · {formatDateTime(c.created_at)}</span>
                    </p>
                    <p className="text-gray-800 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={sendReply}>
              <textarea rows="3" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000}
                placeholder="Write a reply…" aria-label="Reply"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500" />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={busy || !reply.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  Send reply
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT: actions, details, history */}
        <div className="space-y-6">
          {isStaff && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="font-bold text-gray-800">Actions</h2>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUSES[ticket.status].map(({ to, label }) => (
                  <button key={to} onClick={() => changeStatus(to)} disabled={busy}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition disabled:opacity-50 ${
                      to === 'Resolved' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <label htmlFor="assign" className="block text-sm text-gray-500 mb-1">Assigned agent</label>
                <select id="assign" value={ticket.assigned_agent_id ?? ''} onChange={assign} disabled={busy}
                  className="w-full border border-gray-300 bg-white p-2 rounded-lg">
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.open_tickets} open)
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-800 mb-2">Details</h2>
            <dl className="divide-y divide-gray-100">
              <DetailRow label="Customer">{ticket.customer_name}</DetailRow>
              <DetailRow label="Agent">{ticket.agent_name || 'Unassigned'}</DetailRow>
              <DetailRow label="Created">{formatDateTime(ticket.created_at)}</DetailRow>
              <DetailRow label="SLA deadline">{formatDateTime(ticket.sla_due_at)}</DetailRow>
              {ticket.resolved_at && <DetailRow label="Resolved">{formatDateTime(ticket.resolved_at)}</DetailRow>}
            </dl>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-800 mb-4">History</h2>
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {ticket.history.map((h) => (
                <li key={h.id} className="ml-4">
                  <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white ${
                    h.performed_by === 'System' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-sm text-gray-900">{h.action_performed}</p>
                  <p className="text-xs text-gray-500">{h.performed_by} · {formatDateTime(h.created_at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
