import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Save, Trash2, UsersRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { api } from '../api/client';
import { ModulePermission, Role, User } from '../types';
import { PasswordInput } from '../components/PasswordInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useLanguage } from '../context/LanguageContext';
import { defaultPermissionsForRole, orderedPermissions } from '../utils/permissions';

type StaffRole = Exclude<Role, 'superadmin' | 'owner'>;

type StaffForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: StaffRole;
  isActive: boolean;
  permissions: ModulePermission[];
};

const emptyForm: StaffForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'waiter' as StaffRole,
  isActive: true,
  permissions: defaultPermissionsForRole('waiter')
};

export function StaffPage() {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editing = useMemo(() => staff.find((user) => user._id === editingId), [editingId, staff]);
  const staffSchema = useMemo(
    () =>
      yup.object({
        name: yup.string().trim().min(2, t('નામ ખૂબ ટૂંકું છે', 'Name is too short')).required(t('નામ જરૂરી છે', 'Name is required')),
        email: yup.string().trim().email(t('માન્ય ઇમેઇલ દાખલ કરો', 'Enter a valid email')).optional(),
        password: yup.string().when('$editing', {
          is: true,
          then: (schema) => schema.optional(),
          otherwise: (schema) =>
            schema
              .min(8, t('પાસવર્ડ ઓછામાં ઓછા 8 અક્ષરનો હોવો જોઈએ', 'Password must be at least 8 characters'))
              .required(t('પાસવર્ડ જરૂરી છે', 'Password is required'))
        }),
        phone: yup.string().trim().min(6, t('માન્ય મોબાઇલ નંબર દાખલ કરો', 'Enter a valid mobile number')).required(t('મોબાઇલ નંબર જરૂરી છે', 'Mobile number is required')),
        role: yup.mixed<StaffRole>().oneOf(['manager', 'waiter', 'chef']).required(t('ભૂમિકા જરૂરી છે', 'Role is required')),
        isActive: yup.boolean().required(),
        permissions: yup.array(yup.mixed<ModulePermission>().oneOf(orderedPermissions)).required()
      }),
    [t]
  );

  const moduleOptions = useMemo(
    () => [
      { value: 'tables' as ModulePermission, label: t('ટેબલ', 'Tables') },
      { value: 'orders' as ModulePermission, label: t('ઓર્ડર', 'Orders') },
      { value: 'parcel' as ModulePermission, label: t('પાર્સલ', 'Parcel') },
      { value: 'kitchen' as ModulePermission, label: t('રસોડું', 'Kitchen') },
      { value: 'billing' as ModulePermission, label: t('બિલિંગ', 'Billing') },
      { value: 'menu' as ModulePermission, label: t('મેનુ', 'Menu') },
      { value: 'reports' as ModulePermission, label: t('રિપોર્ટ', 'Reports') },
      { value: 'customers' as ModulePermission, label: t('ગ્રાહકો', 'Customers') },
      { value: 'settings' as ModulePermission, label: t('સેટિંગ્સ', 'Settings') },
      { value: 'staff' as ModulePermission, label: t('સ્ટાફ', 'Staff') }
    ],
    [t]
  );

  function roleLabel(role: Role) {
    const labels: Partial<Record<Role, string>> = {
      manager: t('મેનેજર', 'Manager'),
      waiter: t('વેઇટર', 'Waiter'),
      chef: t('શેફ', 'Chef'),
      owner: t('માલિક', 'Owner'),
      superadmin: t('સુપર એડમિન', 'Super admin')
    };
    return labels[role] || role;
  }

  async function loadStaff() {
    setLoading(true);
    try {
      const { data } = await api.get('/staff');
      setStaff(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('સ્ટાફ લોડ થઈ શક્યો નહીં', 'Could not load staff'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, permissions: [...emptyForm.permissions] });
  }

  function editUser(user: User) {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role as StaffRole,
      isActive: user.isActive !== false,
      permissions: (user.permissions ?? defaultPermissionsForRole(user.role)).filter((permission) =>
        orderedPermissions.includes(permission)
      )
    });
  }

  function changeRole(role: StaffRole) {
    setForm((current) => ({
      ...current,
      role,
      permissions: editingId ? current.permissions : defaultPermissionsForRole(role)
    }));
  }

  function togglePermission(permission: ModulePermission) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const values = await staffSchema.validate(form, { abortEarly: false, context: { editing: Boolean(editingId) } });
      const payload = {
        name: values.name,
        role: values.role,
        isActive: values.isActive,
        password: values.password || undefined,
        permissions: values.permissions || [],
        ...(!editingId ? { email: values.email || undefined, phone: values.phone } : {})
      };
      const { data } = editingId
        ? await api.patch(`/staff/${editingId}`, payload)
        : await api.post('/staff', payload);

      setStaff((current) =>
        editingId ? current.map((user) => (user._id === editingId ? data : user)) : [...current, data]
      );
      toast.success(editingId ? t('સ્ટાફ એકાઉન્ટ અપડેટ થયું', 'Staff account updated') : t('સ્ટાફ એકાઉન્ટ બન્યું', 'Staff account created'));
      resetForm();
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || t('સ્ટાફ એકાઉન્ટ સાચવી શકાયું નહીં', 'Could not save staff account'));
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeUser() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/staff/${userToDelete._id}`);
      setStaff((current) => current.filter((row) => row._id !== userToDelete._id));
      toast.success(t('સ્ટાફ એકાઉન્ટ કાઢી નાખ્યું', 'Staff account deleted'));
      if (editingId === userToDelete._id) resetForm();
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('સ્ટાફ એકાઉન્ટ કાઢી શકાયું નહીં', 'Could not delete staff account'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">{t('માલિક મોડ્યુલ', 'Owner module')}</p>
          <h1 className="text-3xl font-black tracking-tight">{t('સ્ટાફ એકાઉન્ટ્સ', 'Staff accounts')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('મેનેજર, વેઇટર અને શેફ એકાઉન્ટ બનાવો, સંપાદિત કરો, બંધ કરો અથવા કાઢી નાખો.', 'Create, edit, disable, or delete manager, waiter, and chef accounts.')}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-black dark:border-white/10 dark:bg-white/10">
          {staff.length} {t('સ્ટાફ', 'staff')}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="glass rounded-xl p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-lg bg-saffron/10 text-saffron">
                {editing ? <Edit3 /> : <Plus />}
              </div>
              <div>
                <p className="text-xl font-black">{editing ? t('સ્ટાફ સંપાદિત કરો', 'Edit staff') : t('સ્ટાફ બનાવો', 'Create staff')}</p>
                <p className="text-sm text-gray-500">{editing ? editing.name : t('આ માલિક હેઠળ નવું એકાઉન્ટ ઉમેરો', 'Add a new account under this owner')}</p>
              </div>
            </div>
            {editing && (
              <button type="button" className="btn-soft" onClick={resetForm}>
                <X size={17} />
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('નામ', 'Name')}</span>
              <input className="input" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('ફોન', 'Phone')}</span>
              <input className="input" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} required disabled={Boolean(editingId)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('ઇમેઇલ વૈકલ્પિક', 'Email optional')}</span>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} disabled={Boolean(editingId)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{editing ? t('નવો પાસવર્ડ', 'New password') : t('પાસવર્ડ', 'Password')}</span>
              <PasswordInput value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} minLength={8} required={!editing} placeholder={editing ? t('હાલનો પાસવર્ડ રાખવા ખાલી રાખો', 'Leave blank to keep current') : ''} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('ભૂમિકા', 'Role')}</span>
              <select className="input" value={form.role} onChange={(e) => changeRole(e.target.value as StaffRole)}>
                <option value="manager">{t('મેનેજર', 'Manager')}</option>
                <option value="waiter">{t('વેઇટર', 'Waiter')}</option>
                <option value="chef">{t('શેફ', 'Chef')}</option>
              </select>
            </label>
            <label className="flex items-center gap-3  px-3 py-3 text-sm font-bold dark:border-white/10 dark:bg-white/10 mt-4">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
              {t('સક્રિય એકાઉન્ટ', 'Active account')}
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{t('મોડ્યુલ એક્સેસ', 'Module access')}</p>
                <p className="text-xs font-semibold text-gray-500">{t('આ સ્ટાફ સભ્ય શું ખોલી શકે તે પસંદ કરો.', 'Choose what this staff member can open.')}</p>
              </div>
              <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
                {form.permissions.length}/{moduleOptions.length}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {moduleOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-bold transition hover:border-saffron/40 dark:border-white/10 dark:bg-white/10"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(option.value)}
                    onChange={() => togglePermission(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button disabled={saving} className="btn-primary">
              <Save size={17} />
              {saving ? t('સાચવી રહ્યું છે...', 'Saving...') : editing ? t('ફેરફારો સાચવો', 'Save changes') : t('એકાઉન્ટ બનાવો', 'Create account')}
            </button>
          </div>
        </form>

        <div className="glass overflow-hidden rounded-xl p-0">
          <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-white/10">
            <UsersRound className="text-saffron" />
            <p className="font-black">{t('તમારો સ્ટાફ', 'Your staff')}</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {staff.map((user) => {
              const permissions = (user.permissions ?? defaultPermissionsForRole(user.role)).filter((permission) =>
                orderedPermissions.includes(permission)
              );
              return (
              <div key={user._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{user.name}</p>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">{roleLabel(user.role)}</span>
                    {user.isActive === false && <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">{t('બંધ', 'Disabled')}</span>}
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500">{user.email || t('ઇમેઇલ નથી', 'No email')}{user.phone ? ` - ${user.phone}` : ''}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {permissions.map((permission) => (
                      <span key={permission} className="rounded-lg bg-saffron/10 px-2 py-1 text-[11px] font-black text-saffron">
                        {moduleOptions.find((option) => option.value === permission)?.label || permission}
                      </span>
                    ))}
                    {!permissions.length && (
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-black text-gray-500 dark:bg-white/10">
                        {t('મોડ્યુલ એક્સેસ નથી', 'No module access')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-soft" onClick={() => editUser(user)}>
                    <Edit3 size={17} />
                  </button>
                  <button className="btn-soft text-red-600" onClick={() => setUserToDelete(user)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              );
            })}
            {!loading && !staff.length && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">{t('હજુ સુધી કોઈ સ્ટાફ એકાઉન્ટ નથી.', 'No staff accounts yet.')}</div>
            )}
            {loading && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">{t('સ્ટાફ લોડ થઈ રહ્યો છે...', 'Loading staff...')}</div>
            )}
          </div>
        </div>
      </div>
      {userToDelete && (
        <ConfirmDialog
          title={t('સ્ટાફ એકાઉન્ટ કાઢી નાખવું છે?', 'Delete staff account?')}
          description={
            <>
              <p className="font-bold text-gray-950 dark:text-white">{userToDelete.name}</p>
              <p className="mt-2">{t('આ સ્ટાફ સભ્ય હવે સાઇન ઇન કરી શકશે નહીં.', 'This staff member will no longer be able to sign in.')}</p>
            </>
          }
          confirmLabel={t('કાઢી નાખો', 'Delete')}
          loadingLabel={t('કાઢી રહ્યું છે...', 'Deleting...')}
          cancelLabel={t('રદ કરો', 'Cancel')}
          loading={deleting}
          danger
          onConfirm={removeUser}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}
