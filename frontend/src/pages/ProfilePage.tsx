import { FormEvent, useState } from 'react';
import { KeyRound, Save, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PasswordInput } from '../components/PasswordInput';

const profileSchema = yup.object({
  name: yup.string().trim().min(2, 'Name is too short').required('Name is required')
});

const passwordSchema = yup.object({
  currentPassword: yup.string().min(8, 'Current password must be at least 8 characters').required('Current password is required'),
  newPassword: yup.string().min(8, 'New password must be at least 8 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'New password and confirm password must match').required('Confirm password is required')
});

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const values = await profileSchema.validate(profile, { abortEarly: false });
      const { data } = await api.patch('/auth/profile', values);
      updateUser(data);
      toast.success(t('પ્રોફાઇલ અપડેટ થઈ', 'Profile updated'));
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || t('પ્રોફાઇલ અપડેટ કરી શકાઈ નહીં', 'Could not update profile'));
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const values = await passwordSchema.validate(passwords, { abortEarly: false });
      await api.patch('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('પાસવર્ડ બદલાયો', 'Password changed'));
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || t('પાસવર્ડ બદલી શકાયો નહીં', 'Could not change password'));
      }
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-saffron">{t('એકાઉન્ટ', 'Account')}</p>
        <h1 className="text-3xl font-black tracking-tight">{t('વપરાશકર્તા પ્રોફાઇલ', 'User profile')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('તમારી વિગતો અને પાસવર્ડ અપડેટ કરો.', 'Update your details and password.')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="glass rounded-xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-saffron/10 text-saffron">
              <UserRound />
            </div>
            <div>
              <p className="text-xl font-black">{t('પ્રોફાઇલ વિગતો', 'Profile details')}</p>
              <p className="text-sm capitalize text-gray-500">{user?.role} at {user?.restaurant?.name}</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('નામ', 'Name')}</span>
              <input className="input" value={profile.name} onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('ઈમેઈલ', 'Email')}</span>
              <input className="input" value={user?.email || ''} disabled />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('મોબાઇલ', 'Mobile')}</span>
              <input className="input" value={user?.phone || ''} disabled />
            </label>
            <div className="flex justify-end">
              <button disabled={savingProfile} className="btn-primary">
                <Save size={17} />
                {savingProfile ? t('સાચવી રહ્યું છે...', 'Saving...') : t('પ્રોફાઇલ સાચવો', 'Save profile')}
              </button>
            </div>
          </div>
        </form>

        <form onSubmit={changePassword} className="glass rounded-xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <KeyRound />
            </div>
            <div>
              <p className="text-xl font-black">{t('પાસવર્ડ બદલો', 'Change password')}</p>
              <p className="text-sm text-gray-500">{t('ઓછામાં ઓછા 8 અક્ષરો વાપરો.', 'Use at least 8 characters.')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('હાલનો પાસવર્ડ', 'Current password')}</span>
              <PasswordInput value={passwords.currentPassword} onChange={(e) => setPasswords((current) => ({ ...current, currentPassword: e.target.value }))} minLength={8} autoComplete="current-password" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('નવો પાસવર્ડ', 'New password')}</span>
              <PasswordInput value={passwords.newPassword} onChange={(e) => setPasswords((current) => ({ ...current, newPassword: e.target.value }))} minLength={8} autoComplete="new-password" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('પાસવર્ડની પુષ્ટિ કરો', 'Confirm password')}</span>
              <PasswordInput value={passwords.confirmPassword} onChange={(e) => setPasswords((current) => ({ ...current, confirmPassword: e.target.value }))} minLength={8} autoComplete="new-password" required />
            </label>
            <div className="flex justify-end">
              <button disabled={savingPassword} className="btn-primary">
                <KeyRound size={17} />
                {savingPassword ? t('બદલી રહ્યું છે...', 'Changing...') : t('પાસવર્ડ બદલો', 'Change password')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
