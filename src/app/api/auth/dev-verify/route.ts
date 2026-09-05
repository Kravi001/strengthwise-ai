import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Find the user in auth.users
    const users = await prisma.$queryRaw<Array<{ id: string; email: string; raw_user_meta_data: unknown }>>`
      SELECT id, email, raw_user_meta_data FROM auth.users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: `No registered account found for ${email}. Please click 'Sign Up' first.` },
        { status: 404 }
      );
    }

    const authUser = users[0];

    // Confirm the email directly in PostgreSQL
    await prisma.$executeRaw`
      UPDATE auth.users 
      SET email_confirmed_at = NOW(), updated_at = NOW() 
      WHERE id = ${authUser.id}::uuid
    `;

    // Guarantee sync to public.users table in Prisma
    const meta = authUser.raw_user_meta_data as Record<string, unknown> | null;
    const name = (meta?.full_name as string) || (meta?.name as string) || authUser.email.split("@")[0];

    await ensureDbUser({
      id: authUser.id,
      email: authUser.email,
      name,
    });

    return NextResponse.json({
      success: true,
      message: "Account email verified successfully! You can now sign in immediately.",
    });
  } catch (error) {
    console.error("Dev verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify account in database." },
      { status: 500 }
    );
  }
}
