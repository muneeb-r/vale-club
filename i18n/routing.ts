import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "ca"],
  defaultLocale: "es",
  localePrefix: "as-needed", // ES → /, EN → /en, CA → /ca
  localeDetection: false,    // Always use ES by default, ignore Accept-Language
});
