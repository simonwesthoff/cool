import Image from "next/image";

/** Up to two initials from a name, e.g. "Ada Lovelace" -> "AL". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1] ?? "") : "";
  return (
    Array.from(first)[0] + (last ? (Array.from(last)[0] ?? "") : "")
  ).toUpperCase();
}

type Props = {
  name: string;
  image: string | null;
  /** Accessible description of the picture. */
  alt: string;
  size?: number;
};

/** Profile picture, or the person's initials when there is none. */
export function Avatar({ name, image, alt, size = 64 }: Props) {
  if (image) {
    return (
      <Image
        src={image}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={alt}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
      className="inline-flex items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
    >
      {initials(name)}
    </span>
  );
}
