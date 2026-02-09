/**
 * Klausur Chat API
 * PDF-aware chat with Gemini. Accepts chat history and returns model response.
 *
 * CHANGE LOG & FEATURES:
 *
 * 1. PDF context
 * - What: Loads Klausur PDF from public/, passes as inlineData to Gemini
 * - Why: LLM has full document access for expert Q&A
 * - Dependencies: fs, path, GEMINI_API_KEY, @google/genai
 *
 * 2. Multi-turn chat
 * - What: Accepts messages array (user/model), builds Gemini contents with history
 * - Why: Conversational context for follow-up questions
 *
 * 3. System instruction
 * - What: Expert persona, LaTeX for math $(...)$, answer from PDF only
 * - Why: Consistent, document-grounded responses
 *
 * CRITICAL NOTES:
 * - Security: Strict message validation, prompt length limits
 * - PDF limit: 50MB inline; current file ~8MB
 */
import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  createPartFromBase64,
  createPartFromText,
  createUserContent,
  createModelContent,
  type Content,
} from "@google/genai";
import fs from "node:fs";
import path from "node:path";

const PDF_FILENAME = "klausur-vorbereitung-aufgabe-loesung-pro-quelle.pdf";
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 8000;

const SYSTEM_PROMPT = `You are an expert tutor for the Klausurvorbereitung document. You have full access to the PDF and answer questions solely based on its content. Use Markdown for formatting and LaTeX for math: inline $...$ or block $$...$$. Be precise and cite the document when relevant. If the answer is not in the document, say so clearly.`;

interface ChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

function validateMessages(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;

  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (typeof m !== "object" || m === null) return null;
    const msg = m as Record<string, unknown>;
    const role = msg.role;
    if (role !== "user" && role !== "model") return null;
    const parts = msg.parts;
    if (!Array.isArray(parts) || parts.length === 0) return null;
    const validParts: Array<{ text: string }> = [];
    for (const p of parts) {
      if (typeof p !== "object" || p === null) return null;
      const part = p as Record<string, unknown>;
      const text = part.text;
      if (typeof text !== "string") return null;
      if (text.length > MAX_MESSAGE_LENGTH) return null;
      validParts.push({ text });
    }
    out.push({ role, parts: validParts });
  }
  const last = out[out.length - 1];
  if (last?.role !== "user") return null;
  return out;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const messages = validateMessages(body.messages);
    if (!messages) {
      return NextResponse.json(
        { error: "Invalid or missing messages array" },
        { status: 400 }
      );
    }

    const pdfPath = path.join(process.cwd(), "public", PDF_FILENAME);
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: "PDF not found" },
        { status: 404 }
      );
    }

    const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");
    const pdfPart = createPartFromBase64(pdfBase64, "application/pdf");

    const contents: Content[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const userText = msg.parts.map((p) => p.text).join("\n").trim();

      if (msg.role === "user" && i === 0) {
        contents.push(
          createUserContent([pdfPart, createPartFromText(userText)])
        );
      } else if (msg.role === "user") {
        contents.push(createUserContent(userText));
      } else {
        contents.push(createModelContent(userText));
      }
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Klausur chat error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Chat failed: ${message}` },
      { status: 500 }
    );
  }
}
