import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, ChefHat, ClipboardList, CreditCard, LayoutDashboard, LifeBuoy, LogOut, MenuSquare, Moon, Settings, Sun, Table2, UserCircle, UserCog, Users } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Role } from '../types';

const nav: { to: string; labelGu: string; labelEn: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { to: '/', labelGu: 'ડેશબોર્ડ', labelEn: 'Dashboard', icon: LayoutDashboard, roles: ['owner'] },
  { to: '/tables', labelGu: 'ટેબલ', labelEn: 'Tables', icon: Table2, roles: ['owner', 'manager', 'waiter'] },
  { to: '/orders', labelGu: 'ઓર્ડર', labelEn: 'Orders', icon: ClipboardList, roles: ['owner', 'manager', 'waiter'] },
  { to: '/parcel', labelGu: 'પાર્સલ', labelEn: 'Parcel', icon: CreditCard, roles: ['owner', 'manager', 'waiter'] },
  { to: '/kitchen', labelGu: 'રસોડું', labelEn: 'Kitchen', icon: ChefHat, roles: ['owner', 'manager', 'waiter', 'chef'] },
  { to: '/menu', labelGu: 'મેનુ', labelEn: 'Menu', icon: MenuSquare, roles: ['owner'] },
  { to: '/reports', labelGu: 'રિપોર્ટ', labelEn: 'Reports', icon: BarChart3, roles: ['owner'] },
  { to: '/customers', labelGu: 'ગ્રાહકો', labelEn: 'Customers', icon: Users, roles: ['owner', 'manager'] },
  { to: '/settings', labelGu: 'સેટિંગ્સ', labelEn: 'Settings', icon: Settings, roles: ['owner'] },
  { to: '/staff', labelGu: 'Staff', labelEn: 'Staff', icon: UserCog, roles: ['owner'] },
  { to: '/support', labelGu: 'Help', labelEn: 'Help & Support', icon: LifeBuoy, roles: ['owner', 'manager', 'waiter', 'chef'] },
  { to: '/profile', labelGu: 'Profile', labelEn: 'Profile', icon: UserCircle, roles: ['owner', 'manager', 'waiter', 'chef'] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('poss_theme') === 'dark' || document.documentElement.classList.contains('dark'));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const allowed = nav.filter((item) => item.roles.includes(user?.role || 'manager'));
  const profileMenuItems = allowed.filter((item) => ['/staff', '/settings', '/customers', '/support'].includes(item.to));
  const mobileAllowed = allowed.filter((item) => !['/menu', '/reports', '/profile', '/staff', '/settings', '/customers', '/support'].includes(item.to));
  const restaurantName = user?.restaurant?.name || t('Restaurant', 'Restaurant');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('poss_theme', dark ? 'dark' : 'light');
  }, [dark]);

  function toggleTheme() {
    setDark((value) => !value);
  }

  function handleLogout() {
    setProfileMenuOpen(false);
    logout();
    navigate('/login');
  }

  function openProfile() {
    setProfileMenuOpen(false);
    navigate('/profile');
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/50 bg-white/75 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/70 lg:block">
        <div className="flex h-full flex-col">
          <div className="rounded-lg bg-ink p-4 text-white">
            <NavLink to="/" className="flex items-center gap-3 rounded-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 p-1">
                <img src="/favicon.svg" alt="Bill Mitra" className="size-full rounded-md" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-tight">{restaurantName}</p>
                <p className="text-xs font-semibold text-white/70">Bill Mitra App</p>
              </div>
            </NavLink>
          </div>
          <nav className="mt-5 space-y-1">
            {allowed.map(({ to, labelGu, labelEn, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                    isActive ? 'bg-saffron text-white shadow-sm' : 'text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10'
                  )
                }
              >
                <Icon size={19} />
                {t(labelGu, labelEn)}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-3 mt-3">
            <div className="block rounded-lg border border-gray-200 bg-white p-3 transition hover:border-saffron/40 dark:border-white/10 dark:bg-white/10">
              <p className="text-sm font-bold">Bill Mitra App</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Copyright {currentYear} Bill Mitra. All rights reserved.</p>
            </div>
            <div className="flex gap-2">
              <LanguageSelector />
              <button
                className="btn-soft flex-1"
                onClick={toggleTheme}
                title={dark ? t('લાઇટ મોડ', 'Light mode') : t('ડાર્ક મોડ', 'Dark mode')}
                aria-label={dark ? t('લાઇટ મોડ', 'Light mode') : t('ડાર્ક મોડ', 'Dark mode')}
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button
                className="btn-soft flex-1"
                onClick={handleLogout}
                title={t('લૉગ આઉટ', 'Logout')}
                aria-label={t('લૉગ આઉટ', 'Logout')}
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen p-4 pb-24 lg:ml-72 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative mb-5 flex items-center justify-between lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/favicon.svg" alt="Bill Mitra" className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0">
                <p className="truncate text-xl font-black">{restaurantName}</p>
                <p className="text-xs font-semibold text-gray-500">Bill Mitra App</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-soft" onClick={() => setProfileMenuOpen((value) => !value)}>
                <UserCircle size={17} />
                <span className="max-w-24 truncate">{user?.name}</span>
              </button>
            </div>
            {profileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-gray-950">
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-gray-50 dark:hover:bg-white/10"
                  onClick={openProfile}
                >
                  <UserCircle size={17} />
                  <span className="min-w-0">
                    <span className="block truncate">{user?.name}</span>
                    <span className="block truncate text-xs font-semibold capitalize text-gray-500 dark:text-gray-400">{user?.role}</span>
                  </span>
                </button>
                {profileMenuItems.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-gray-200 pt-2 dark:border-white/10">
                    {profileMenuItems.map(({ to, labelGu, labelEn, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setProfileMenuOpen(false)}
                        className={({ isActive }) =>
                          clsx(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition',
                            isActive ? 'bg-saffron text-white' : 'hover:bg-gray-50 dark:hover:bg-white/10'
                          )
                        }
                      >
                        <Icon size={17} />
                        <span className="truncate">{t(labelGu, labelEn)}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
                <div className="mt-2 space-y-2 border-t border-gray-200 pt-2 dark:border-white/10">
                  <LanguageSelector />
                  <button
                    className="btn-soft w-full justify-start"
                    onClick={toggleTheme}
                    title={dark ? t('લાઇટ મોડ', 'Light mode') : t('ડાર્ક મોડ', 'Dark mode')}
                  >
                    {dark ? <Sun size={17} /> : <Moon size={17} />}
                    {dark ? t('લાઇટ મોડ', 'Light mode') : t('ડાર્ક મોડ', 'Dark mode')}
                  </button>
                  <button
                    className="btn-soft w-full justify-start text-red-600 dark:text-red-300"
                    onClick={handleLogout}
                    title={t('લૉગ આઉટ', 'Logout')}
                  >
                    <LogOut size={17} />
                    {t('લૉગ આઉટ', 'Logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <Outlet />
          <nav
            className={clsx(
              'fixed inset-x-3 bottom-3 z-40 grid gap-1 rounded-lg border border-white/70 bg-white/90 p-2 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/90 lg:hidden',
              mobileAllowed.length <= 2 ? 'grid-cols-2' : mobileAllowed.length === 3 ? 'grid-cols-3' : mobileAllowed.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
            )}
          >
            {mobileAllowed.map(({ to, labelGu, labelEn, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => clsx('grid place-items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold', isActive ? 'bg-saffron text-white' : 'text-gray-500')}>
                <Icon size={18} />
                <span className="truncate">{t(labelGu, labelEn)}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}
