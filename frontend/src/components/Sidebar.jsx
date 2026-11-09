// components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// NavLink knows whether its URL is the current page and passes isActive to className,
// so we no longer need useLocation() to highlight the active link.
const linkClass = ({ isActive }) =>
  `block whitespace-nowrap py-2 px-3 md:py-2.5 md:px-4 text-sm md:text-base rounded-lg font-medium transition ${
    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
  }`;

export default function Sidebar() {
  const { user, isStaff, logout } = useAuth();

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white flex md:flex-col shrink-0">
      <div className="p-3 md:p-6 text-lg md:text-2xl font-bold tracking-wider md:border-b border-slate-700 self-center md:self-auto">
        APEX<span className="text-blue-500">DESK</span>
      </div>

      <nav className="flex-1 min-w-0 flex md:block items-center gap-1 p-2 md:p-4 md:space-y-2">
        <NavLink to="/" end className={linkClass}>
          {isStaff ? <><span className="hidden md:inline">Ticket </span>Queue</> : <><span className="hidden md:inline">My </span>Tickets</>}
        </NavLink>
        {isStaff && (
          <NavLink to="/analytics" className={linkClass}>
            Analytics
          </NavLink>
        )}
      </nav>

      <div className="p-2 md:p-4 md:border-t border-slate-700 flex md:block items-center gap-3">
        <div className="hidden md:block mb-3">
          <p className="font-semibold truncate">{user.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full whitespace-nowrap text-left py-2 px-3 md:px-4 text-sm md:text-base rounded-lg text-slate-300 hover:bg-slate-800 transition"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
