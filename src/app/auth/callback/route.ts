import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

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

      // Check if user has an existing completed profile in Prisma
      try {
        const existingProfile = await prisma.profile.findUnique({
          where: { userId: data.user.id },
        });

        // If no profile or profile hasn't configured split/biometrics, take them to /profile to create it
        if (!existingProfile || !existingProfile.heightCm || !existingProfile.weightKg || !existingProfile.splitDays) {
          return NextResponse.redirect(`${resolvedOrigin}/profile?onboarding=true`);
        }
      } catch (checkErr) {
        console.warn("Could not check profile on callback:", checkErr);
      }

      // If next param was explicitly specified, redirect there
      if (next) {
        const cleanNext = next.startsWith("/") ? next : `/${next}`;
        return NextResponse.redirect(`${resolvedOrigin}${cleanNext}`);
      }

      // Default to /profile so the user can see their athlete profile & recommendations
      return NextResponse.redirect(`${resolvedOrigin}/profile`);
    }
  }

  // If there's an error or no code, redirect to /profile
  return NextResponse.redirect(`${resolvedOrigin}/profile`);
}
