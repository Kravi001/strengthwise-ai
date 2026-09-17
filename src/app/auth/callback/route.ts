import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureDbUser } from "@/lib/user";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Dynamically resolve the true origin (accounting for proxies/Vercel)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const resolvedOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        // Guarantee user exists in PostgreSQL database
        await ensureDbUser({
          id: data.user.id,
          email: data.user.email,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            (data.user.email ? data.user.email.split("@")[0] : null),
        });
      } catch (dbError) {
        console.error("Error ensuring user in database on auth callback:", dbError);
      }

      // Always return to root landing page in the black Tremor UI
      return NextResponse.redirect(`${resolvedOrigin}/`);
    }
  }

  // If there's an error or no code, stay on the root landing page
  return NextResponse.redirect(`${resolvedOrigin}/`);
}
