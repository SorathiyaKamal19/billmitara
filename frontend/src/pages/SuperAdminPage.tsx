import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, LifeBuoy, LogOut, LucideIcon, RefreshCw, Search, ShieldCheck, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, User } from '../types';

type OwnerAccount = User & {
  staffCount: number;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value?: string) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return 'Not yet';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function ticketKey(ticketId: string) {
  return `SUP-${ticketId.slice(-6).toUpperCase()}`;
}

export function SuperAdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [owners, setOwners] = useState<OwnerAccount[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [query, setQuery] = useState('');
  const [ticketQuery, setTicketQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  const filteredOwners = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return owners;
    return owners.filter((owner) =>
      [owner.name, owner.email, owner.phone, owner.restaurant?.name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [owners, query]);

  const filteredTickets = useMemo(() => {
    const value = ticketQuery.trim().toLowerCase();
    if (!value) return supportTickets;
    return supportTickets.filter((ticket) =>
      [
        ticketKey(ticket._id),
        ticket.subject,
        ticket.message,
        ticket.name,
        ticket.email,
        ticket.phone,
        ticket.restaurantName,
        ticket.category,
        ticket.status
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [supportTickets, ticketQuery]);

  const stats = useMemo(() => {
    const subscribed = owners.filter((owner) => owner.isSubscribed !== false).length;
    const openTickets = supportTickets.filter((ticket) => ticket.status === 'open').length;
    return { subscribed, expired: owners.length - subscribed, openTickets };
  }, [owners, supportTickets]);
  const statCards: { label: string; value: number; icon: LucideIcon }[] = [
    { label: 'Total owners', value: owners.length, icon: UsersRound },
    { label: 'Subscribed', value: stats.subscribed, icon: ShieldCheck },
    { label: 'Expired', value: stats.expired, icon: Building2 },
    { label: 'Open tickets', value: stats.openTickets, icon: LifeBuoy }
  ];

  async function loadOwners() {
    setLoading(true);
    try {
      const { data } = await api.get('/superadmin/owners');
      setOwners(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not load owners');
    } finally {
      setLoading(false);
    }
  }

  async function loadSupportTickets() {
    setTicketsLoading(true);
    try {
      const { data } = await api.get('/support');
      setSupportTickets(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not load support tickets');
    } finally {
      setTicketsLoading(false);
    }
  }

  async function loadAll() {
    await Promise.all([loadOwners(), loadSupportTickets()]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateOwner(owner: OwnerAccount, patch: Partial<Pick<OwnerAccount, 'isActive' | 'isSubscribed'>>) {
    setUpdatingId(owner._id);
    try {
      const { data } = await api.patch(`/superadmin/owners/${owner._id}`, patch);
      setOwners((current) => current.map((row) => (row._id === owner._id ? { ...row, ...data, staffCount: row.staffCount } : row)));
      toast.success('Owner access updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not update owner access');
    } finally {
      setUpdatingId(null);
    }
  }

  async function closeTicket(ticket: SupportTicket) {
    setClosingTicketId(ticket._id);
    try {
      const { data } = await api.patch(`/support/${ticket._id}/close`);
      setSupportTickets((current) => current.map((row) => (row._id === ticket._id ? data : row)));
      toast.success(`${ticketKey(ticket._id)} closed`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not close support ticket');
    } finally {
      setClosingTicketId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg bg-ink p-5 text-white shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-lg bg-white/10">
              <ShieldCheck size={26} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/60">BillMitara</p>
              <h1 className="text-2xl font-black tracking-tight">Superadmin panel</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-soft border-white/10 bg-white/10 text-white hover:bg-white/15" onClick={loadAll} disabled={loading || ticketsLoading}>
              <RefreshCw size={17} className={loading || ticketsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn-soft border-white/10 bg-white/10 text-white hover:bg-white/15" onClick={handleLogout}>
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-lg p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{label}</p>
                <Icon className="text-saffron" size={21} />
              </div>
              <p className="mt-3 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="glass overflow-hidden rounded-lg">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Support tickets</h2>
              <p className="text-sm text-gray-500">Close solved tickets to stop 24-hour admin reminder emails.</p>
            </div>
            <label className="relative block w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                className="input pl-10"
                value={ticketQuery}
                onChange={(event) => setTicketQuery(event.target.value)}
                placeholder="Search ticket, restaurant, subject"
              />
            </label>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {filteredTickets.map((ticket) => {
              const open = ticket.status === 'open';
              const disabled = closingTicketId === ticket._id;
              return (
                <div key={ticket._id} className="grid gap-4 p-4 xl:grid-cols-[1fr_auto] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-saffron/10 px-2 py-1 text-xs font-black text-saffron">{ticketKey(ticket._id)}</span>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${open ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                        {open ? 'Open' : 'Closed'}
                      </span>
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold capitalize text-gray-600 dark:bg-white/10 dark:text-gray-300">{ticket.category}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{ticket.subject}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {ticket.restaurantName || 'No restaurant'} - {ticket.name || 'Unknown user'}{ticket.phone ? ` - ${ticket.phone}` : ''}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{ticket.message}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-gray-400">
                      <span>Created {formatDateTime(ticket.createdAt)}</span>
                      <span>Reminders {ticket.reminderCount || 0}</span>
                      <span>Last reminder {formatDateTime(ticket.lastReminderAt)}</span>
                      {ticket.closedAt && <span>Closed {formatDateTime(ticket.closedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className={open ? 'btn-primary' : 'btn-soft'}
                      disabled={!open || disabled}
                      onClick={() => closeTicket(ticket)}
                    >
                      <CheckCircle2 size={17} />
                      {open ? (disabled ? 'Closing...' : 'Close ticket') : 'Closed'}
                    </button>
                  </div>
                </div>
              );
            })}

            {!ticketsLoading && filteredTickets.length === 0 && (
              <div className="p-10 text-center text-sm font-bold text-gray-500">No support tickets found.</div>
            )}
            {ticketsLoading && (
              <div className="p-10 text-center text-sm font-bold text-gray-500">Loading support tickets...</div>
            )}
          </div>
        </section>

        <section className="glass overflow-hidden rounded-lg">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Owner access</h2>
              <p className="text-sm text-gray-500">Turn subscription on or off for each restaurant owner.</p>
            </div>
            <label className="relative block w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                className="input pl-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search owner, phone, restaurant"
              />
            </label>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {filteredOwners.map((owner) => {
              const disabled = updatingId === owner._id;
              const subscribed = owner.isSubscribed !== false;
              const active = owner.isActive !== false;
              return (
                <div key={owner._id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black">{owner.name}</p>
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                        {owner.restaurant?.name || 'No restaurant'}
                      </span>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${subscribed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                        {subscribed ? 'Subscribed' : 'Expired'}
                      </span>
                      {!active && <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">Disabled</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {owner.email || 'No email'}{owner.phone ? ` - ${owner.phone}` : ''}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-400">
                      {owner.staffCount} staff accounts - Created {formatDate(owner.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/10">
                    <ToggleSwitch
                      checked={subscribed}
                      disabled={disabled}
                      label="Subscribed"
                      onChange={(checked) => updateOwner(owner, { isSubscribed: checked })}
                    />
                    <ToggleSwitch
                      checked={active}
                      disabled={disabled}
                      label="Active"
                      onChange={(checked) => updateOwner(owner, { isActive: checked })}
                    />
                  </div>
                </div>
              );
            })}

            {!loading && filteredOwners.length === 0 && (
              <div className="p-10 text-center text-sm font-bold text-gray-500">No owner accounts found.</div>
            )}
            {loading && (
              <div className="p-10 text-center text-sm font-bold text-gray-500">Loading owner accounts...</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
