import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import { parseResetTime } from "@/lib/date";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: auth.dbUser.id },
      select: { mealResetTime: true },
    });

    return NextResponse.json({
      resetTime: profile?.mealResetTime || "00:00",
    });
  } catch (error) {
    console.error("Failed to fetch meal reset time:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal reset time." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rawResetTime = body.resetTime;

    if (!rawResetTime || typeof rawResetTime !== "string") {
      return NextResponse.json(
        { error: "Invalid reset time provided." },
        { status: 400 }
      );
    }

    const { hours, minutes } = parseResetTime(rawResetTime);
    const normalized = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    const profile = await prisma.profile.upsert({
      where: { userId: auth.dbUser.id },
      update: {
        mealResetTime: normalized,
      },
      create: {
        userId: auth.dbUser.id,
        mealResetTime: normalized,
      },
    });

    return NextResponse.json({
      success: true,
      resetTime: profile.mealResetTime || normalized,
    });
  } catch (error) {
    console.error("Failed to update meal reset time:", error);
    return NextResponse.json(
      { error: "Failed to update meal reset time." },
      { status: 500 }
    );
  }
}

export const PATCH = POST;
