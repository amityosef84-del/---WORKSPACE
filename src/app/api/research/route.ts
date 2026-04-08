import { NextRequest, NextResponse } from "next/server";
import { runResearchPipeline } from "@/lib/pipeline";
import type { ResearchRequest } from "@/types/research";

// Edge Runtime: streaming responses have no wall-clock timeout as long as
// bytes keep flowing. CPU-time limit is ~30s but AI calls are pure I/O
// (network wait on Anthropic API), so they don't consume local CPU.
// This replaces the old `maxDuration = 60` Serverless cap that killed the
// connection before the pipeline could finish.
export const runtime = "edge";

export async function POST(req: NextRequest) {
  // Validate API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY environment variable is not set" },
      { status: 500 },
    );
  }

  let body: ResearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrl = body.competitorUrl?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: "competitorUrl is required" },
      { status: 400 },
    );
  }

  // Auto-prepend https:// if missing scheme
  const competitorUrl =
    rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? rawUrl
      : `https://${rawUrl}`;

  // Validate it's actually a URL
  try {
    new URL(competitorUrl);
  } catch {
    return NextResponse.json(
      { error: "competitorUrl must be a valid URL" },
      { status: 400 },
    );
  }

  // Stream the pipeline results via Server-Sent Events
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await runResearchPipeline(
        {
          competitorUrl,
          additionalDetails: body.additionalDetails?.trim(),
          mode: body.mode,
          focusedCategory: body.focusedCategory,
        },
        controller,
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx buffering
    },
  });
}
