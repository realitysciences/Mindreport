import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { detectSpeakers } from "@/lib/text";

export const maxDuration = 60;

// ── Limits ────────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
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

// PDFs with narrow columns preserve every visual line-wrap as a hard \n.
// Join consecutive non-empty lines within a block so the text reads as prose.
function reflowText(text: string): string {
  const blocks = text.split(/\n[ \t]*\n/);
  return blocks
    .map((block) =>
      block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

// ── VTT / SRT transcript stripping ───────────────────────────────────────────
function parseTimedTranscript(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (t === "WEBVTT") return false;
      if (/^\d+$/.test(t)) return false;             // SRT index
      if (/^\d{2}:\d{2}/.test(t)) return false;      // timestamp
      if (/^-->/.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

// ── HTML tag stripping ────────────────────────────────────────────────────────
function stripHtmlTags(html: string): string {
  // Convert block elements to newlines before stripping
  return html
    .replace(/<\/?(p|div|br|li|tr|blockquote|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g,  "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── PDF extraction via unpdf ──────────────────────────────────────────────────
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// ── Image / scanned PDF vision ────────────────────────────────────────────────
async function extractWithVision(
  buffer: Buffer,
  mime: string
): Promise<{ text: string; speakers?: string[] }> {
  const anthropic  = new Anthropic();
  const base64     = buffer.toString("base64");
  const mediaType  = (mime || "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const result = await anthropic.messages.create({
    model:      "claude-sonnet-4-5",
    max_tokens: 4096,
    messages:   [
      {
        role:    "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: `Return a JSON object — no markdown, no code fences:
{ "text": "...", "speakers": ["Name1", "Name2"] }

If this is a chat or messaging screenshot (iMessage, SMS, WhatsApp, Telegram, etc.):
- Look at the top for the contact name or group name — use that as the other person's name
- RIGHT-side bubbles are from "Me"; LEFT-side bubbles are from the contact (use their name; if unknown use "Them")
- "text": format as "Speaker: message text" on its own line, chronologically
- "speakers": unique speaker names in order of first appearance, e.g. ["Shannon", "Me"]

If this is NOT a chat screenshot:
- "text": extract all visible text exactly as it appears
- "speakers": []

Return ONLY valid JSON.`,
          },
        ],
      },
    ],
  });

  const raw = result.content[0].type === "text" ? result.content[0].text.trim() : "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.text === "string") {
      return {
        text:     parsed.text.trim(),
        speakers: Array.isArray(parsed.speakers)
          ? parsed.speakers.filter(Boolean)
          : undefined,
      };
    }
  } catch { /* fall through */ }
  return { text: raw };
}

// ── RTF extraction ─────────────────────────────────────────────────────────────
function extractRtfText(buffer: Buffer): string {
  const src = buffer.toString("latin1");
  const out: string[] = [];
  let i = 0;
  const n = src.length;

  let depth = 0;
  const skipAt: boolean[] = [false];
  let skipping = false;
  let ucBytes = 1;

  while (i < n) {
    const ch = src[i];

    if (ch === "{") {
      depth++;
      skipAt[depth] = false;
      i++;
      continue;
    }

    if (ch === "}") {
      skipAt[depth] = false;
      depth--;
      skipping = skipAt[depth] ?? false;
      i++;
      continue;
    }

    if (ch === "\\") {
      i++;
      if (i >= n) break;
      const c2 = src[i];

      if (c2 === "*") { skipAt[depth] = true; skipping = true; i++; continue; }

      if (c2 === "'") {
        i++;
        if (i + 2 <= n) {
          const code = parseInt(src.slice(i, i + 2), 16);
          if (!skipping) out.push(String.fromCharCode(code));
          i += 2;
        }
        continue;
      }

      if (c2 === "\\" || c2 === "{" || c2 === "}") { if (!skipping) out.push(c2); i++; continue; }
      if (c2 === "\n" || c2 === "\r") { i++; continue; }

      if (c2 >= "a" && c2 <= "z") {
        let j = i;
        while (j < n && src[j] >= "a" && src[j] <= "z") j++;
        const word = src.slice(i, j);
        let num = 0;
        if (j < n && (src[j] === "-" || (src[j] >= "0" && src[j] <= "9"))) {
          const neg = src[j] === "-";
          if (neg) j++;
          const s0 = j;
          while (j < n && src[j] >= "0" && src[j] <= "9") j++;
          num = parseInt(src.slice(s0, j), 10);
          if (neg) num = -num;
        }
        if (j < n && src[j] === " ") j++;
        i = j;
        if (skipping) continue;

        switch (word) {
          case "par": case "pard": case "sect": case "page": case "column": case "line":
            out.push("\n"); break;
          case "tab": out.push("\t"); break;
          case "uc":  ucBytes = num;  break;
          case "u": {
            const cp = num < 0 ? num + 65536 : num;
            out.push(String.fromCodePoint(cp));
            let skip = ucBytes;
            while (skip > 0 && i < n) {
              if (src[i] === "\\") { if (src[i + 1] === "'") { i += 4; } else { i += 2; } }
              else { i++; }
              skip--;
            }
            break;
          }
        }
        continue;
      }
      i++;
      continue;
    }

    if (!skipping) { if (ch !== "\r" && ch !== "\n") out.push(ch); }
    i++;
  }

  let text = out.join("");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n[ \t]+/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  return text.trim();
}

// ── Platform JSON parsers ─────────────────────────────────────────────────────

type InstagramMessage = { sender_name: string; content?: string; timestamp_ms?: number };
type InstagramThread  = { participants?: { name: string }[]; messages?: InstagramMessage[] };

function parseInstagramJSON(raw: string): string {
  let data: InstagramThread;
  try { data = JSON.parse(raw); } catch { return ""; }
  if (!Array.isArray(data.messages)) return "";
  const lines = [...data.messages]
    .sort((a, b) => (a.timestamp_ms ?? 0) - (b.timestamp_ms ?? 0))
    .filter((m) => m.sender_name && m.content?.trim())
    .map((m) => `${m.sender_name}: ${m.content!.trim()}`);
  return lines.join("\n");
}

type TelegramMessage = { type: string; from?: string; text?: string | Array<string | { type: string; text: string }>; date?: string };
type TelegramExport  = { messages?: TelegramMessage[] };

function parseTelegramJSON(raw: string): string {
  let data: TelegramExport;
  try { data = JSON.parse(raw); } catch { return ""; }
  if (!Array.isArray(data.messages)) return "";
  const lines = data.messages
    .filter((m) => m.type === "message" && m.from && m.text)
    .map((m) => {
      const body = Array.isArray(m.text)
        ? m.text.map((t) => (typeof t === "string" ? t : t.text ?? "")).join("")
        : (m.text ?? "");
      return body.trim() ? `${m.from}: ${body.trim()}` : "";
    })
    .filter(Boolean);
  return lines.join("\n");
}

type DiscordMessage = { type?: string; content?: string; author?: { name?: string; nickname?: string } };
type DiscordExport  = { messages?: DiscordMessage[] };

function parseDiscordJSON(raw: string): string {
  let data: DiscordExport;
  try { data = JSON.parse(raw); } catch { return ""; }
  if (!Array.isArray(data.messages) || !data.messages[0]?.author) return "";
  const lines = data.messages
    .filter((m) => m.content?.trim())
    .map((m) => {
      const name = m.author?.nickname?.trim() || m.author?.name?.trim() || "Unknown";
      return `${name}: ${m.content!.trim()}`;
    });
  return lines.join("\n");
}

type SnapchatMessage = { From?: string; "Media Type"?: string; Created?: string; Text?: string };
type SnapchatExport  = { "Received Saved Chat History"?: SnapchatMessage[]; "Sent Saved Chat History"?: SnapchatMessage[] };

function parseSnapchatJSON(raw: string): string {
  let data: SnapchatExport;
  try { data = JSON.parse(raw); } catch { return ""; }
  const received = data["Received Saved Chat History"] ?? [];
  const sent     = data["Sent Saved Chat History"]     ?? [];
  if (!received.length && !sent.length) return "";
  const lines = [...received, ...sent]
    .filter((m) => m["Media Type"] === "TEXT" && m.Text?.trim())
    .sort((a, b) => new Date(a.Created ?? "").getTime() - new Date(b.Created ?? "").getTime())
    .map((m) => `${m.From ?? "Unknown"}: ${m.Text!.trim()}`);
  return lines.join("\n");
}

type TinderMessage = { message?: string; sent_date?: string; from?: string };
type TinderMatch   = { match_id?: string; messages?: TinderMessage[] };
type TinderExport  = { Messages?: TinderMatch[] };

function parseTinderJSON(raw: string): string {
  let data: TinderExport;
  try { data = JSON.parse(raw); } catch { return ""; }
  if (!Array.isArray(data.Messages) || !data.Messages[0]?.messages) return "";
  const all: { date: number; sender: string; text: string }[] = [];
  for (const match of data.Messages) {
    for (const msg of (match.messages ?? [])) {
      if (!msg.message?.trim()) continue;
      const sender = msg.from === "You" || !msg.from ? "Me" : msg.from;
      all.push({ date: new Date(msg.sent_date ?? "").getTime(), sender, text: msg.message.trim() });
    }
  }
  return all.sort((a, b) => a.date - b.date).map((m) => `${m.sender}: ${m.text}`).join("\n");
}

type HingeChat  = { body?: string; timestamp?: string };
type HingeMatch = { chats?: HingeChat[] };

function parseHingeJSON(raw: string): string {
  let data: HingeMatch[];
  try { data = JSON.parse(raw); } catch { return ""; }
  if (!Array.isArray(data) || !data[0]?.chats) return "";
  const all: { date: number; text: string }[] = [];
  for (const match of data) {
    for (const chat of (match.chats ?? [])) {
      if (!chat.body?.trim()) continue;
      all.push({ date: new Date(chat.timestamp ?? "").getTime(), text: chat.body.trim() });
    }
  }
  return all.sort((a, b) => a.date - b.date).map((m) => m.text).join("\n");
}

// ── ZIP extractor ─────────────────────────────────────────────────────────────
async function extractZipText(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip   = await JSZip.loadAsync(buffer);
  const parts: string[] = [];

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  // Prefer readable text formats first
  entries.sort((a, b) => {
    const score = (n: string) =>
      n.endsWith(".txt")  ? 0 : n.endsWith(".html") || n.endsWith(".htm") ? 1 :
      n.endsWith(".json") ? 2 : n.endsWith(".vtt")  || n.endsWith(".srt") ? 3 :
      n.endsWith(".pdf")  ? 4 : n.endsWith(".docx") ? 5 : 6;
    return score(a.name.toLowerCase()) - score(b.name.toLowerCase());
  });

  for (const entry of entries) {
    const name = entry.name.toLowerCase();
    // Skip binaries and media
    if (/\.(jpg|jpeg|png|gif|webp|mp4|mp3|aac|opus|m4a|mov|avi|heic|heif|svg|db|sqlite|bin|dat|exe|dll|so|dylib|wasm|lock|log|map|cache)$/.test(name)) continue;

    try {
      const entryBuffer = Buffer.from(await entry.async("arraybuffer"));
      let extracted = "";

      if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
        extracted = entryBuffer.toString("utf-8");
      } else if (name.endsWith(".html") || name.endsWith(".htm")) {
        extracted = stripHtmlTags(entryBuffer.toString("utf-8"));
      } else if (name.endsWith(".json")) {
        const raw = entryBuffer.toString("utf-8");
        extracted =
          parseInstagramJSON(raw) ||
          parseTelegramJSON(raw)  ||
          parseSnapchatJSON(raw)  ||
          parseDiscordJSON(raw)   ||
          parseTinderJSON(raw)    ||
          parseHingeJSON(raw)     ||
          "";
      } else if (name.endsWith(".vtt") || name.endsWith(".srt")) {
        extracted = parseTimedTranscript(entryBuffer.toString("utf-8"));
      } else if (name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const res     = await mammoth.extractRawText({ buffer: entryBuffer });
        extracted = res.value;
      } else if (name.endsWith(".rtf")) {
        extracted = extractRtfText(entryBuffer);
      }

      if (extracted.trim()) parts.push(extracted.trim());
    } catch { /* skip unreadable entries */ }
  }

  return parts.join("\n\n");
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
  const ext  = filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type?.toLowerCase() ?? "";

  const buffer = Buffer.from(await file.arrayBuffer());
  let text   = "";
  let method = "";
  let aiSpeakers: string[] | undefined;

  try {
    // ── PDF ──────────────────────────────────────────────────────────────────
    if (ext === "pdf" || mime === "application/pdf") {
      text   = await extractPdfText(buffer);
      method = "pdf";
    }
    // ── DOCX ─────────────────────────────────────────────────────────────────
    else if (
      ext === "docx" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result  = await mammoth.extractRawText({ buffer });
      text   = result.value;
      method = "docx";
    }
    // ── RTF ───────────────────────────────────────────────────────────────────
    else if (ext === "rtf" || mime === "application/rtf" || mime === "text/rtf") {
      text   = extractRtfText(buffer);
      method = "rtf";
    }
    // ── VTT / SRT ─────────────────────────────────────────────────────────────
    else if (ext === "vtt" || ext === "srt") {
      text   = parseTimedTranscript(buffer.toString("utf-8"));
      method = ext;
    }
    // ── Images → Claude vision ────────────────────────────────────────────────
    else if (
      ["png", "jpg", "jpeg", "webp"].includes(ext) ||
      mime.startsWith("image/")
    ) {
      const imageMime =
        ext === "png"  ? "image/png"  :
        ext === "webp" ? "image/webp" :
        "image/jpeg";
      const result = await extractWithVision(buffer, imageMime);
      text         = result.text;
      aiSpeakers   = result.speakers;
      method       = "image";
    }
    // ── HTML ──────────────────────────────────────────────────────────────────
    else if (
      ext === "html" || ext === "htm" ||
      mime === "text/html"
    ) {
      text   = stripHtmlTags(buffer.toString("utf-8"));
      method = "html";
    }
    // ── JSON platform exports ──────────────────────────────────────────────────
    else if (ext === "json" || mime === "application/json") {
      const raw = buffer.toString("utf-8");
      text =
        parseInstagramJSON(raw) ||
        parseTelegramJSON(raw)  ||
        parseSnapchatJSON(raw)  ||
        parseDiscordJSON(raw)   ||
        parseTinderJSON(raw)    ||
        parseHingeJSON(raw)     ||
        raw;
      method = "json";
    }
    // ── CSV ───────────────────────────────────────────────────────────────────
    else if (ext === "csv" || mime === "text/csv") {
      text   = buffer.toString("utf-8");
      method = "csv";
    }
    // ── ZIP ───────────────────────────────────────────────────────────────────
    else if (
      ext === "zip" ||
      mime === "application/zip" ||
      mime === "application/x-zip-compressed"
    ) {
      text   = await extractZipText(buffer);
      method = "zip";
    }
    // ── Plain text / Markdown ─────────────────────────────────────────────────
    else if (
      ext === "txt" || ext === "md" ||
      mime.startsWith("text/")
    ) {
      text   = buffer.toString("utf-8");
      method = "text";
    }
    // ── Unsupported ───────────────────────────────────────────────────────────
    else {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, DOCX, image, VTT/SRT, JSON, HTML, TXT, or ZIP file.",
        },
        { status: 415 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse failed";
    console.error("[parse-document]", msg);
    return NextResponse.json({ error: `Could not read the file: ${msg}` }, { status: 422 });
  }

  text = cleanText(text);
  if (method !== "image" && method !== "json") {
    // Reflow for document-style formats (not chat transcripts)
    const isTranscript = detectSpeakers(text).length >= 2;
    if (!isTranscript) text = reflowText(text);
  }

  const words = wordCount(text);
  if (words < 20) {
    return NextResponse.json(
      { error: "The document appears to be empty or contains too little text." },
      { status: 422 }
    );
  }

  // ── Speaker detection ──────────────────────────────────────────────────────
  const speakers: string[] = aiSpeakers?.length
    ? aiSpeakers
    : detectSpeakers(text);

  return NextResponse.json({
    text:     trimText(text),
    wordCount: words,
    filename,
    method,
    ...(speakers.length >= 2 ? { speakers } : {}),
  });
}
