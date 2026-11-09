// components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';

// WHY WE DO THIS: By passing 'location' as a prop, the Sidebar knows which URL is active 
// so it can highlight the correct button in blue.
export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold tracking-wider border-b border-slate-700">
        APEX<span className="text-blue-500">DESK</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link 
          to="/" 
          className={`block py-2.5 px-4 rounded-lg font-medium transition ${location.pathname === '/' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/analytics" 
          className={`block py-2.5 px-4 rounded-lg font-medium transition ${location.pathname === '/analytics' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          Analytics
        </Link>
      </nav>
    </div>
  );
}