import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    services: {
      supabaseAuth: {
        configured: Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ),
        status: "unknown",
        error: null as string | null,
      },
      postgresPrisma: {
        configured: Boolean(process.env.DATABASE_URL),
        status: "unknown",
        error: null as string | null,
      },
    },
  };

  // Test Supabase Auth
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      results.services.supabaseAuth.status = "error";
      results.services.supabaseAuth.error = error.message;
    } else {
      results.services.supabaseAuth.status = "connected";
    }
  } catch (err: unknown) {
    results.services.supabaseAuth.status = "error";
    results.services.supabaseAuth.error =
      err instanceof Error ? err.message : String(err);
  }

  // Test PostgreSQL via Prisma
  try {
    // Basic connectivity check: SELECT 1
    await prisma.$queryRaw`SELECT 1 as connected`;
    results.services.postgresPrisma.status = "connected";
  } catch (err: unknown) {
    results.services.postgresPrisma.status = "error";
    results.services.postgresPrisma.error =
      err instanceof Error ? err.message : String(err);
  }

  const allConnected =
    results.services.supabaseAuth.status === "connected" &&
    results.services.postgresPrisma.status === "connected";

  return NextResponse.json(results, {
    status: allConnected ? 200 : 207,
  });
}
