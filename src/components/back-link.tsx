import Link from "next/link";

/**
 * Way back to the page one level up, at the top left of every page below a
 * top-level page (Athletes, My training, Exercises).
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="self-start text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
    >
      <span aria-hidden="true" className="mr-1">
        ‹
      </span>
      {label}
    </Link>
  );
}
