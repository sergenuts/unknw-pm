import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminCookie = req.cookies.get("admin_auth")?.value;
  const admin = adminCookie === "1" || adminCookie === "viewer";
  const memberAuth = req.cookies.get("member_auth")?.value || "";

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-pathname", pathname);
  const passthrough = () => NextResponse.next({ request: { headers: reqHeaders } });

  if (pathname === "/login") return passthrough();
  if (pathname.startsWith("/r/")) return passthrough();

  const teamMatch = pathname.match(/^\/team\/([^/]+)(?:\/.*)?$/);
  if (teamMatch) {
    const memberId = teamMatch[1];
    if (pathname === `/team/${memberId}/login`) return passthrough();
    if (admin || memberAuth === memberId) return passthrough();
    const url = req.nextUrl.clone();
    url.pathname = `/team/${memberId}/login`;
    return NextResponse.redirect(url);
  }

  if (!admin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return passthrough();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
