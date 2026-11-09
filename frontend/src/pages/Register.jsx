// pages/Register.jsx
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, Field } from '../components/AuthCard';

export default function Register() {
  const { user, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // After registering, the user is logged in, and this sends them to the dashboard
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create a customer account">
      {error && <p className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="name" label="Full name" value={name} onChange={setName} autoComplete="name" />
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field id="password" label="Password (at least 8 characters)" type="password" value={password}
          onChange={setPassword} autoComplete="new-password" />
        <button type="submit" disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}
