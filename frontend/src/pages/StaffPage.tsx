import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Save, Trash2, UsersRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { api } from '../api/client';
import { Role, User } from '../types';
import { PasswordInput } from '../components/PasswordInput';
import { ConfirmDialog } from '../components/ConfirmDialog';

type StaffRole = Exclude<Role, 'owner'>;

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'waiter' as StaffRole,
  isActive: true
};

const staffSchema = yup.object({
  name: yup.string().trim().min(2, 'Name is too short').required('Name is required'),
  email: yup.string().trim().email('Enter a valid email').optional(),
  password: yup.string().when('$editing', {
    is: true,
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.min(8, 'Password must be at least 8 characters').required('Password is required')
  }),
  phone: yup.string().trim().min(6, 'Enter a valid mobile number').required('Mobile number is required'),
  role: yup.mixed<StaffRole>().oneOf(['manager', 'waiter', 'chef']).required('Role is required'),
  isActive: yup.boolean().required()
});

export function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editing = useMemo(() => staff.find((user) => user._id === editingId), [editingId, staff]);

  async function loadStaff() {
    setLoading(true);
    try {
      const { data } = await api.get('/staff');
      setStaff(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not load staff');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function editUser(user: User) {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role as StaffRole,
      isActive: user.isActive !== false
    });
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
        ...(!editingId ? { email: values.email || undefined, phone: values.phone } : {})
      };
      const { data } = editingId
        ? await api.patch(`/staff/${editingId}`, payload)
        : await api.post('/staff', payload);

      setStaff((current) =>
        editingId ? current.map((user) => (user._id === editingId ? data : user)) : [...current, data]
      );
      toast.success(editingId ? 'Staff account updated' : 'Staff account created');
      resetForm();
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || 'Could not save staff account');
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
      toast.success('Staff account deleted');
      if (editingId === userToDelete._id) resetForm();
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not delete staff account');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">Owner module</p>
          <h1 className="text-3xl font-black tracking-tight">Staff accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Create, edit, disable, or delete manager, waiter, and chef accounts.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-black dark:border-white/10 dark:bg-white/10">
          {staff.length} staff
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
                <p className="text-xl font-black">{editing ? 'Edit staff' : 'Create staff'}</p>
                <p className="text-sm text-gray-500">{editing ? editing.name : 'Add a new account under this owner'}</p>
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
              <span className="mb-2 block text-sm font-bold">Name</span>
              <input className="input" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Phone</span>
              <input className="input" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} required disabled={Boolean(editingId)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Email optional</span>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} disabled={Boolean(editingId)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{editing ? 'New password' : 'Password'}</span>
              <PasswordInput value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} minLength={8} required={!editing} placeholder={editing ? 'Leave blank to keep current' : ''} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Role</span>
              <select className="input" value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as StaffRole }))}>
                <option value="manager">Manager</option>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
              </select>
            </label>
            <label className="flex items-center gap-3  px-3 py-3 text-sm font-bold dark:border-white/10 dark:bg-white/10 mt-4">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
              Active account
            </label>
          </div>

          <button disabled={saving} className="btn-primary mt-5">
            <Save size={17} />
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Create account'}
          </button>
        </form>

        <div className="glass overflow-hidden rounded-xl p-0">
          <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-white/10">
            <UsersRound className="text-saffron" />
            <p className="font-black">Your staff</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {staff.map((user) => (
              <div key={user._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{user.name}</p>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold capitalize text-gray-600 dark:bg-white/10 dark:text-gray-300">{user.role}</span>
                    {user.isActive === false && <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Disabled</span>}
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500">{user.email || 'No email'}{user.phone ? ` - ${user.phone}` : ''}</p>
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
            ))}
            {!loading && !staff.length && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">No staff accounts yet.</div>
            )}
            {loading && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">Loading staff...</div>
            )}
          </div>
        </div>
      </div>
      {userToDelete && (
        <ConfirmDialog
          title="Delete staff account?"
          description={
            <>
              <p className="font-bold text-gray-950 dark:text-white">{userToDelete.name}</p>
              <p className="mt-2">This staff member will no longer be able to sign in.</p>
            </>
          }
          confirmLabel="Delete"
          loadingLabel="Deleting..."
          loading={deleting}
          danger
          onConfirm={removeUser}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}
