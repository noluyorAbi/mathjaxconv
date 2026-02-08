/**
 * KaTeX Generate API
 * Accepts natural language prompt and returns raw KaTeX via Gemini.
 *
 * CHANGE LOG & FEATURES:
 *
 * 1. Gemini integration
 * - What: POST handler calls Gemini API to generate KaTeX from natural language
 * - Why: Enables AI-assisted KaTeX generation in the playground
 * - Dependencies: GEMINI_API_KEY env, @google/genai
 *
 * CRITICAL NOTES:
 * - Security: Validates prompt length, sanitizes response
 * - Returns only raw KaTeX; no markdown wrappers
 */
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MAX_PROMPT_LENGTH = 500;

const SYSTEM_PROMPT = `You are a KaTeX/LaTeX math expression generator. Given a user's natural language description of a mathematical expression, formula, or equation, return ONLY the raw KaTeX/LaTeX string. No markdown, no $ or $$ wrappers, no explanation. Just the pure LaTeX that can be passed to KaTeX.renderToString(). Examples:
- "quadratic formula" -> x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
- "integral of x squared" -> \\int x^2 \\, dx
- "sum from 1 to n" -> \\sum_{i=1}^{n}
Always output valid KaTeX. If unclear, return a reasonable default.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : undefined;

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt must be at most ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate KaTeX for: ${prompt}`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "No KaTeX generated" },
        { status: 500 }
      );
    }

    const katex = text.replace(/^[\s$]*\$*|[\s$]*\$*$/g, "").trim();
    return NextResponse.json({ katex });
  } catch (err) {
    console.error("KaTeX generate error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}
