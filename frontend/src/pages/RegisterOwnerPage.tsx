import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ChefHat,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  UserRound
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { PasswordInput } from '../components/PasswordInput';
import { useLanguage } from '../context/LanguageContext';

const ownerSchema = yup.object({
  name: yup.string().trim().min(2, 'Owner name is too short').required('Owner name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Owner email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  phone: yup.string().trim().min(6, 'Enter a valid mobile number').required('Owner mobile number is required'),
  restaurantName: yup.string().trim().min(2, 'Restaurant name is too short').required('Restaurant name is required'),
  restaurantPhone: yup.string().trim(),
  restaurantAddress: yup.string().trim()
});

export function RegisterOwnerPage() {
  const { registerOwner, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    restaurantName: '',
    restaurantPhone: '',
    restaurantAddress: ''
  });

  if (user) return <Navigate to="/" replace />;

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const values = await ownerSchema.validate(form, { abortEarly: false });
      await registerOwner(values);
      toast.success(t('માલિક એકાઉન્ટ બન્યું', 'Owner account created'));
      navigate('/');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(
          error.response?.data?.message ||
            t('માલિક એકાઉન્ટ બનાવી શકાયું નહીં', 'Could not create owner account')
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.25),_transparent_38%)]" />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-gray-950">
        <form
          onSubmit={submit}
          className="max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-10 lg:p-12"
        >
          <div className="mb-7 flex items-center justify-between gap-4">
            <Link to="/login" className="btn-soft">
              <ArrowLeft size={17} /> {t('લૉગિન', 'Login')}
            </Link>
            <LanguageSelector />
          </div>

          <div className="mb-8 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 p-5 text-white">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15">
              <ChefHat />
            </div>
            <div>
              <p className="text-2xl font-black">BillMitara</p>
              <p className="text-sm text-white/75">
                {t('સ્માર્ટ રેસ્ટોરન્ટ POS', 'Smart Restaurant POS')}
              </p>
            </div>
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            {t('માલિક નોંધણી', 'Owner registration')}
          </p>
          <h1 className="mt-2 text-4xl font-black">
            {t('તમારું રેસ્ટોરન્ટ વર્કસ્પેસ બનાવો', 'Create your restaurant workspace')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t(
              'માલિક અને રેસ્ટોરન્ટની વિગતો દાખલ કરો. પછી તમે સ્ટાફ અને POS સેટિંગ્સ ગોઠવી શકશો.',
              'Enter the owner and restaurant details. You can configure staff and POS settings after registration.'
            )}
          </p>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <UserRound size={19} />
              </div>
              <div>
                <h2 className="font-black">{t('માલિકની વિગતો', 'Owner details')}</h2>
                <p className="text-xs text-gray-500">
                  {t('તમારી સુરક્ષિત લૉગિન માહિતી', 'Your secure sign-in information')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">{t('માલિકનું નામ', 'Owner name')}</span>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input h-12 pl-10"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">{t('માલિકનો મોબાઇલ', 'Owner mobile')}</span>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input h-12 pl-10"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91..."
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">{t('ઇમેઇલ', 'Email address')}</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input h-12 pl-10"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="name@gmail.com"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">{t('પાસવર્ડ', 'Password')}</span>
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  showLockIcon
                  className="h-12"
                  minLength={8}
                  autoComplete="new-password"
                  showLabel={t('પાસવર્ડ બતાવો', 'Show password')}
                  hideLabel={t('પાસવર્ડ છુપાવો', 'Hide password')}
                  required
                />
              </label>
            </div>
          </section>

          <div className="my-8 border-t border-gray-200 dark:border-white/10" />

          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Building2 size={19} />
              </div>
              <div>
                <h2 className="font-black">{t('રેસ્ટોરન્ટની વિગતો', 'Restaurant details')}</h2>
                <p className="text-xs text-gray-500">
                  {t('તમારા બિલ અને POS પર દેખાતી માહિતી', 'Information shown on your POS and bills')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold">{t('રેસ્ટોરન્ટનું નામ', 'Restaurant name')}</span>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input h-12 pl-10"
                    value={form.restaurantName}
                    onChange={(e) => setField('restaurantName', e.target.value)}
                    autoComplete="organization"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  {t('રેસ્ટોરન્ટ ફોન (વૈકલ્પિક)', 'Restaurant phone (optional)')}
                </span>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input h-12 pl-10"
                    value={form.restaurantPhone}
                    onChange={(e) => setField('restaurantPhone', e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  {t('રેસ્ટોરન્ટ સરનામું (વૈકલ્પિક)', 'Restaurant address (optional)')}
                </span>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input h-12 pl-10"
                    value={form.restaurantAddress}
                    onChange={(e) => setField('restaurantAddress', e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
              </label>
            </div>
          </section>

          <button disabled={loading} className="btn-primary mt-8 h-12 w-full text-base">
            <CheckCircle2 size={19} />
            {loading
              ? t('એકાઉન્ટ બની રહ્યું છે...', 'Creating account...')
              : t('માલિક એકાઉન્ટ બનાવો', 'Create owner account')}
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            {t('પહેલેથી એકાઉન્ટ છે?', 'Already have an account?')}{' '}
            <Link to="/login" className="font-bold text-teal-700 hover:underline">
              {t('લૉગિન કરો', 'Sign in')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
