export const maxDuration = 300;

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an elite SEO content strategist and casino review expert for the South African online gambling market. You write for Novus Media.

Write a CONCISE but comprehensive 3,500-word SEO-optimised casino review in Markdown. Target exactly 3,500 words. Do not pad. Every sentence must add value. Complete all sections fully before stopping.

CRITICAL ACCURACY RULES — NON-NEGOTIABLE:
1. ONLY use facts, figures, and details from the casino's own website content provided. Nothing else.
2. Do NOT invent figures, game counts, RTP percentages, or bonus amounts. If not in the source, say "not specified" or omit.
3. NEVER reference, mention, or link to any competing casino, betting site, review site, or third-party source. The only site referenced in the review is the casino being reviewed.
4. NEVER include bonus codes, promo codes, or promotional offers sourced from anywhere other than the casino's own website content provided.
5. NEVER mention goal.com, onlinemobileslots.com, or any other external site anywhere in the review.
6. If a fact cannot be confirmed from the casino's own website content, do not include it.

WRITING RULES:
1. Use H2 headings phrased as questions matching user search intent (e.g. "What Welcome Bonus Does Easybet Offer?"). H3s are clean navigational labels.
2. Open with: <!-- SEO META: Focus Keyphrase | Meta Description max 155 chars | Suggested Slug -->
3. All currency in ZAR (R). All odds in decimal format.
4. Humanised, authoritative tone for South African bettors — no puffery, no rule-of-three lists, no em dashes.
5. End with a responsible gambling section.

REQUIRED SECTIONS — complete every section, do not cut off mid-review:

# [Casino] Review South Africa 2026
## Quick Verdict
## What Welcome Bonus Does [Casino] Offer South African Players?
## How Does [Casino] Sports Betting Work?
## What Casino Games Are Available on [Casino]?
## How Do You Deposit and Withdraw at [Casino]?
## How Do You Register an Account at [Casino]?
## What Is [Casino] Mobile Experience Like?
## Does [Casino] Have a VIP or Loyalty Programme?
## How Does [Casino] Stack Up for South African Players?
## Is [Casino] Safe and Legal in South Africa?
## How Good Is [Casino] Customer Support?
## Pros and Cons
## Final Verdict
## Frequently Asked Questions
## Responsible Gambling

SEO: 1.5-2% keyword density, LSI keywords throughout, internal links as [INTERNAL LINK: topic], YAML front matter at top.`;

const SA_KEYWORDS = [
  "best online casino South Africa",
  "SA sports betting",
  "casino bonuses South Africa",
  "online betting ZAR",
  "mobile casino South Africa",
  "FICA verified casino SA",
  "South African betting sites",
  "casino deposit methods South Africa",
  "sports betting South Africa 2026",
  "online gambling South Africa legal",
  "PSL betting",
  "Springboks betting odds",
];

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReviewBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return `[Could not fetch ${url} - status ${res.status}]`;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 12000);
  } catch (err) {
    return `[Could not fetch ${url} - ${err.message}]`;
  }
}

export async function POST(req) {
  try {
    const { casino } = await req.json();
    if (!casino?.name || !casino?.domain) {
      return Response.json({ error: "Missing casino name or domain" }, { status: 400 });
    }

    const casinoUrl = `https://${casino.domain}`;
    const casinoContent = await fetchPageContent(casinoUrl);

    const userPrompt = `Write a 3,500-word SEO casino review for ${casino.name} targeting South African bettors in 2026.

IMPORTANT: Base the ENTIRE review ONLY on the casino website content provided below. Do not use any external knowledge, invented figures, or information from any other source. If something is not in the content below, do not include it.

SA SEO KEYWORDS TO WEAVE IN NATURALLY:
${SA_KEYWORDS.map((k) => `- ${k}`).join("\n")}

CRITICAL REMINDERS:
- Exactly 3,500 words. Complete ALL sections. Do not stop early.
- Only use facts confirmed in the source content below.
- Never mention or reference any competing site, review site, or third-party platform.
- Never include bonus or promo codes not explicitly stated on the casino's own site.
- Minimum 6 FAQ questions based only on sourced facts.

--- CASINO WEBSITE CONTENT (${casinoUrl}) ---

${casinoContent}

--- END OF SOURCE CONTENT ---`;

    const stream = client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta?.type === "text_delta"
            ) {
              const chunk = JSON.stringify({ type: "chunk", text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        } catch (err) {
          const errMsg = JSON.stringify({ type: "error", message: err.message });
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
