import { NextRequest, NextResponse } from "next/server";

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

// ── Reflow ────────────────────────────────────────────────────────────────────
// PDFs with narrow columns (cards, brochures, design exports) preserve every
// visual line-wrap as a hard \n.  Join consecutive non-empty lines within a
// block so the text reads as prose.  Blank lines remain paragraph separators.
function reflowText(text: string): string {
  const blocks = text.split(/\n[ \t]*\n/)
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
    .trim()
}

// ── PDF extraction via unpdf (serverless-safe, no browser APIs) ──────────────
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// ── RTF extraction (inline tokenizer, no dependencies) ────────────────────────
// Proper tokenizer-based approach: walks the RTF byte stream character by
// character rather than regex-stripping groups, which avoids the bug where
// iterative group removal eventually eats the outer document group and all
// body text with it.  Handles TextEdit, Word, Google Docs RTF exports.
function extractRtfText(buffer: Buffer): string {
  // latin1 preserves every byte value; we'll decode escapes manually
  const src = buffer.toString("latin1");
  const out: string[] = [];
  let i = 0;
  const n = src.length;

  // Per-depth skip flag.  When we enter a {\* ...} destination group the
  // content is non-text (font tables, color tables, picture data, etc.) so
  // we suppress output until the matching closing brace.
  let depth = 0;
  const skipAt: boolean[] = [false]; // skipAt[depth]
  let skipping = false;

  // \uc N  sets how many replacement bytes follow each \u escape (default 1)
  let ucBytes = 1;

  while (i < n) {
    const ch = src[i];

    // ── Group open ────────────────────────────────────────────────────────
    if (ch === "{") {
      depth++;
      skipAt[depth] = false;
      i++;
      continue;
    }

    // ── Group close ───────────────────────────────────────────────────────
    if (ch === "}") {
      skipAt[depth] = false;
      depth--;
      skipping = skipAt[depth] ?? false;
      i++;
      continue;
    }

    // ── Backslash sequences ───────────────────────────────────────────────
    if (ch === "\\") {
      i++;
      if (i >= n) break;
      const c2 = src[i];

      // \*  — non-text destination marker: skip this whole group
      if (c2 === "*") {
        skipAt[depth] = true;
        skipping = true;
        i++;
        continue;
      }

      // \'XX  — hex-encoded byte (cp1252 / macintosh)
      if (c2 === "'") {
        i++;
        if (i + 2 <= n) {
          const code = parseInt(src.slice(i, i + 2), 16);
          if (!skipping) out.push(String.fromCharCode(code));
          i += 2;
        }
        continue;
      }

      // \\  \{  \}  — literal characters
      if (c2 === "\\" || c2 === "{" || c2 === "}") {
        if (!skipping) out.push(c2);
        i++;
        continue;
      }

      // Bare backslash at end of source line — not a paragraph break
      if (c2 === "\n" || c2 === "\r") {
        i++;
        continue;
      }

      // ── Control word  \[a-z]+[-\d]* ──────────────────────────────────
      if (c2 >= "a" && c2 <= "z") {
        let j = i;
        while (j < n && src[j] >= "a" && src[j] <= "z") j++;
        const word = src.slice(i, j);

        // Optional signed numeric parameter
        let num = 0;
        if (j < n && (src[j] === "-" || (src[j] >= "0" && src[j] <= "9"))) {
          const neg = src[j] === "-";
          if (neg) j++;
          const s0 = j;
          while (j < n && src[j] >= "0" && src[j] <= "9") j++;
          num = parseInt(src.slice(s0, j), 10);
          if (neg) num = -num;
        }

        // Consume optional trailing space delimiter
        if (j < n && src[j] === " ") j++;

        i = j;
        if (skipping) continue;

        switch (word) {
          case "par":
          case "pard":
          case "sect":
          case "page":
          case "column":
          case "line":
            out.push("\n");
            break;
          case "tab":
            out.push("\t");
            break;
          case "uc":
            ucBytes = num;
            break;
          case "u": {
            // Unicode char: \uN followed by ucBytes replacement bytes
            const cp = num < 0 ? num + 65536 : num;
            out.push(String.fromCodePoint(cp));
            // Skip replacement bytes (usually 0 or 1 ASCII chars)
            let skip = ucBytes;
            while (skip > 0 && i < n) {
              if (src[i] === "\\") {
                // replacement encoded as \'XX counts as 1 byte
                if (src[i + 1] === "'") { i += 4; } else { i += 2; }
              } else {
                i++;
              }
              skip--;
            }
            break;
          }
          // All other control words: ignore (formatting, metadata, etc.)
        }
        continue;
      }

      // Control symbol (single non-alpha char) — skip
      i++;
      continue;
    }

    // ── Plain text ────────────────────────────────────────────────────────
    if (!skipping) {
      // Literal CR/LF in RTF source are line-continuation noise, not content
      if (ch !== "\r" && ch !== "\n") out.push(ch);
    }
    i++;
  }

  let text = out.join("");

  // Collapse runs of spaces while preserving newlines
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n[ \t]+/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");

  return text.trim();
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
      // unpdf: serverless-safe PDF.js wrapper, no browser APIs needed
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
    } else if (ext === "rtf" || mime === "application/rtf" || mime === "text/rtf") {
      text = extractRtfText(buffer);
      method = "rtf";
    } else if (ext === "txt" || ext === "md" || mime.startsWith("text/")) {
      text = buffer.toString("utf-8");
      method = "text";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, RTF, TXT, or Markdown file." },
        { status: 415 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse failed";
    console.error("[parse-document]", msg);
    return NextResponse.json({ error: `Could not read the file: ${msg}` }, { status: 422 });
  }

  text = cleanText(text);
  text = reflowText(text);
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
