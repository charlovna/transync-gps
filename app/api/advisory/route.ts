import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type NearestEvent = {
  name: string;
  location: string;
  traffic_note: string;
  days_away: number;
} | null;

export async function POST(req: NextRequest) {
  const {
    destination,
    eta_minutes,
    risk_level,
    advisory_text,
    weather,
    nearest_event,
  }: {
    destination: string;
    eta_minutes: number;
    risk_level: string;
    advisory_text: string;
    weather: { condition: { label: string }; temperature: number; wind_speed: number; precipitation: number } | null;
    nearest_event: NearestEvent;
  } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not set", { status: 500 });
  }

  const weatherDesc = weather
    ? `${weather.condition.label} at ${weather.temperature}°C, wind ${weather.wind_speed} km/h${weather.precipitation > 0 ? `, ${weather.precipitation}mm rain` : ""}`
    : "conditions unknown";

  // Only surface an event if it's within a week — further than that and it
  // stops being commuter-relevant context and starts being noise.
  const eventLine =
    nearest_event && nearest_event.days_away <= 7
      ? `Local context: ${nearest_event.name} is in ${nearest_event.days_away} days at ${nearest_event.location}. ${nearest_event.traffic_note}
Warn commuters about expected congestion near this event with specific road names.`
      : "";

  const prompt = `You are Transync AI, a smart commuter assistant for Lipa City, Batangas, Philippines.

A commuter is about to travel to ${destination}. Route context:
- ETA: ${eta_minutes} minutes
- Traffic risk level: ${risk_level}
- Current weather: ${weatherDesc}
- Route advisory: ${advisory_text || "None."}
${eventLine ? "\n" + eventLine + "\n" : ""}
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
