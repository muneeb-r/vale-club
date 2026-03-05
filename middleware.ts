import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// With localePrefix: "as-needed", ES has no prefix (/) and EN has /en prefix
const PROTECTED_DASHBOARD = /^(\/(en|ca))?\/dashboard/;
const PROTECTED_ADMIN = /^(\/(en|ca))?\/admin/;
const AUTH_PAGES = /^(\/(en|ca))?\/(login|register)$/;
const PROTECTED_PERFIL = /^(\/(en|ca))?\/perfil/;

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("vale_token")?.value;
  const user = token ? await verifyToken(token) : null;

  const locale = pathname.startsWith("/en")
    ? "en"
    : pathname.startsWith("/ca")
      ? "ca"
      : "es";
  const localePath = locale === "es" ? "" : `/${locale}`;

  // Redirect logged-in users away from auth pages
  if (AUTH_PAGES.test(pathname) && user) {
    const dest =
      user.role === "admin"
        ? localePath + "/admin"
        : user.role === "business_owner"
          ? localePath + "/dashboard"
          : localePath + "/perfil";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Protect dashboard (business owners only)
  if (PROTECTED_DASHBOARD.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(
        new URL(
          localePath + "/login?next=" + encodeURIComponent(pathname),
          req.url,
        ),
      );
    }
    if (user.role === "user") {
      return NextResponse.redirect(new URL(localePath + "/perfil", req.url));
    }
  }

  // Protect admin
  if (PROTECTED_ADMIN.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL(localePath + "/login", req.url));
    }
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL(localePath + "/dashboard", req.url));
    }
  }

  // Protect /perfil (customers only)
  if (PROTECTED_PERFIL.test(pathname) && !user) {
    return NextResponse.redirect(
      new URL(
        localePath + "/login?next=" + encodeURIComponent(pathname),
        req.url,
      ),
    );
  }

  // Run intl middleware — handles locale detection and rewrites to /[locale]/...
  const intlResponse = intlMiddleware(req);

  // Pass user info via headers for server components
  if (user) {
    intlResponse.headers.set("x-user-id", user.userId);
    intlResponse.headers.set("x-user-role", user.role);
    intlResponse.headers.set("x-user-email", user.email);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files, images, and files with extensions
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).+)",
    "/",
  ],
};
