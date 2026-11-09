// components/NewTicketModal.jsx
import { useState } from 'react';
import { api } from '../api/client';

const EMPTY_FORM = { subject: '', description: '', priority: 'Normal' };

export default function NewTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // No customer_id here: the API takes it from the login token
      await api('/api/tickets', { method: 'POST', body: form });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Create New Ticket</h2>

        {error && <p className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">Subject</label>
            <input id="subject" type="text" required maxLength={255}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500"
              value={form.subject} onChange={update('subject')} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">Priority</label>
            <select id="priority"
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              value={form.priority} onChange={update('priority')}>
              <option value="Low">Low (response within 24 hours)</option>
              <option value="Normal">Normal (response within 4 hours)</option>
              <option value="High">High (response within 1 hour)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Description</label>
            <textarea id="description" required rows="4" maxLength={5000}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500"
              value={form.description} onChange={update('description')} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
