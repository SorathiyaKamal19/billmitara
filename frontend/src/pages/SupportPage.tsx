import { FormEvent, useEffect, useState } from 'react';
import { HelpCircle, MailCheck, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { api } from '../api/client';
import { SupportTicket } from '../types';

const supportSchema = yup.object({
  category: yup.mixed<SupportTicket['category']>().oneOf(['billing', 'technical', 'account', 'feature', 'other']).required(),
  subject: yup.string().trim().min(3, 'Subject is too short').max(120, 'Subject is too long').required('Subject is required'),
  message: yup.string().trim().min(10, 'Please add more detail').max(2000, 'Message is too long').required('Message is required')
});

const emptyForm = {
  category: 'technical' as SupportTicket['category'],
  subject: '',
  message: ''
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function SupportPage() {
  const [form, setForm] = useState(emptyForm);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadTickets() {
    setLoading(true);
    try {
      const { data } = await api.get('/support');
      setTickets(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not load support queries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const values = await supportSchema.validate(form, { abortEarly: false });
      const { data } = await api.post('/support', values);
      setTickets((current) => [data, ...current]);
      setForm(emptyForm);
      toast.success('Support query sent');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || 'Could not send support query');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">Help desk</p>
          <h1 className="text-3xl font-black tracking-tight">Help & Support</h1>
          <p className="mt-1 text-sm text-gray-500">Send your query to the BillMitara support admin.</p>
        </div>
        <button className="btn-soft" onClick={loadTickets} disabled={loading}>
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="glass rounded-lg p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-saffron/10 text-saffron">
              <HelpCircle />
            </div>
            <div>
              <p className="text-xl font-black">New support query</p>
              <p className="text-sm text-gray-500">Your restaurant and contact details are included automatically.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Category</span>
              <select className="input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as SupportTicket['category'] }))}>
                <option value="technical">Technical issue</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="feature">Feature request</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Subject</span>
              <input className="input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} maxLength={120} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Message</span>
              <textarea
                className="input min-h-44 resize-y"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                maxLength={2000}
                required
              />
            </label>
          </div>

          <button className="btn-primary mt-5" disabled={saving}>
            <Send size={17} />
            {saving ? 'Sending...' : 'Send query'}
          </button>
        </form>

        <div className="glass overflow-hidden rounded-lg">
          <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-white/10">
            <MailCheck className="text-saffron" />
            <p className="font-black">Recent queries</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{ticket.subject}</p>
                  <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold capitalize text-gray-600 dark:bg-white/10 dark:text-gray-300">{ticket.category}</span>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${ticket.notificationStatus === 'sent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                    {ticket.notificationStatus === 'sent' ? 'Mailed' : ticket.notificationStatus}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{ticket.message}</p>
                <p className="mt-2 text-xs font-semibold text-gray-400">{formatDate(ticket.createdAt)}</p>
              </div>
            ))}
            {!loading && tickets.length === 0 && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">No support queries yet.</div>
            )}
            {loading && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">Loading support queries...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
