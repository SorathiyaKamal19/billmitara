import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Clock, HelpCircle, MailCheck, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { api } from '../api/client';
import { SupportTicket } from '../types';
import { useLanguage } from '../context/LanguageContext';

const emptyForm = {
  category: 'technical' as SupportTicket['category'],
  subject: '',
  message: ''
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function SupportPage() {
  const { language, t } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const locale = language === 'gu' ? 'gu-IN' : 'en-IN';
  const supportSchema = useMemo(
    () =>
      yup.object({
        category: yup.mixed<SupportTicket['category']>().oneOf(['billing', 'technical', 'account', 'feature', 'other']).required(),
        subject: yup
          .string()
          .trim()
          .min(3, t('વિષય ખૂબ ટૂંકો છે', 'Subject is too short'))
          .max(120, t('વિષય ખૂબ લાંબો છે', 'Subject is too long'))
          .required(t('વિષય જરૂરી છે', 'Subject is required')),
        message: yup
          .string()
          .trim()
          .min(10, t('કૃપા કરીને વધુ વિગત ઉમેરો', 'Please add more detail'))
          .max(2000, t('સંદેશ ખૂબ લાંબો છે', 'Message is too long'))
          .required(t('સંદેશ જરૂરી છે', 'Message is required'))
      }),
    [t]
  );

  function categoryLabel(category: SupportTicket['category']) {
    const labels: Record<SupportTicket['category'], string> = {
      technical: t('ટેકનિકલ સમસ્યા', 'Technical issue'),
      billing: t('બિલિંગ', 'Billing'),
      account: t('એકાઉન્ટ', 'Account'),
      feature: t('ફીચર વિનંતી', 'Feature request'),
      other: t('અન્ય', 'Other')
    };
    return labels[category];
  }

  function notificationLabel(status: SupportTicket['notificationStatus']) {
    const labels: Record<SupportTicket['notificationStatus'], string> = {
      pending: t('બાકી', 'Pending'),
      sent: t('મેઇલ મોકલાયો', 'Mailed'),
      failed: t('નિષ્ફળ', 'Failed')
    };
    return labels[status];
  }

  async function loadTickets() {
    setLoading(true);
    try {
      const { data } = await api.get('/support');
      setTickets(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('સપોર્ટ પ્રશ્નો લોડ થઈ શક્યા નહીં', 'Could not load support queries'));
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
      toast.success(t('સપોર્ટ પ્રશ્ન મોકલાયો. અમે સામાન્ય રીતે 2 દિવસમાં ઉકેલીએ છીએ.', 'Support query sent. We usually resolve queries within 2 days.'));
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        toast.error(error.errors[0]);
      } else {
        toast.error(error.response?.data?.message || t('સપોર્ટ પ્રશ્ન મોકલી શકાયો નહીં', 'Could not send support query'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">{t('હેલ્પ ડેસ્ક', 'Help desk')}</p>
          <h1 className="text-3xl font-black tracking-tight">{t('મદદ અને સપોર્ટ', 'Help & Support')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('તમારો પ્રશ્ન BillMitara સપોર્ટ એડમિનને મોકલો.', 'Send your query to the BillMitara support admin.')}</p>
        </div>
        <button className="btn-soft" onClick={loadTickets} disabled={loading}>
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          {t('રિફ્રેશ', 'Refresh')}
        </button>
      </div>

      <div className="glass flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Clock size={21} />
        </div>
        <div>
          <p className="font-black">{t('ગ્રાહક સંતોષ અમારા માટે મહત્વપૂર્ણ છે.', 'Customer satisfaction matters to us.')}</p>
          <p className="text-sm leading-6 text-gray-500">
            {t(
              'અમે સામાન્ય રીતે સપોર્ટ પ્રશ્નો 2 દિવસમાં ઉકેલીએ છીએ. ડુપ્લિકેટ ઇમેઇલ ટાળવા માટે, દરેક યુઝર 24 કલાકમાં 2 સપોર્ટ પ્રશ્નો મોકલી શકે છે.',
              'We usually resolve support queries within 2 days. To avoid duplicate emails, each user can send up to 2 support queries in 24 hours.'
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="glass rounded-lg p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-saffron/10 text-saffron">
              <HelpCircle />
            </div>
            <div>
              <p className="text-xl font-black">{t('નવો સપોર્ટ પ્રશ્ન', 'New support query')}</p>
              <p className="text-sm text-gray-500">{t('તમારા રેસ્ટોરન્ટ અને સંપર્કની વિગતો આપમેળે જોડાશે.', 'Your restaurant and contact details are included automatically.')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('કેટેગરી', 'Category')}</span>
              <select className="input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as SupportTicket['category'] }))}>
                <option value="technical">{t('ટેકનિકલ સમસ્યા', 'Technical issue')}</option>
                <option value="billing">{t('બિલિંગ', 'Billing')}</option>
                <option value="account">{t('એકાઉન્ટ', 'Account')}</option>
                <option value="feature">{t('ફીચર વિનંતી', 'Feature request')}</option>
                <option value="other">{t('અન્ય', 'Other')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('વિષય', 'Subject')}</span>
              <input className="input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} maxLength={120} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">{t('સંદેશ', 'Message')}</span>
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
            {saving ? t('મોકલી રહ્યું છે...', 'Sending...') : t('પ્રશ્ન મોકલો', 'Send query')}
          </button>
        </form>

        <div className="glass overflow-hidden rounded-lg">
          <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-white/10">
            <MailCheck className="text-saffron" />
            <p className="font-black">{t('તાજેતરના પ્રશ્નો', 'Recent queries')}</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{ticket.subject}</p>
                  <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">{categoryLabel(ticket.category)}</span>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${ticket.notificationStatus === 'sent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                    {notificationLabel(ticket.notificationStatus)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{ticket.message}</p>
                <p className="mt-2 text-xs font-semibold text-gray-400">{formatDate(ticket.createdAt, locale)}</p>
              </div>
            ))}
            {!loading && tickets.length === 0 && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">{t('હજુ સુધી કોઈ સપોર્ટ પ્રશ્ન નથી.', 'No support queries yet.')}</div>
            )}
            {loading && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">{t('સપોર્ટ પ્રશ્નો લોડ થઈ રહ્યા છે...', 'Loading support queries...')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
