// pages/Dashboard.jsx
// Customers see their own tickets. Agents see the whole queue, with filters.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge, SlaLabel } from '../components/Badges';
import NewTicketModal from '../components/NewTicketModal';
import { timeAgo } from '../utils/format';

const REFRESH_EVERY_MS = 30000; // so SLA escalations appear without reloading

function StatCard({ label, value, accent, hint }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 border-l-4 ${accent}`}>
      <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, isStaff } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', mine: false });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Wait until the user stops typing for 300 ms before searching
  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput.trim() })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);
    if (filters.mine) params.set('mine', 'true');

    try {
      const [list, stats] = await Promise.all([
        api(`/api/tickets?${params}`),
        // Staff get server-side stats. Customers' cards are counted from all their tickets.
        isStaff ? api('/api/tickets/stats') : api('/api/tickets'),
      ]);
      setTickets(list);
      setSummary(
        isStaff
          ? stats
          : {
              open: stats.filter((t) => t.status === 'Open').length,
              inProgress: stats.filter((t) => t.status === 'In Progress').length,
              resolved: stats.filter((t) => t.status === 'Resolved').length,
            },
      );
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, isStaff]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  const setFilter = (field) => (e) =>
    setFilters({ ...filters, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const hasFilters = filters.status || filters.priority || filters.search || filters.mine;

  return (
    <>
      <header className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{isStaff ? 'Support Queue' : 'My Tickets'}</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user.name.split(' ')[0]}.</p>
        </div>
        {!isStaff && (
          <button onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            + New Ticket
          </button>
        )}
      </header>

      {/* STAT CARDS */}
      {summary && (
        <div className={`grid grid-cols-2 ${isStaff ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-6`}>
          {isStaff ? (
            <>
              <StatCard label="Waiting" value={summary.byStatus.open + summary.byStatus.inProgress}
                accent="border-l-blue-500" hint={`${summary.byStatus.inProgress} in progress`} />
              <StatCard label="SLA Breached" value={summary.breachedOpen}
                accent="border-l-red-500" hint="Still open past their deadline" />
              <StatCard label="Unassigned" value={summary.unassigned}
                accent="border-l-amber-500" hint="Need an agent" />
              <StatCard label="SLA Compliance" value={`${summary.slaComplianceRate}%`}
                accent="border-l-green-500" hint="Tickets handled on time" />
            </>
          ) : (
            <>
              <StatCard label="Open" value={summary.open} accent="border-l-blue-500" />
              <StatCard label="In Progress" value={summary.inProgress} accent="border-l-amber-500" />
              <StatCard label="Resolved" value={summary.resolved} accent="border-l-green-500" />
            </>
          )}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input type="search" placeholder="Search subject or description…" value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 bg-white p-2 rounded-lg focus:outline-none focus:border-blue-500" />
        <select value={filters.status} onChange={setFilter('status')} aria-label="Filter by status"
          className="border border-gray-300 bg-white p-2 rounded-lg">
          <option value="">All statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
        <select value={filters.priority} onChange={setFilter('priority')} aria-label="Filter by priority"
          className="border border-gray-300 bg-white p-2 rounded-lg">
          <option value="">All priorities</option>
          <option>Urgent</option>
          <option>High</option>
          <option>Normal</option>
          <option>Low</option>
        </select>
        {isStaff && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.mine} onChange={setFilter('mine')} />
            Assigned to me
          </label>
        )}
      </div>

      {/* TICKET LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error && <p className="p-4 bg-red-50 text-red-700 text-sm">{error}</p>}

        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            {hasFilters ? 'No tickets match these filters.' : isStaff ? 'The queue is clear!' : 'You have no tickets yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link to={`/tickets/${ticket.id}`}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 md:p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isStaff && <>{ticket.customer_name} · </>}
                      opened {timeAgo(ticket.created_at)}
                      {ticket.agent_name ? ` · assigned to ${ticket.agent_name}` : isStaff && ticket.status !== 'Resolved' ? ' · unassigned' : ''}
                    </p>
                  </div>
                  <SlaLabel ticket={ticket} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && <NewTicketModal onClose={() => setIsModalOpen(false)} onCreated={loadData} />}
    </>
  );
}
