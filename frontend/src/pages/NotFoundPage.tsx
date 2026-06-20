import { ArrowLeft, Home, SearchX, ServerCrash } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const homePath = user ? '/' : '/login';

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-white/70 bg-white/85 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/80">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-ink p-8 text-white sm:p-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-saffron" />
            <div className="relative flex min-h-[340px] flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-lg bg-white/10">
                  <img src="/favicon.svg" alt="Bill Mitra" className="size-9 rounded-md" />
                </div>
                <div>
                  <p className="text-xl font-black">Bill Mitra</p>
                  <p className="text-sm font-semibold text-white/60">Smart Restaurant POS</p>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white/80">
                  <SearchX size={17} />
                  Error 404
                </div>
                <p className="mt-6 text-7xl font-black leading-none sm:text-8xl">404</p>
                <p className="mt-4 max-w-sm text-base font-semibold leading-7 text-white/70">
                  This page is missing, moved, or the address was typed incorrectly.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            <div className="mb-8 grid size-16 place-items-center rounded-lg bg-saffron/10 text-saffron">
              <ServerCrash size={32} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-saffron">Page not found</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-gray-950 dark:text-white sm:text-4xl">
              We could not open this screen.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              Use the buttons below to return to a working page. If this happened after refreshing a deployed link,
              the app needs the Vercel rewrite fallback included in the deployment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={homePath} className="btn-primary">
                <Home size={18} />
                {user ? 'Go to dashboard' : 'Go to login'}
              </Link>
              <button type="button" className="btn-soft" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Go back
              </button>
            </div>

            <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Still seeing this on refresh?</p>
              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Redeploy the latest version and confirm Vercel is using the frontend project root or the root
                `vercel.json` rewrite.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
