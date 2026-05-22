import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// ── Limits ────────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 60_000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimText(text: string): string {
  return text.slice(0, MAX_TEXT_CHARS);
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

// ── PDF extraction via Anthropic (avoids Node.js-incompatible browser APIs) ──
async function extractPdfText(buffer: Buffer): Promise<string> {
  const anthropic = new Anthropic();
  const base64 = buffer.toString("base64");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract all the text from this document exactly as written. Return only the raw text content. Preserve paragraph breaks. No commentary, no formatting, no preamble — just the text.",
          },
        ],
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  const filename = (file as File).name ?? "upload";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type?.toLowerCase() ?? "";

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";
  let method = "";

  try {
    if (ext === "pdf" || mime === "application/pdf") {
      // Use Claude Haiku's native PDF understanding — no browser APIs needed
      text = await extractPdfText(buffer);
      method = "pdf";
    } else if (
      ext === "docx" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      method = "docx";
    } else if (ext === "txt" || ext === "md" || mime.startsWith("text/")) {
      text = buffer.toString("utf-8");
      method = "text";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, TXT, or Markdown file." },
        { status: 415 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse failed";
    console.error("[parse-document]", msg);
    return NextResponse.json({ error: `Could not read the file: ${msg}` }, { status: 422 });
  }

  text = cleanText(text);
  const words = wordCount(text);

  if (words < 20) {
    return NextResponse.json(
      { error: "The document appears to be empty or contains too little text." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    text: trimText(text),
    wordCount: words,
    filename,
    method,
  });
}
