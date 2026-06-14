import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, ChefHat, LogIn, Mail, ReceiptText, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { PasswordInput } from '../components/PasswordInput';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.25),_transparent_38%)]" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-gray-950 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-950 p-10 text-white lg:block">
          <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10 bg-white/5" />
          <div className="absolute -bottom-32 -left-20 size-96 rounded-full border border-white/10 bg-blue-400/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-white/15"><ChefHat /></div>
              <div>
                <p className="text-2xl font-black">BillMitara</p>
                <p className="text-sm text-white/70">{t('સ્માર્ટ રેસ્ટોરન્ટ POS', 'Smart Restaurant POS')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-200">
                {t('રેસ્ટોરન્ટ સરળતાથી ચલાવો', 'Run your restaurant with clarity')}
              </p>
              <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight">
                {t('ઓર્ડરથી બિલ સુધી, બધું એક જગ્યાએ.', 'From order to bill, everything in one place.')}
              </h1>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  [ReceiptText, t('ઝડપી બિલિંગ', 'Fast billing')],
                  [ChefHat, t('લાઇવ કિચન ઓર્ડર', 'Live kitchen orders')],
                  [BarChart3, t('વ્યવસાય રિપોર્ટ', 'Business reports')],
                  [ShieldCheck, t('સુરક્ષિત સ્ટાફ ઍક્સેસ', 'Secure staff access')]
                ].map(([Icon, label]) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4" key={String(label)}>
                    <Icon size={20} className="text-teal-200" />
                    <span className="font-bold">{label as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="flex min-h-[650px] flex-col justify-center p-6 sm:p-10 lg:p-14">
          <div className="mb-6 flex justify-end">
            <LanguageSelector />
          </div>
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-teal-600 text-white"><ChefHat /></div>
              <p className="text-2xl font-black">BillMitara</p>
            </div>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">{t('સુરક્ષિત લૉગિન', 'Secure sign in')}</p>
          <h1 className="mt-2 text-4xl font-black">{t('ફરી સ્વાગત છે', 'Welcome back')}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t('તમારા ઇમેઇલ અથવા નોંધાયેલ મોબાઇલ નંબરથી લૉગિન કરો.', 'Sign in with your email address or registered mobile number.')}
          </p>
          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('ઇમેઇલ અથવા મોબાઇલ નંબર', 'Email or mobile number')}</span>
              <div className="relative">
                {identifier.includes('@')
                  ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  : <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                <input
                  className="input h-12 pl-10"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('name@gmail.com અથવા +91...', 'name@gmail.com or +91...')}
                  autoComplete="username"
                  required
                />
              </div>
            </label>
            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold">{t('પાસવર્ડ', 'Password')}</span>
                <Link className="text-sm font-bold text-teal-700 hover:underline" to="/forgot-password">
                  {t('પાસવર્ડ ભૂલી ગયા?', 'Forgot password?')}
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showLockIcon
                className="h-12"
                showLabel={t('પાસવર્ડ બતાવો', 'Show password')}
                hideLabel={t('પાસવર્ડ છુપાવો', 'Hide password')}
                autoComplete="current-password"
                required
              />
            </label>
            <button disabled={loading} className="btn-primary h-12 w-full">
              <LogIn size={18} />
              {loading ? t('લૉગિન થઈ રહ્યું છે...', 'Signing in...') : t('લૉગિન', 'Sign in')}
            </button>
            <p className="text-center text-sm text-gray-500">
              {t('નવું રેસ્ટોરન્ટ એકાઉન્ટ?', 'New restaurant account?')}{' '}
              <Link to="/register-owner" className="font-bold text-teal-700 hover:underline">
                {t('માલિક એકાઉન્ટ બનાવો', 'Create owner account')}
              </Link>
            </p>
          </div>
          {/* {import.meta.env.DEV && (
          <div className="mt-8 grid gap-2 border-t border-gray-200 pt-6 dark:border-white/10">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Local demo accounts</p>
            {demoUsers.map(([label, demoLogin]) => (
              <button key={demoLogin} type="button" className="btn-soft justify-between" onClick={() => setIdentifier(demoLogin)}>
                <span>{label} demo</span><span className="text-xs text-gray-400">{demoLogin}</span>
              </button>
            ))}
          </div>
          )} */}
        </form>
      </div>
    </div>
  );
}
