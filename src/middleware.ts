import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const admin = req.cookies.get("admin_auth")?.value === "1";
  const memberAuth = req.cookies.get("member_auth")?.value || "";

  if (pathname === "/login") return NextResponse.next();

  const teamMatch = pathname.match(/^\/team\/([^/]+)(?:\/.*)?$/);
  if (teamMatch) {
    const memberId = teamMatch[1];
    if (pathname === `/team/${memberId}/login`) return NextResponse.next();
    if (admin || memberAuth === memberId) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/team/${memberId}/login`;
    return NextResponse.redirect(url);
  }

  if (!admin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
