export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-lg p-8 text-center">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{body}</p>
    </div>
  );
}
