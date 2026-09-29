import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, provider } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Please enter a valid API key string." },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim().replace(/^["'\s]+|["'\s]+$/g, "");
    const isAnthropic = provider === "anthropic" || trimmedKey.startsWith("sk-ant-");
    const keyName = isAnthropic ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY";

    // Set process.env immediately for runtime
    process.env[keyName] = trimmedKey;

    // Update .env.local (or .env if .env.local doesn't exist)
    const envLocalPath = path.join(process.cwd(), ".env.local");
    const envPath = path.join(process.cwd(), ".env");
    const targetFile = fs.existsSync(envLocalPath) ? envLocalPath : envPath;

    let envContent = "";
    if (fs.existsSync(targetFile)) {
      envContent = fs.readFileSync(targetFile, "utf-8");
    }

    // Replace or append key
    const regex = new RegExp(`^${keyName}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${keyName}="${trimmedKey}"`);
    } else {
      envContent += `\n${keyName}="${trimmedKey}"\n`;
    }

    fs.writeFileSync(targetFile, envContent, "utf-8");

    const maskedKey = `${trimmedKey.slice(0, 7)}...${trimmedKey.slice(-4)}`;

    return NextResponse.json({
      success: true,
      provider: isAnthropic ? "anthropic" : "gemini",
      keyName,
      maskedKey,
      message: `Successfully connected ${isAnthropic ? "Anthropic Claude API" : "Google Gemini API"} (${maskedKey})!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  return NextResponse.json({
    hasAnthropic,
    hasGemini,
    activeProvider: hasAnthropic ? "anthropic" : hasGemini ? "gemini" : "offline-engine",
  });
}
