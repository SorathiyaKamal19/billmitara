import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SubscriptionExpiredPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user?.role === 'superadmin') return <Navigate to="/superadmin" replace />;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-white p-6 text-gray-950 shadow-2xl dark:bg-gray-950 dark:text-white">
        <div className="grid size-14 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <ShieldAlert size={28} />
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-widest text-red-600">Subscription over</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Your subscription is over.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Please contact admin to renew your BillMitara access. Once admin enables your subscription, you can sign in and continue using the application.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="btn-primary" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
          <Link className="btn-soft" to="/login">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
