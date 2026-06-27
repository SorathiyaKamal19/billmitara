import clsx from 'clsx';
import { statusLabel } from '../utils/gujarati';

const styles: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  running: 'bg-amber-100 text-amber-800',
  reserved: 'bg-indigo-100 text-indigo-700',
  cleaning: 'bg-slate-100 text-slate-700',
  'in-kitchen': 'bg-amber-100 text-amber-800',
  ready: 'bg-emerald-100 text-emerald-700',
  billed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-rose-100 text-rose-700',
  'dine-in': 'bg-blue-100 text-blue-700',
  takeaway: 'bg-pink-100 text-pink-700'
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', styles[value] || 'bg-gray-100 text-gray-700')}>{statusLabel(value)}</span>;
}
