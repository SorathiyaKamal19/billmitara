import { LucideIcon } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: LucideIcon; accent: string }) {
  return (
    <div className="glass rounded-lg p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-lg p-3 text-white" style={{ backgroundColor: accent }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
