import { LanguageSwitcher } from "./language-switcher";

export function PageHeader() {
  return (
    <header className="flex justify-end px-4 py-3 sm:px-8">
      <LanguageSwitcher />
    </header>
  );
}
