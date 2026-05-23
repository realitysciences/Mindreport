import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput, sanitizeLlmOutput } from "@/lib/sanitize";

export const maxDuration = 30;

// Lens menu  -  descriptions used only for the suggestion prompt, never exposed to client
const LENS_MENU = [
  { id: "foundational", description: "The deepest map  -  the core architecture of who this person is, how it was built, what it costs, and what it produced. Best when the material is rich and wide-ranging." },
  { id: "pattern",    description: "The recurring behavioral and emotional loops  -  the default architecture running across all contexts." },
  { id: "shadow",     description: "What is disowned, resisted, or projected outward  -  what is hidden from the self but visible in reactions." },
  { id: "desire",     description: "What the person is actually moving toward beneath their stated wants  -  the real driver underneath the goals." },
  { id: "relational", description: "How the person connects, protects, and creates distance  -  the attachment and relational style at work." },
  { id: "origin",     description: "The formative experiences and wounds still organizing present behavior  -  what from the past is running now." },
  { id: "identity",   description: "Who the person is across roles and contexts  -  where the self is coherent and where it is fractured." },
];

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ suggestions: [] });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ suggestions: [] });
  }

  const transcript = sanitizeInput(
    typeof (body as Record<string, unknown>).transcript === "string"
      ? (body as Record<string, unknown>).transcript as string
      : "",
    4000
  );

  if (transcript.length < 20) {
    return NextResponse.json({ suggestions: [] });
  }

  const lensMenu = LENS_MENU.map((l) => `- ${l.id}: ${l.description}`).join("\n");

  let raw = "";
  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: `You are a lens selector for a psychological cartography tool. Given a person's interview transcript, identify the 1 or 2 lenses that will produce the most revealing map for this specific person. Only recommend 2 if both are genuinely illuminating  -  otherwise recommend 1.

Available lenses:
${lensMenu}

Return ONLY a valid JSON object  -  no explanation, no markdown, no code fences:
{"suggestions": [{"id": "lens_id", "reason": "one precise sentence, max 15 words, explaining why this lens fits this person's specific words"}]}`,
      messages: [
        {
          role: "user",
          content: `<transcript>\n${transcript}\n</transcript>`,
        },
      ],
    });
    raw =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : "";
    raw = sanitizeLlmOutput(raw);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]));
      } catch { /* fall through */ }
    }
    return NextResponse.json({ suggestions: [] });
  }
}
