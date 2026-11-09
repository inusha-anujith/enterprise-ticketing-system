// components/AuthCard.jsx
// The centred card and input field shared by the login and register pages.

export function AuthCard({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <p className="text-center text-3xl font-bold tracking-wider text-white mb-6">
          APEX<span className="text-blue-500">DESK</span>
        </p>
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ id, label, type = 'text', value, onChange, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-1.5">{label}</label>
      <input id={id} type={type} required value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-blue-500" {...rest} />
    </div>
  );
}
