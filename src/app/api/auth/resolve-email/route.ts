import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();
    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        { error: "Identifier (username or email) is required." },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();

    // If it's already an email format
    if (trimmed.includes("@")) {
      return NextResponse.json({ email: trimmed });
    }

    // Try finding by name in public.users
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: trimmed, mode: "insensitive" } },
          { email: { equals: trimmed, mode: "insensitive" } },
        ],
      },
      select: { email: true },
    });

    if (dbUser?.email) {
      return NextResponse.json({ email: dbUser.email });
    }

    // Fallback: check auth.users metadata for username or full_name
    const rawMatches = await prisma.$queryRaw<Array<{ email: string }>>`
      SELECT email FROM auth.users 
      WHERE LOWER(raw_user_meta_data->>'username') = LOWER(${trimmed})
         OR LOWER(raw_user_meta_data->>'name') = LOWER(${trimmed})
         OR LOWER(raw_user_meta_data->>'full_name') = LOWER(${trimmed})
         OR LOWER(email) = LOWER(${trimmed})
      LIMIT 1
    `;

    if (rawMatches && rawMatches.length > 0 && rawMatches[0].email) {
      return NextResponse.json({ email: rawMatches[0].email });
    }

    return NextResponse.json(
      { error: `No profile found for username "${trimmed}". Please use your email or create an account.` },
      { status: 404 }
    );
  } catch (error) {
    console.error("Resolve email error:", error);
    return NextResponse.json(
      { error: "Failed to resolve username to email." },
      { status: 500 }
    );
  }
}
