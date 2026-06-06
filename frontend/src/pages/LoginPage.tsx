import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ChefHat, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';

const demoUsers = [
  ['Owner', 'owner@poss.local'],
  ['Manager', '+919999999002'],
  ['Waiter', '+919999999003'],
  ['Chef', '+919999999004']
];

const loginSchema = yup.object({
  identifier: yup.string().trim().required('Email or mobile number is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('owner@poss.local');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const values = await loginSchema.validate({ identifier, password }, { abortEarly: false });
      await login(values.identifier, values.password);
      navigate('/');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/60 bg-white/80 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/80 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[420px] bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center p-6 text-white sm:min-h-[560px] sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/45 to-teal-950/45" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-lg bg-saffron"><ChefHat /></div>
              <div>
                <p className="text-2xl font-black">POSS</p>
                <p className="text-sm text-white/75">Smart Restaurant POS System</p>
              </div>
            </div>
            <div>
              <h1 className="max-w-xl text-3xl font-black tracking-tight md:text-5xl">Modern POS for restaurants, cafes, and cloud kitchens.</h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">Real-time orders, WhatsApp billing, kitchen screens, menu control, and owner analytics in one place.</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex justify-end">
            <LanguageSelector />
          </div>
          <p className="text-2xl font-black">Welcome back</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in with owner email or staff mobile number.</p>
          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Email or mobile</span>
              <div className="relative">
                <LogIn className="absolute left-3 top-3 text-gray-400" size={18} />
                <input className="input pl-10" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input className="input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>
            </label>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Login'}</button>
            <Link to="/register-owner" className="btn-soft w-full justify-center">Create owner account</Link>
          </div>
          <div className="mt-8 grid gap-2">
            {demoUsers.map(([label, demoLogin]) => (
              <button key={demoLogin} type="button" className="btn-soft justify-between" onClick={() => setIdentifier(demoLogin)}>
                <span>{label} demo</span><span className="text-xs text-gray-400">{demoLogin}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
