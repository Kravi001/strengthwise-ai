import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Incorrect username or password.";

/**
 * Username + password sign-in.
 *
 * The username -> email lookup happens here on the server and the email is never
 * returned unless the password is correct, so this endpoint can't be used to look
 * up other people's email addresses. On success it returns session tokens, which
 * the browser hands to supabase.auth.setSession().
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`sign-in:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  let identifier: unknown;
  let password: unknown;
  try {
    ({ identifier, password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof identifier !== "string" || !identifier.trim() || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
  }

  try {
    const email = await resolveEmail(identifier.trim());
    if (!email) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Supabase only reports "not confirmed" once the password has been checked,
      // so returning the email here reveals it only to its owner.
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return NextResponse.json(
          { error: "Your email address hasn't been confirmed yet.", code: "email_not_confirmed", email },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Username sign-in error:", err);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}

async function resolveEmail(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { equals: identifier, mode: "insensitive" } },
        { email: { equals: identifier, mode: "insensitive" } },
      ],
    },
    select: { email: true },
  });
  if (dbUser?.email) return dbUser.email;

  const rawMatches = await prisma.$queryRaw<Array<{ email: string }>>`
    SELECT email FROM auth.users
    WHERE LOWER(raw_user_meta_data->>'username') = LOWER(${identifier})
       OR LOWER(raw_user_meta_data->>'name') = LOWER(${identifier})
       OR LOWER(raw_user_meta_data->>'full_name') = LOWER(${identifier})
    LIMIT 1
  `;
  return rawMatches?.[0]?.email ?? null;
}
