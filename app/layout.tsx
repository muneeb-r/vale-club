import type { ReactNode } from "react";

// Root layout is required by Next.js but html/body are provided
// by app/[locale]/layout.tsx — this just passes children through.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
