import { NextRequest, NextResponse } from "next/server";
import { runResearchPipeline } from "@/lib/pipeline";
import type { ResearchRequest } from "@/types/research";

// Allow long-running requests — the pipeline can take several minutes
export const maxDuration = 300; // 5 minutes

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

  if (!body.marketOrCompetitor?.trim()) {
    return NextResponse.json(
      { error: "marketOrCompetitor is required" },
      { status: 400 },
    );
  }

  // Stream the pipeline results via Server-Sent Events
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await runResearchPipeline(
        {
          marketOrCompetitor: body.marketOrCompetitor.trim(),
          additionalContext: body.additionalContext?.trim(),
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
