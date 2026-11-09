// pages/Dashboard.jsx

export default function Dashboard({ tickets, handleResolveTicket }) {
  return (
    <>
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
  );
}