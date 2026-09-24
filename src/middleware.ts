import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const BANNED_ROUTES = [
  "/login",
  "/meals",
  "/workouts",
  "/progress",
  "/coach",
  "/about",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Immediate redirect for any legacy or removed routes
  for (const route of BANNED_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      const redirectUrl = new URL("/", request.url);
      const res = NextResponse.redirect(redirectUrl, { status: 307 });
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
