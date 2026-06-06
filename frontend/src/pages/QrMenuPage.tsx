import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { api } from '../api/client';

export function QrMenuPage() {
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  useEffect(() => { api.get('/settings/qr-menu').then((res) => setQr(res.data)); }, []);
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-bold uppercase tracking-wider text-saffron">ડિજિટલ મેનુ</p><h1 className="text-3xl font-black">QR કોડ મેનુ</h1></div>
      <div className="glass max-w-lg rounded-lg p-6 text-center">
        {qr ? <img src={qr.dataUrl} className="mx-auto size-72 rounded-lg bg-white p-4" /> : <QrCode className="mx-auto text-gray-400" size={64} />}
        <p className="mt-4 break-all text-sm font-semibold text-gray-500">{qr?.url}</p>
      </div>
    </div>
  );
}
