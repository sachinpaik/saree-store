import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest, isAdminRoute, isAdminLoginRoute } from "@/modules/auth/auth.service";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!isAdminRoute(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (isAdminLoginRoute(pathname)) {
    const user = await getSessionFromRequest(request);
    if (user && user.role === "admin") {
      const next = request.nextUrl.searchParams.get("next") || "/admin";
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const user = await getSessionFromRequest(request);
  if (!user || user.role !== "admin") {
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
