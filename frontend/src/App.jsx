import { useState, useEffect } from 'react';

function App() {
  // --- 1. REACT STATE (The App's Memory) ---
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customer_id: 1 // Hardcoded for now
  });

  // --- 2. DATA FETCHING (Getting data from Backend) ---
  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // --- 3. FORM HANDLING (Sending data to Backend) ---
  const handleCreateTicket = async (e) => {
    e.preventDefault(); 

    try {
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false); 
        setFormData({ subject: '', description: '', customer_id: 1 }); 
        fetchTickets(); 
      }
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  // --- 4. TICKET ACTIONS (Updating data) ---
  const handleResolveTicket = async (ticketId) => {
    try {
      // Send a PUT request to our new backend route, attaching the specific ticket ID
      const response = await fetch(`http://localhost:3000/api/tickets/${ticketId}/resolve`, {
        method: 'PUT',
      });

      if (response.ok) {
        // If the database successfully updated, fetch the fresh list to update the screen!
        fetchTickets();
      }
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold tracking-wider border-b border-slate-700">
          APEX<span className="text-blue-500">DESK</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block py-2.5 px-4 bg-blue-600 rounded-lg font-medium">Dashboard</a>
          <a href="#" className="block py-2.5 px-4 hover:bg-slate-800 rounded-lg text-slate-300">All Tickets</a>
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="flex justify-between items-center p-6 bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">Support Overview</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              + New Ticket
            </button>
            <div className="h-10 w-10 bg-slate-300 rounded-full border-2 border-slate-800"></div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-blue-500">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Tickets</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">{tickets.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-red-500">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Urgent Action Required</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-green-500">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Resolved Tickets</h3>
              {/* Notice how we use .filter here to automatically count resolved tickets! */}
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
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {ticket.priority} Priority
                        </span>
                        
                        {/* The Status Badge automatically turns green if resolved! */}
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                      <p className="text-gray-600 text-sm">{ticket.description}</p>
                    </div>
                    
                    {/* --- THE NEW RESOLVE BUTTON IS HERE --- */}
                    <div className="mt-4 md:mt-0 md:ml-6 flex items-center space-x-2">
                      <p className="text-xs text-gray-400 mr-4">Ticket #{ticket.id}</p>
                      
                      {/* ONLY show the Resolve button if the ticket is not already resolved! */}
                      {ticket.status !== 'Resolved' && (
                        <button 
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 text-sm font-bold rounded-lg transition"
                        >
                          ✓ Resolve
                        </button>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --- THE POP-UP MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Create New Ticket</h2>
            
            <form onSubmit={handleCreateTicket}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;