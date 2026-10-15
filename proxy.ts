import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "softdealz_session";

const PROTECTED = ["/account", "/admin", "/checkout", "/cart"];

/** Only same-site absolute paths are allowed as a post-login destination. */
function safeNext(pathname: string, search: string): string {
  const target = `${pathname}${search}`;
  if (!target.startsWith("/") || target.startsWith("//") || target.includes("\\")) return "/";
  return target;
}

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const requestHeaders = new Headers(request.headers);
  let csp: string | undefined;

  if (process.env.NODE_ENV === "production") {
    const nonce = randomBytes(16).toString("base64");
    csp = contentSecurityPolicy(nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  let response: NextResponse;
  if (isProtected && !request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", safeNext(pathname, search));
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (csp) response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
