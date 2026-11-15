import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");
  return { title: t("name"), description: t("description") };
}

/**
 * The UI language is read per request (cookie / Accept-Language), so
 * everything that depends on it renders inside Suspense. The `lang`
 * attribute is set by an inline script before the content is painted.
 */
async function LocaleRoot({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Suspense>
          <LocaleRoot>{children}</LocaleRoot>
        </Suspense>
      </body>
    </html>
  );
}
