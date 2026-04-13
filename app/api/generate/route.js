export const maxDuration = 300;

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an elite SEO content strategist and casino review expert for the South African online gambling market. You write for Novus Media, publishing on Kickoff.com.

Your job is two phases:

PHASE 1 — RESEARCH: Use web search to gather comprehensive, current, accurate information about the casino. Search for:
- The casino's official SA site for current bonuses, promotions, T&Cs, payment methods, game counts
- "[Casino name] review South Africa" for player experience insights
- "[Casino name] slots games South Africa" for game library details
- "[Casino name] sports betting South Africa" for betting markets, odds, features
- "[Casino name] mobile app South Africa" for mobile experience
- "[Casino name] withdrawal South Africa" for banking details
- "[Casino name] licence South Africa" for licensing and safety info
- "[Casino name] VIP loyalty South Africa" for loyalty programme details
Search as many times as needed to build a complete picture. Prioritise the casino's own official pages.

PHASE 2 — WRITE: Using everything you've researched, write a factual, informative, reader-first 3,500-word review. 

WRITING RULES:
1. Be specific and informative — use actual numbers, actual game titles, actual bonus amounts, actual payment methods found in your research. Never be vague.
2. NEVER mention or reference any review site, competitor site, or third party in the output. Present all facts as verified information about the casino.
3. NEVER name specific competing casinos in the review.
4. Only include bonus codes if found on the casino's own official website.
5. Use H2 headings phrased as questions matching user search intent. H3s are clean navigational labels.
6. All currency in ZAR (R). All odds in decimal format.
7. Humanised, authoritative tone — no puffery, no rule-of-three lists, no em dashes.
8. Never tell the reader to "visit the site to confirm" or "check the website for details" — if you don't know something, omit it.
9. Complete all sections fully. Do not stop early.

REQUIRED SECTIONS:
<!-- SEO META: Focus Keyphrase | Meta Description max 155 chars | Suggested Slug -->
---
title: "[Casino] Review South Africa 2026"
description: "..."
tags: [online casino, South Africa, sports betting, ZAR]
canonical: "/reviews/[slug]"
---

# [Casino] Review South Africa 2026 – Is It Worth Your Rands?
## Quick Verdict
## What Welcome Bonus Does [Casino] Offer South African Players?
## How Does [Casino]'s Sports Betting Work?
## What Casino Games Can You Play at [Casino]?
## How Do You Deposit and Withdraw at [Casino]?
## How Do You Register at [Casino]?
## What Is the [Casino] Mobile Experience Like?
## Does [Casino] Have a VIP or Loyalty Programme?
## How Does [Casino] Stack Up for SA Players?
## Is [Casino] Safe and Legal in South Africa?
## How Good Is [Casino]'s Customer Support?
## Pros and Cons
## Final Verdict
## Frequently Asked Questions
## Responsible Gambling

SEO: 1.5-2% primary keyword density, LSI keywords throughout, internal links as [INTERNAL LINK: topic].`;

export async function POST(req) {
  try {
    const { casino } = await req.json();
    if (!casino?.name || !casino?.domain) {
      return Response.json({ error: "Missing casino name or domain" }, { status: 400 });
    }

    const userPrompt = `Research and write a comprehensive 3,500-word SEO casino review for ${casino.name} (${casino.domain}) targeting South African bettors in 2026.

Start by searching for current, accurate information about ${casino.name} across multiple searches. Cover:
- Current welcome bonus and all promotions (exact amounts, wagering requirements, T&Cs)
- Full sports betting offering (sports covered, PSL markets, live betting, cash-out, bet builder)
- Casino game library (total count, providers, popular slots with RTPs, live casino)
- All payment methods (each one individually with limits, fees, processing times)
- Mobile app or mobile web experience (app store ratings if available)
- VIP and loyalty programme details
- Licensing, safety, responsible gambling tools
- Customer support channels and hours
- Step-by-step registration process

Then write the full 3,500-word review using what you find. Be specific — use real numbers, real game names, real bonus amounts. Never vague. Never tell the reader to check the site themselves.

CRITICAL:
- Exactly 3,500 words
- Complete ALL required sections
- Never reference any review site or competing casino by name in the output
- Never include promo codes not found on ${casino.domain} itself
- South African bettors are your audience — PSL, Springboks, Proteas, ZAR always`;

    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
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
