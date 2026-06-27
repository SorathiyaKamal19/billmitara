import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, ChefHat, LogIn, Mail, ReceiptText, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { PasswordInput } from '../components/PasswordInput';
import { useLanguage } from '../context/LanguageContext';

const REMEMBER_IDENTIFIER_KEY = 'poss_remember_identifier';

const loginSchema = yup.object({
  identifier: yup.string().trim().required('Email or mobile number is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

export function LoginPage() {
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(() => localStorage.getItem(REMEMBER_IDENTIFIER_KEY) || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('poss_remember_me') !== 'false');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function handleRememberChange(checked: boolean) {
    setRememberMe(checked);
    localStorage.setItem('poss_remember_me', checked ? 'true' : 'false');
    if (checked && identifier.trim()) {
      localStorage.setItem(REMEMBER_IDENTIFIER_KEY, identifier.trim());
    } else if (!checked) {
      localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const values = await loginSchema.validate({ identifier, password }, { abortEarly: false });
      if (rememberMe) {
        localStorage.setItem(REMEMBER_IDENTIFIER_KEY, values.identifier);
      } else {
        localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
      }
      await login(values.identifier, values.password, rememberMe);
      toast.success(t('લૉગિન સફળ થયું', 'Login successful'));
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
              <div className="grid size-12 place-items-center rounded-xl bg-white/15">
                <img src="../../public/favicon.svg" alt="BillMitara" className="size-9" />
              </div>
              <div>
                <p className="text-2xl font-black">BillMitara</p>
                <p className="text-sm text-white/70">{t('Smart Restaurant POS', 'Smart Restaurant POS')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-200">
                {t('Run your restaurant with clarity', 'Run your restaurant with clarity')}
              </p>
              <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight">
                {t('From order to bill, everything in one place.', 'From order to bill, everything in one place.')}
              </h1>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  [ReceiptText, t('Fast billing', 'Fast billing')],
                  [ChefHat, t('Live kitchen orders', 'Live kitchen orders')],
                  [BarChart3, t('Business reports', 'Business reports')],
                  [ShieldCheck, t('Secure staff access', 'Secure staff access')]
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
              <div className="grid size-11 place-items-center rounded-xl bg-teal-600 text-white">
                <ChefHat />
              </div>
              <p className="text-2xl font-black">BillMitara</p>
            </div>
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">{t('Secure sign in', 'Secure sign in')}</p>
          <h1 className="mt-2 text-4xl font-black">{t('Welcome back', 'Welcome back')}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t('Sign in with your email address or registered mobile number.', 'Sign in with your email address or registered mobile number.')}
          </p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('Email or mobile number', 'Email or mobile number')}</span>
              <div className="relative">
                {identifier.includes('@') ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                ) : (
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                )}
                <input
                  className="input h-12 pl-10"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  onBlur={() => {
                    if (rememberMe && identifier.trim()) localStorage.setItem(REMEMBER_IDENTIFIER_KEY, identifier.trim());
                  }}
                  placeholder={t('name@gmail.com or +91...', 'name@gmail.com or +91...')}
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('Password', 'Password')}</span>
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                showLockIcon
                className="h-12"
                showLabel={t('Show password', 'Show password')}
                hideLabel={t('Hide password', 'Hide password')}
                autoComplete="current-password"
                required
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => handleRememberChange(event.target.checked)}
                  className="size-4 rounded border-gray-300 text-teal-700 accent-teal-700 focus:ring-teal-600"
                />
                <span>{t('Remember me', 'Remember me')}</span>
              </label>
              <Link className="font-bold text-teal-700 hover:underline" to="/forgot-password">
                {t('Forgot password?', 'Forgot password?')}
              </Link>
            </div>

            <button disabled={loading} className="btn-primary h-12 w-full">
              <LogIn size={18} />
              {loading ? t('Signing in...', 'Signing in...') : t('Sign in', 'Sign in')}
            </button>
            <p className="text-center text-sm text-gray-500">
              {t('New restaurant account?', 'New restaurant account?')}{' '}
              <Link to="/register-owner" className="font-bold text-teal-700 hover:underline">
                {t('Create owner account', 'Create owner account')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
