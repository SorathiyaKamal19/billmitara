import { FormEvent, useState } from 'react';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { api } from '../api/client';
import { LanguageSelector } from '../components/LanguageSelector';
import { PasswordInput } from '../components/PasswordInput';
import { useLanguage } from '../context/LanguageContext';

const emailSchema = yup.object({
  email: yup.string().trim().email('Enter a valid email address').required('Email is required')
});

const resetSchema = yup.object({
  otp: yup.string().matches(/^\d{6}$/, 'Enter the 6-digit OTP').required('OTP is required'),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm your password')
});

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const values = await emailSchema.validate({ email });
      const { data } = await api.post('/auth/forgot-password', values);
      setEmail(values.email);
      setStep('reset');
      toast.success(data.message);
    } catch (error: any) {
      toast.error(
        error.name === 'ValidationError'
          ? error.message
          : error.response?.data?.message || t('OTP મોકલી શકાયો નહીં', 'Could not send OTP')
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const values = await resetSchema.validate(
        { otp, newPassword, confirmPassword },
        { abortEarly: false }
      );
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp: values.otp,
        newPassword: values.newPassword
      });
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(
        error.name === 'ValidationError'
          ? error.errors[0]
          : error.response?.data?.message || t('પાસવર્ડ રીસેટ થઈ શક્યો નહીં', 'Could not reset password')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.24),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.22),_transparent_38%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/login" className="btn-soft">
            <ArrowLeft size={17} /> {t('લૉગિન', 'Login')}
          </Link>
          <LanguageSelector />
        </div>

        <div className="mb-7">
          <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            {step === 'email' ? <Mail size={26} /> : <ShieldCheck size={26} />}
          </div>
          <h1 className="text-3xl font-black">
            {step === 'email'
              ? t('પાસવર્ડ ભૂલી ગયા?', 'Forgot password?')
              : t('તમારો OTP દાખલ કરો', 'Enter your OTP')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {step === 'email'
              ? t(
                  'તમારા એકાઉન્ટનો ઇમેઇલ દાખલ કરો. અમે Gmail પર છ અંકનો OTP મોકલીશું.',
                  'Enter the email linked to your account. We will send a six-digit OTP to your Gmail inbox.'
                )
              : t(
                  `${email} પર મોકલેલો OTP દાખલ કરો. કોડ 10 મિનિટમાં સમાપ્ત થશે.`,
                  `Enter the OTP sent to ${email}. The code expires in 10 minutes.`
                )}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={requestOtp} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('ઇમેઇલ', 'Email address')}</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="input h-12 pl-10"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@gmail.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </label>
            <button className="btn-primary h-12 w-full" disabled={loading}>
              <Mail size={18} />
              {loading ? t('મોકલી રહ્યા છીએ...', 'Sending...') : t('OTP મોકલો', 'Send OTP')}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('છ અંકનો OTP', 'Six-digit OTP')}</span>
              <input
                className="input h-14 text-center text-2xl font-black tracking-[0.45em]"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('નવો પાસવર્ડ', 'New password')}</span>
              <PasswordInput
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('પાસવર્ડની પુષ્ટિ કરો', 'Confirm password')}</span>
              <PasswordInput
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="btn-primary h-12 w-full" disabled={loading}>
              <KeyRound size={18} />
              {loading ? t('રીસેટ થઈ રહ્યું છે...', 'Resetting...') : t('પાસવર્ડ રીસેટ કરો', 'Reset password')}
            </button>
            <button
              type="button"
              className="btn-soft w-full"
              onClick={() => {
                setStep('email');
                setOtp('');
              }}
              disabled={loading}
            >
              {t('ઇમેઇલ બદલો અથવા OTP ફરી મોકલો', 'Change email or resend OTP')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
