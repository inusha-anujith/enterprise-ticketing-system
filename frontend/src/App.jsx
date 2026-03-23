import { useState, useEffect } from 'react';
// 1. IMPORT ROUTER TOOLS
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- NEW COMPONENT: The Analytics Page ---
// Instead of making a whole new file, we can build a mini-page right here to learn how it works!
function Analytics() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics & Reports</h2>
      <p className="text-gray-500">Charts and graphs will go here in the future!</p>
      
      {/* A fake bar chart just to make it look cool for now */}
      <div className="mt-12 flex justify-center items-end space-x-4 h-48 border-b-2 border-gray-200 pb-2">
        <div className="h-16 w-12 bg-blue-200 rounded-t-md"></div>
        <div className="h-32 w-12 bg-blue-400 rounded-t-md"></div>
        <div className="h-24 w-12 bg-blue-300 rounded-t-md"></div>
        <div className="h-44 w-12 bg-blue-600 rounded-t-md"></div>
      </div>
    </div>
  );
}


function App() {
  // --- REACT STATE ---
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', customer_id: 1 });
  
  // This tool lets us know what URL the user is currently looking at
  const location = useLocation();

  // --- DATA FETCHING & ACTIONS ---
  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) { console.error("Error fetching:", error); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault(); 
    try {
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsModalOpen(false); 
        setFormData({ subject: '', description: '', customer_id: 1 }); 
        fetchTickets(); 
      }
    } catch (error) { console.error("Failed:", error); }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tickets/${ticketId}/resolve`, { method: 'PUT' });
      if (response.ok) fetchTickets();
    } catch (error) { console.error("Failed:", error); }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold tracking-wider border-b border-slate-700">
          APEX<span className="text-blue-500">DESK</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* We replace <a href> with <Link to> so React handles the routing instantly */}
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

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="flex justify-between items-center p-6 bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">
             {/* Dynamic Title based on the URL! */}
             {location.pathname === '/analytics' ? 'Analytics Dashboard' : 'Support Overview'}
          </h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              + New Ticket
            </button>
            <div className="h-10 w-10 bg-slate-300 rounded-full border-2 border-slate-800"></div>
          </div>
        </header>

        {/* --- THE ROUTER SCREEN --- */}
        {/* This <Routes> block acts like a TV Screen. It changes the channel based on the URL! */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            
            {/* CHANNEL 1: The Main Dashboard (URL: "/") */}
            <Route path="/" element={
              <>
                {/* STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-blue-500">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Tickets</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{tickets.length}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-red-500">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Urgent Action Required</h3>
                    {/* Bug fixed from earlier! */}
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-green-500">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Resolved Tickets</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {tickets.filter(t => t.status === 'Resolved').length}
                    </p>
                  </div>
                </div>

                {/* TICKET BOARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Active Support Tickets</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {tickets.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No tickets found. The queue is clear!</p>
                    ) : (
                      tickets.map((ticket) => (
                        <div key={ticket.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition duration-200">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{ticket.priority} Priority</span>
                              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{ticket.status}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                            <p className="text-gray-600 text-sm">{ticket.description}</p>
                          </div>
                          
                          <div className="mt-4 md:mt-0 md:ml-6 flex items-center space-x-2">
                            <p className="text-xs text-gray-400 mr-4">Ticket #{ticket.id}</p>
                            {ticket.status !== 'Resolved' && (
                              <button onClick={() => handleResolveTicket(ticket.id)} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 text-sm font-bold rounded-lg transition">
                                ✓ Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            } />

            {/* CHANNEL 2: The Analytics Page (URL: "/analytics") */}
            <Route path="/analytics" element={<Analytics />} />

          </Routes>
        </main>
      </div>

      {/* --- THE POP-UP MODAL (Remains outside the router so it can open from any page!) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Create New Ticket</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Subject</label>
                <input type="text" required className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea required rows="4" className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;