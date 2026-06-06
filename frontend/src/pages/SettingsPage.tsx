import { FormEvent, useEffect, useState } from 'react';
import {
  Save,
  Store,
  Phone,
  MapPin,
  Receipt,
  Percent,
  Palette,
  ShoppingBag,
  ShieldAlert,
  CheckCircle2,
  X,
  Sparkles,
  Settings2,
  BadgePercent,
  Building2
} from 'lucide-react';

import toast from 'react-hot-toast';

import { api } from '../api/client';
import { Restaurant } from '../types';

export function SettingsPage() {
  const [settings, setSettings] =
    useState<Partial<Restaurant>>({});

  const [showGSTModal, setShowGSTModal] =
    useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setSettings(res.data));
  }, []);

  async function submit(event?: FormEvent) {
    event?.preventDefault();

    const { data } = await api.patch(
      '/settings',
      settings
    );

    setSettings(data);

    setShowGSTModal(false);

    toast.success(
      'સેટિંગ્સ સફળતાપૂર્વક અપડેટ થઈ'
    );
  }

  return (
    <div className="space-y-6">
      {/* HERO */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f766e] via-[#14827a] to-[#2563eb] p-7 text-white shadow-soft">
        {/* BG */}

        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white" />
          <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={16} />

              <span className="text-sm font-bold">
                BillMitara સ્માર્ટ POS
              </span>
            </div>

            <h1 className="text-4xl font-black leading-tight">
              રેસ્ટોરન્ટ સેટિંગ્સ
            </h1>

            <p className="mt-3 max-w-2xl text-white/90">
              રેસ્ટોરન્ટ પ્રોફાઇલ, ટેક્સ, બ્રાન્ડિંગ, ટેકઅવે ચાર્જ અને POS સેટિંગ્સ મેનેજ કરો.
            </p>
          </div>

          {/* BRAND CARD */}

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              સંચાલિત
            </p>

            <h2 className="mt-1 text-3xl font-black">
              BillMitara
            </h2>

            <p className="mt-2 text-sm text-white/80">
              સ્માર્ટ રેસ્ટોરન્ટ POS
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}

      <form
        onSubmit={(e) => {
          if (settings.gstEnabled) {
            e.preventDefault();
            setShowGSTModal(true);
            return;
          }

          submit(e);
        }}
        className="grid gap-6 xl:grid-cols-[1fr_340px]"
      >
        {/* LEFT */}

        <div className="space-y-6">
          {/* RESTAURANT INFO */}

          <div className="glass rounded-3xl border border-white/10 p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-2xl bg-saffron/10 p-3 text-saffron">
                <Building2 size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  રેસ્ટોરન્ટ માહિતી
                </h2>

                <p className="text-sm text-gray-500">
                  રેસ્ટોરન્ટ વિગતો ગોઠવો
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  POS ડિસ્પ્લે નામ
                </label>

                <div className="relative">
                  <Store
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    className="input pl-10"
                    placeholder="રેસ્ટોરન્ટનું નામ"
                    value={settings.name || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        name: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  ફોન નંબર
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    className="input pl-10"
                    placeholder="ફોન"
                    value={settings.phone || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        phone: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              {/* ADDRESS */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  રેસ્ટોરન્ટ સરનામું
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-4 text-gray-400"
                  />

                  <textarea
                    className="input min-h-[120px] pl-10"
                    placeholder="રેસ્ટોરન્ટ સરનામું"
                    value={settings.address || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        address: e.target.value
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GST */}

          <div className="glass rounded-3xl border border-white/10 p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <Receipt size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  GST ગોઠવણી
                </h2>

                <p className="text-sm text-gray-500">
                  GST ગણતરી અને ટેક્સ ગોઠવો
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* ENABLE */}

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="font-black">
                    GST ચાલુ
                  </p>

                  <p className="text-sm text-gray-500">
                    ઇન્વોઇસ અને બિલિંગમાં GST ચાલુ કરો
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={
                      settings.gstEnabled !== false
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        gstEnabled:
                          e.target.checked
                      })
                    }
                  />

                  <div className="peer h-7 w-12 rounded-full bg-gray-300 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-saffron peer-checked:after:translate-x-5" />
                </label>
              </div>

              {/* GST DETAILS */}

              {settings.gstEnabled && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      GST નંબર
                    </label>

                    <input
                      className="input"
                        placeholder="GST નંબર"
                      value={
                        settings.gstNumber || ''
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gstNumber:
                            e.target.value
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      GST ટકા
                    </label>

                    <div className="relative">
                      <BadgePercent
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        className="input pl-10"
                        type="number"
                        placeholder="GST %"
                        value={
                          settings.gstRate || 5
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            gstRate: Number(
                              e.target.value
                            )
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TAKEAWAY */}

          <div className="glass rounded-3xl border border-white/10 p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-2xl bg-saffron/10 p-3 text-saffron">
                <ShoppingBag size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  ટેકઅવે ચાર્જ
                </h2>

                <p className="text-sm text-gray-500">
                  ટેકઅવે અને પાર્સલ ફી ગોઠવો
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="font-black">
                    ચાર્જ ચાલુ કરો
                  </p>

                  <p className="text-sm text-gray-500">
                    પાર્સલ ફી લાગુ કરો
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={Boolean(
                    settings.takeawayChargeEnabled
                  )}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      takeawayChargeEnabled:
                        e.target.checked
                    })
                  }
                  className="h-5 w-5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  ટેકઅવે ચાર્જ
                </label>

                <input
                  className="input"
                  type="number"
                  placeholder="ચાર્જ"
                  value={
                    settings.takeawayCharge || 0
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      takeawayCharge:
                        Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}

        <div className="space-y-6">
          {/* BRAND */}

       
          {/* QUICK INFO */}

          <div className="glass rounded-3xl border border-white/10 p-6 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
                <Settings2 size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  ગોઠવણી સારાંશ
                </h2>

                <p className="text-sm text-gray-500">
                  હાલની ગોઠવણીની ઝલક
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <span className="text-sm">
                  GST સ્થિતિ
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    settings.gstEnabled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {settings.gstEnabled
                    ? 'સક્રિય'
                    : 'બંધ'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <span className="text-sm">
                  GST દર
                </span>

                <span className="font-black">
                  {settings.gstRate || 0}%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                <span className="text-sm">
                  ટેકઅવે ચાર્જ
                </span>

                <span className="font-black">
                  ₹
                  {settings.takeawayCharge ||
                    0}
                </span>
              </div>
            </div>
          </div>

          {/* SAVE */}

          <button className="btn-primary w-full py-4 text-base shadow-2xl">
            <Save size={20} />
            રેસ્ટોરન્ટ સેટિંગ્સ સાચવો
          </button>
        </div>
      </form>

      {/* MODAL */}

      {showGSTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-saffron/10 p-3 text-saffron">
                <ShieldAlert size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  GST ફેરફારોની પુષ્ટિ કરો
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  GST ચાલુ થશે સાથે{' '}
                  <span className="font-bold text-saffron">
                    {settings.gstRate || 5}%
                  </span>{' '}
                  ટેક્સ.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  આ ભવિષ્યના બધા ઇન્વોઇસને અસર કરશે.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="btn-soft flex-1"
                onClick={() =>
                  setShowGSTModal(false)
                }
              >
                <X size={18} />
                રદ કરો
              </button>

              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => submit()}
              >
                <CheckCircle2 size={18} />
                પુષ્ટિ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
