interface AppLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function AppLoader({ label = "Loading...", fullScreen = false }: AppLoaderProps) {
  return (
    <div className={fullScreen ? "grid min-h-screen place-items-center p-6" : "grid min-h-40 place-items-center p-6"}>
      <div className="flex items-center gap-3 rounded-lg border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-gray-700 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/80 dark:text-gray-200">
        <span className="grid size-5 animate-spin place-items-center rounded-full border-2 border-saffron/20 border-t-saffron">
          <span className="size-2 rounded-full bg-saffron" />
        </span>
        {label}
      </div>
    </div>
  );
}
