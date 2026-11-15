import { LanguageSwitcher } from "./language-switcher";

/** Footer with the language switcher, for pages without the account menu. */
export function LanguageFooter() {
  return (
    <footer className="flex justify-end px-4 py-3 sm:px-8">
      <LanguageSwitcher />
    </footer>
  );
}
