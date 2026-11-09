// pages/Login.jsx
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, Field } from '../components/AuthCard';

// Demo accounts created by `npm run db:seed`, shown so reviewers can try every role
const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'customer@apexdesk.dev' },
  { label: 'Agent', email: 'agent@apexdesk.dev' },
  { label: 'Admin', email: 'admin@apexdesk.dev' },
];
const DEMO_PASSWORD = 'Password123';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const signIn = async (emailValue, passwordValue) => {
    setSubmitting(true);
    setError('');
    try {
      await login(emailValue, passwordValue);
      // Go back to the page they originally asked for, or the dashboard
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  return (
    <AuthCard title="Sign in to ApexDesk">
      {error && <p className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="submit" disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4 text-center">
        New customer? <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
      </p>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Try a demo account</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button key={account.email} type="button" disabled={submitting}
              onClick={() => signIn(account.email, DEMO_PASSWORD)}
              className="py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition">
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </AuthCard>
  );
}
