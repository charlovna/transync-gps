import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { destination, eta_minutes, risk_level, advisory_text, weather } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not set", { status: 500 });
  }

  const weatherDesc = weather
    ? `${weather.condition.label} at ${weather.temperature}°C, wind ${weather.wind_speed} km/h${weather.precipitation > 0 ? `, ${weather.precipitation}mm rain` : ""}`
    : "conditions unknown";

  const prompt = `You are Transync AI, a smart commuter assistant for Lipa City, Batangas, Philippines.

A commuter is about to travel to ${destination}. Route context:
- ETA: ${eta_minutes} minutes
- Traffic risk level: ${risk_level}
- Current weather: ${weatherDesc}
- Route advisory: ${advisory_text || "None."}

Give a focused, practical 2-sentence commuter insight that adds genuine value beyond what the advisory already says. Be specific to Lipa City roads and commuter conditions. Mention one concrete action the commuter should take right now. Plain prose only — no bullets, no markdown, no headers.`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 160,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
