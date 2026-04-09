export const maxDuration = 300;

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an elite SEO content strategist and casino review expert for the South African online gambling market. You write for Novus Media.

Write a CONCISE but comprehensive 3,500-word SEO-optimised casino review in Markdown. Target exactly 3,500 words. Do not pad. Every sentence must add value. Complete all sections fully before stopping.

CRITICAL: You must ONLY use the information provided to you in the source content below. Do not invent figures, do not use prior knowledge, do not guess. If a specific piece of information is not in the provided source content, say "not specified" or omit that detail. Accuracy is more important than completeness.

WRITING RULES:
1. ONLY use facts, figures, and details from the source content provided. Nothing else.
2. The casino's OWN WEBSITE content is the PRIMARY SOURCE OF TRUTH — prioritise it for bonuses, deposit methods, game counts, licensing, T&Cs.
3. Secondary sources provide supplementary review context only.
4. Use H2 headings phrased as questions that match user search intent (e.g. "What Welcome Bonus Does Easybet Offer?" not "Welcome Bonus"). H3s are clean navigational labels.
5. Open with: <!-- SEO META: Focus Keyphrase | Meta Description max 155 chars | Suggested Slug -->
6. All currency in ZAR (R). All odds in decimal format.
7. Humanised, authoritative tone for South African bettors — no puffery, no rule-of-three lists, no em dashes.
8. No references to any specific review site or domain in the output.
9. End with a responsible gambling section.

REQUIRED SECTIONS — complete every section, no cutting off mid-review:

<!-- SEO META block -->

# [Casino] Review South Africa 2026 – Is It Worth Your Rands?
(Opening paragraph: quick verdict, who it suits, overall star rating /5)

## Quick Verdict
(3–4 sentence summary. Star rating. Who should sign up, who shouldn't.)

## What Welcome Bonus Does [Casino] Offer South African Players?
- Exact bonus amount, match %, minimum deposit in ZAR (from source only)
- WAGERING REQUIREMENTS: spell out the multiplier, give a worked rand example
- Eligible games and contribution %s
- Bonus expiry date
- Max bet per spin/round while bonus is active
- Any other current promos

## How Does [Casino]'s Sports Betting Compare to Rivals?
- Sports and leagues covered (focus on PSL, Premiership, cricket, rugby)
- Markets depth per match (from source only)
- Live/in-play betting availability
- Cash-out feature
- Bet builder feature
- Streaming availability

## What Casino Games Are Available on [Casino]?
- Total game count and categories (from source only — do not guess)
- Key software providers
- Popular slots mentioned in sources with RTP if available
- Live casino offering
- Game navigation experience

## How Do You Deposit and Withdraw at [Casino]?
Cover each method listed on the casino site:
- Method name, minimum deposit, minimum withdrawal, processing time, fees
- FICA verification process

## How Do You Register an Account at [Casino]?
Step-by-step sign-up walkthrough based on source content.

## What Is [Casino]'s Mobile Experience Like?
- App availability (iOS/Android) or mobile web
- App store rating if mentioned in sources
- Key mobile features

## Does [Casino] Have a VIP or Loyalty Programme?
- Details from source only. If not mentioned, state clearly it could not be confirmed.

## How Does [Casino] Compare to Betway and Hollywoodbets?
Comparison table + narrative. Only use facts confirmed in sources for [Casino] — use general knowledge only for Betway/Hollywoodbets columns.

## Is [Casino] Safe and Legal in South Africa?
- Licensing details from source only
- Responsible gambling tools

## How Good Is [Casino]'s Customer Support?
- Channels, hours, languages from source only

## Pros and Cons
(Markdown table)

## Final Verdict — Should South African Players Sign Up?
(Conclusion. Final rating /5.)

## Frequently Asked Questions
(Minimum 6 questions. Format: **Q: Question?** followed by answer. Based only on sourced facts.)

## Responsible Gambling
(Include RGSB, NCPGambling, Gamblers Anonymous SA contact details.)

SEO REQUIREMENTS:
- 1.5–2% primary keyword density
- LSI keywords: "online casino ZAR", "SA betting sites", "FICA casino", "Springboks betting", "PSL betting"
- Internal links marked as [INTERNAL LINK: suggested topic]
- YAML front matter at top:
---
title: "[Casino] Review South Africa 2026"
description: "..."
tags: [online casino, South Africa, sports betting, ZAR]
canonical: "/reviews/[slug]"
---`;

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
    if (!res.ok) return `[Could not fetch ${url} — status ${res.status}]`;
    const html = await res.text();
    // Strip HTML tags and collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Return first 8000 chars to stay within token limits
    return text.slice(0, 8000);
  } catch (err) {
    return `[Could not fetch ${url} — ${err.message}]`;
  }
}

export async function POST(req) {
  try {
    const { casino, sources } = await req.json();
    if (!casino?.name || !casino?.domain) {
      return Response.json({ error: "Missing casino name or domain" }, { status: 400 });
    }

    // Fetch all sources in parallel
    const casinoUrl = `https://${casino.domain}`;
    const sourceUrls = [casinoUrl, ...(sources || []).map(s => s.url)];

    const fetchedContents = await Promise.all(
      sourceUrls.map(async (url) => {
        const content = await fetchPageContent(url);
        return { url, content };
      })
    );

    // Build source content block for the prompt
    const sourceBlock = fetchedContents
      .map(({ url, content }, i) => {
        const label = i === 0 ? "PRIMARY SOURCE (casino's own website)" : `SECONDARY SOURCE ${i}`;
        return `=== ${label}: ${url} ===\n${content}\n`;
      })
      .join("\n");

    const userPrompt = `Write a 3,500-word SEO casino review for ${casino.name} targeting South African bettors in 2026.

IMPORTANT: Base the ENTIRE review ONLY on the source content provided below. Do not use any external knowledge or invented figures. If information is not in the sources, do not include it or mark it as "not confirmed".

SA SEO KEYWORDS TO WEAVE IN NATURALLY:
${SA_KEYWORDS.map((k) => `- ${k}`).join("\n")}

CRITICAL REMINDERS:
- Exactly 3,500 words. Complete ALL sections. Do not stop early.
- Every fact must come from the source content below.
- Bonus wagering section MUST include a worked ZAR example (if bonus details are in sources).
- Sports betting section MUST reference actual markets/sports found in sources.
- Banking section MUST list only payment methods confirmed in sources.
- Minimum 6 FAQ questions.

--- SOURCE CONTENT START ---

${sourceBlock}

--- SOURCE CONTENT END ---`;

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
