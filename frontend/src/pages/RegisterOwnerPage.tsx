import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Building2, ChefHat, Lock, Mail, Phone, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';

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
      toast.success('Owner account created');
      navigate('/');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || 'Could not create owner account');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-lg border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/85 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-saffron text-white">
            <ChefHat />
          </div>
          <div>
            <p className="text-2xl font-black">Create owner account</p>
            <p className="text-sm text-gray-500">Start a restaurant workspace and become the owner.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Owner name</span>
            <div className="relative">
              <UserRound className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="input pl-10" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Owner phone</span>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="input pl-10" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="input pl-10" value={form.email} onChange={(e) => setField('email', e.target.value)} type="email" required />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="input pl-10" value={form.password} onChange={(e) => setField('password', e.target.value)} type="password" minLength={8} required />
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold">Restaurant name</span>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="input pl-10" value={form.restaurantName} onChange={(e) => setField('restaurantName', e.target.value)} required />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Restaurant phone</span>
            <input className="input" value={form.restaurantPhone} onChange={(e) => setField('restaurantPhone', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Restaurant address</span>
            <input className="input" value={form.restaurantAddress} onChange={(e) => setField('restaurantAddress', e.target.value)} />
          </label>
        </div>

        <button disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? 'Creating account...' : 'Create owner account'}
        </button>
        <Link to="/login" className="btn-soft mt-3 w-full justify-center">Back to login</Link>
      </form>
    </div>
  );
}
