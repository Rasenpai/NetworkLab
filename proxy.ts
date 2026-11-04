import { NextResponse, type NextRequest } from "next/server";

/**
 * Pemeriksaan cepat (optimistic): kalau tidak ada cookie sesi, arahkan ke /login.
 * Validasi sesi yang sebenarnya dilakukan di app/(app)/layout.tsx lewat requireUser().
 *
 * Catatan: di Next.js 14/15 ganti nama file ini menjadi middleware.ts
 * dan nama fungsi `proxy` menjadi `middleware`.
 */
const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!request.cookies.has("nl_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};