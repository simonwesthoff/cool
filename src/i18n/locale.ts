export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that stores the language the user chose on this device. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

/**
 * Returns the supported locale the browser prefers most, based on the
 * `Accept-Language` header, or undefined if it prefers none of them.
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale | undefined {
  if (!header) return undefined;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        language: tag.trim().toLowerCase().split("-")[0],
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return ranked.find((entry) => isLocale(entry.language))?.language as
    Locale | undefined;
}

/**
 * Chooses the UI language: the user's stored choice first, then the browser's
 * preference, then English.
 */
export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage(acceptLanguage) ?? defaultLocale;
}

/** Remembers the user's language choice on this device (browser only). */
export function storeLocaleChoice(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
