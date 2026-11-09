import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// IMPORTING OUR COMPONENTS
import Sidebar from './components/Sidebar';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';

function App() {
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', customer_id: 1 });
  
  const location = useLocation();

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
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-6 bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">
             {location.pathname === '/analytics' ? 'Analytics Dashboard' : 'Support Overview'}
          </h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              + New Ticket
            </button>
            <div className="h-10 w-10 bg-slate-300 rounded-full border-2 border-slate-800"></div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            {/* PASSING PROPS TO DASHBOARD */}
            <Route path="/" element={
              <Dashboard tickets={tickets} handleResolveTicket={handleResolveTicket} />
            } />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>

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