import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export interface AuthUserInfo {
  id: string;
  email?: string | null;
  name?: string | null;
}

/**
 * Idempotently ensures a user record exists in the PostgreSQL database (public.users)
 * matching the Supabase auth user UUID.
 */
export async function ensureDbUser(user: AuthUserInfo) {
  if (!user.id) {
    throw new Error("User ID is required to ensure database user record.");
  }

  const email = user.email || `${user.id}@placeholder.strengthwise.ai`;
  const name =
    user.name || (user.email ? user.email.split("@")[0] : "StrengthWise Athlete");

  return await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email,
      name: name || undefined,
    },
    create: {
      id: user.id,
      email,
      name,
    },
  });
}

/**
 * Resolves the current authenticated user from Supabase SSR cookies,
 * and guarantees that their corresponding record exists in PostgreSQL.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const dbUser = await ensureDbUser({
    id: user.id,
    email: user.email,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : null),
  });

  return {
    supabaseUser: user,
    dbUser,
  };
}
