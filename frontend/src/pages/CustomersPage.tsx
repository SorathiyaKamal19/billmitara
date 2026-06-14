import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  UserRound,
  Phone,
  Wallet,
  BadgeIndianRupee,
  TrendingUp,
  Users,
  Sparkles
} from 'lucide-react';

import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Customer } from '../types';
import { money } from '../utils/format';

export function CustomersPage() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<
    Customer[]
  >([]);

  const [q, setQ] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      api
        .get(
          `/customers?q=${encodeURIComponent(
            q
          )}`
        )
        .then((res) =>
          setCustomers(res.data)
        );
    }, 250);

    return () => clearTimeout(timeout);
  }, [q]);

  /* STATS */

  const stats = useMemo(() => {
    return {
      totalCustomers: customers.length,

      totalRevenue: customers.reduce(
        (sum, customer) =>
          sum + customer.totalSpending,
        0
      ),

      totalVisits: customers.reduce(
        (sum, customer) =>
          sum + customer.totalVisits,
        0
      ),

      topCustomer:
        customers.sort(
          (a, b) =>
            b.totalSpending -
            a.totalSpending
        )[0]
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* HERO */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f766e] via-[#14827a] to-[#2563eb] p-7 text-white shadow-soft">
        {/* BG SHAPES */}

        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white" />

          <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={16} />

              <span className="text-sm font-bold">
                BillMitara CRM
              </span>
            </div>

            <h1 className="text-4xl font-black">
              {t('ગ્રાહક મેનેજમેન્ટ', 'Customer Management')}
            </h1>

            <p className="mt-3 max-w-2xl text-white/90">
              {t(
                'ગ્રાહક મુલાકાતો, ખર્ચની રીતો અને રેસ્ટોરન્ટ સંબંધો ટ્રેક કરો.',
                'Track customer visits, spending patterns and restaurant relationships.'
              )}
            </p>
          </div>

          {/* TOP CUSTOMER */}

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              {t('ટોચનો ગ્રાહક', 'Top Customer')}
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {stats.topCustomer?.name ||
                t('મહેમાન', 'Guest')}
            </h2>

            <p className="mt-1 text-sm text-white/80">
              {money(
                stats.topCustomer
                  ?.totalSpending || 0
              )}{' '}
              {t('ખર્ચ્યા', 'spent')}
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL CUSTOMERS */}

        <div className="glass rounded-3xl border border-white/10 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">
                {t('કુલ ગ્રાહકો', 'Total Customers')}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {stats.totalCustomers}
              </h2>
            </div>

            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* REVENUE */}

        <div className="glass rounded-3xl border border-white/10 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">
                {t('ગ્રાહક આવક', 'Customer Revenue')}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {money(stats.totalRevenue)}
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <BadgeIndianRupee
                size={24}
              />
            </div>
          </div>
        </div>

        {/* VISITS */}

        <div className="glass rounded-3xl border border-white/10 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">
                {t('કુલ મુલાકાતો', 'Total Visits')}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {stats.totalVisits}
              </h2>
            </div>

            <div className="rounded-2xl bg-saffron/10 p-3 text-saffron">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* AVG */}

        <div className="glass rounded-3xl border border-white/10 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">
                {t('સરેરાશ ખર્ચ', 'Avg Spending')}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {money(
                  stats.totalCustomers
                    ? stats.totalRevenue /
                        stats.totalCustomers
                    : 0
                )}
              </h2>
            </div>

            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="glass rounded-3xl border border-white/10 p-5 shadow-soft">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />

          <input
            className="input h-14 rounded-2xl pl-12 text-base"
            placeholder={t(
              'ગ્રાહકનું નામ અથવા મોબાઇલ નંબર શોધો...',
              'Search customer name or mobile number...'
            )}
            value={q}
            onChange={(e) =>
              setQ(e.target.value)
            }
          />
        </div>
      </div>

      {/* CUSTOMER LIST */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {customers.map((customer) => (
          <div
            key={customer._id}
            className="group glass overflow-hidden rounded-3xl border border-white/10 p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            {/* TOP */}

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* AVATAR */}

                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                  <UserRound size={24} />
                </div>

                {/* INFO */}

                <div>
                  <h2 className="text-xl font-black">
                    {customer.name ||
                      t('મહેમાન ગ્રાહક', 'Guest Customer')}
                  </h2>

                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} />

                    <span>
                      {customer.mobile}
                    </span>
                  </div>
                </div>
              </div>

              {/* VISITS BADGE */}

              <div className="rounded-full bg-saffron/10 px-3 py-1 text-xs font-bold text-saffron">
                {customer.totalVisits}{' '}
                {t('મુલાકાતો', 'Visits')}
              </div>
            </div>

            {/* STATS */}

            <div className="mt-5 grid grid-cols-2 gap-4">
              {/* SPENDING */}

              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('કુલ ખર્ચ', 'Total Spending')}
                </p>

                <h3 className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {money(
                    customer.totalSpending
                  )}
                </h3>
              </div>

              {/* AVG BILL */}

              <div className="rounded-2xl bg-saffron/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('સરેરાશ બિલ', 'Avg Bill')}
                </p>

                <h3 className="mt-2 text-2xl font-black text-saffron">
                  {money(
                    customer.totalVisits
                      ? customer.totalSpending /
                          customer.totalVisits
                      : 0
                  )}
                </h3>
              </div>
            </div>

            {/* FOOTER */}

            <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-white/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('લોયલ્ટી સ્થિતિ', 'Loyalty Status')}
                </p>

                <p className="mt-1 font-black text-saffron">
                  {customer.totalVisits >= 10
                    ? t('VIP ગ્રાહક', 'VIP Customer')
                    : customer.totalVisits >= 5
                    ? t('નિયમિત ગ્રાહક', 'Regular Customer')
                    : t('નવો ગ્રાહક', 'New Customer')}
                </p>
              </div>

              <div className="rounded-2xl bg-saffron/10 px-4 py-2 text-sm font-bold text-saffron">
                #{customer.totalVisits}
              </div>
            </div>
          </div>
        ))}

        {/* EMPTY */}

        {!customers.length && (
          <div className="glass col-span-full rounded-3xl border border-white/10 p-16 text-center shadow-soft">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gray-100 dark:bg-white/10">
              <UserRound
                size={34}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              {t('કોઈ ગ્રાહક મળ્યા નથી', 'No Customers Found')}
            </h2>

            <p className="mt-2 text-gray-500">
              {t(
                'ઓર્ડર થયા પછી ગ્રાહક રેકોર્ડ અહીં દેખાશે.',
                'Customer records will appear here once orders are placed.'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
