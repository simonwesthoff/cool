/** Neutral placeholder while a page section loads. */
export function LoadingPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mt-24 size-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
    />
  );
}
