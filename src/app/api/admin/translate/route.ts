import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

// POST /api/admin/translate
// Body: { text: string; from: "ar" | "en"; to: "ar" | "en" }
// Returns: { translation: string }

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY غير مضبوط — أضفه في متغيرات البيئة" },
      { status: 503 }
    );
  }

  let body: { text?: string; from?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, from = "ar", to = "en" } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "النص فارغ" }, { status: 400 });
  }

  if (text.length > 3000) {
    return NextResponse.json({ error: "النص طويل جداً (الحد الأقصى 3000 حرف)" }, { status: 400 });
  }

  const langNames: Record<string, string> = { ar: "Arabic", en: "English" };
  const fromLang = langNames[from] ?? from;
  const toLang   = langNames[to]   ?? to;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Translate the following ${fromLang} text to ${toLang}. Return ONLY the translated text, with no explanation, no quotes, no preamble.\n\n${text}`,
        },
      ],
    });

    const translation = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    return NextResponse.json({ translation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ في الاتصال بكلود";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
