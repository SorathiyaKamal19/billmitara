import { useEffect, useState } from "react";
import { subscribeToApiLoading } from "../api/client";

const LOADER_DELAY_MS = 350;

export function GlobalLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeToApiLoading((nextLoading, nextPendingRequests) => {
      setIsLoading(nextLoading);
      setPendingRequests(nextPendingRequests);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), LOADER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70]" aria-live="polite" aria-label="Loading">
      <div className="h-1 w-full overflow-hidden bg-saffron/15">
        <div className="h-full w-1/2 animate-[loading-bar_1.15s_ease-in-out_infinite] rounded-r-full bg-saffron" />
      </div>
      <div className="fixed inset-0 grid place-items-center px-4">
        <div className="flex items-center gap-3 rounded-lg border border-white/70 bg-white/90 px-4 py-3 text-sm font-bold text-gray-700 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/90 dark:text-gray-200">
          <span className="grid size-5 animate-spin place-items-center rounded-full border-2 border-saffron/20 border-t-saffron">
            <span className="size-2 rounded-full bg-saffron" />
          </span>
          {pendingRequests > 1 ? `Loading ${pendingRequests} requests...` : "Loading..."}
        </div>
      </div>
      <div className="mx-auto mt-3 hidden max-w-7xl justify-end px-4 lg:px-8">
        <div className="flex items-center gap-2 rounded-lg border border-white/70 bg-white/90 px-3 py-2 text-xs font-bold text-gray-700 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/90 dark:text-gray-200">
          <span className="size-2 rounded-full bg-saffron" />
          {pendingRequests > 1 ? `Loading ${pendingRequests} requests...` : "Loading..."}
        </div>
      </div>
    </div>
  );
}
