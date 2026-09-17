import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureDbUser } from "@/lib/user";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

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

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to login with error parameter
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Could not verify your email or session code. Please try signing in again."
    )}`
  );
}
