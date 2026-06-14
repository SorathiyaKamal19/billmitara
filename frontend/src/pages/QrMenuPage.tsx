import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export function QrMenuPage() {
  const { t } = useLanguage();
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  useEffect(() => { api.get('/settings/qr-menu').then((res) => setQr(res.data)); }, []);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-saffron">{t('ડિજિટલ મેનુ', 'Digital menu')}</p>
        <h1 className="text-3xl font-black">{t('QR કોડ મેનુ', 'QR code menu')}</h1>
      </div>
      <div className="glass max-w-lg rounded-lg p-6 text-center">
        {qr ? <img src={qr.dataUrl} className="mx-auto size-72 rounded-lg bg-white p-4" alt="QR menu" /> : <QrCode className="mx-auto text-gray-400" size={64} />}
        <p className="mt-4 break-all text-sm font-semibold text-gray-500">{qr?.url}</p>
      </div>
    </div>
  );
}
