export const maxDuration = 300;

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an elite SEO content strategist and casino review expert for the South African online gambling market. You write for Novus Media.

Write a COMPREHENSIVE 3,500–4,000-word SEO-optimised casino review in Markdown. Short reviews under 3,000 words are unacceptable — Google rewards depth for review-intent queries and your competitors are publishing 3,500–4,000 word pieces.

WRITING RULES:
1. The casino's OWN WEBSITE is the PRIMARY SOURCE OF TRUTH — search it first for current promotions, bonuses, deposit methods, licensing, T&Cs, odds, game library.
2. Secondary sources (onlinemobileslots.com, goal.com/en-za/betting) provide supplementary review context only.
3. Weave in South African sports betting SEO keywords naturally throughout — never keyword-stuff.
4. Use H2 headings phrased as questions that match user search intent (e.g. "What Welcome Bonus Does Easybet Offer?" not "Welcome Bonus"). H3s are clean navigational labels.
5. Open with: <!-- SEO META: Focus Keyphrase | Meta Description max 155 chars | Suggested Slug -->
6. All currency in ZAR (R). All odds in decimal format.
7. Humanised, authoritative tone for South African bettors — no puffery, no rule-of-three lists, no em dashes.
8. No references to any specific review site or domain in the output.
9. End with a responsible gambling section.

REQUIRED SECTIONS — each must be substantive (200–400 words minimum for major sections):

<!-- SEO META block -->

# [Casino] Review South Africa 2026 – Is It Worth Your Rands?
(Opening paragraph: quick verdict, who it suits, overall star rating /5)

## Quick Verdict
(3–4 sentence summary. Star rating. Who should sign up, who shouldn't.)

## What Welcome Bonus Does [Casino] Offer South African Players?
- Exact bonus amount, match %, minimum deposit in ZAR
- WAGERING REQUIREMENTS: spell out the multiplier, give a worked rand example (e.g. "Deposit R500, get R500 bonus = R1,000 to wager 30x = R30,000 turnover required")
- Eligible games and contribution %s (slots vs table games vs sports)
- Bonus expiry date
- Max bet per spin/round while bonus is active
- Any other current promos (reload, cashback, free spins, refer-a-friend)

## How Does [Casino]'s Sports Betting Compare to Rivals?
- Sports and leagues covered (focus on PSL, Premiership, cricket, rugby)
- Number of markets per PSL match (e.g. 50+ or 200+ markets?)
- Odds comparison: give 3–4 example odds vs Betway and Hollywoodbets on same market
- Live/in-play betting availability and quality
- Cash-out feature — is it available, partial cash-out?
- Bet builder / same-game multi feature?
- Streaming availability

## What Casino Games Are Available on [Casino]?
- Total game count and main categories
- Key software providers (Pragmatic Play, Evolution, NetEnt, etc.)
- RTP figures on 3–5 popular slots (e.g. Gates of Olympus 96.5%, Book of Dead 96.21%)
- Progressive jackpot slots — current/typical jackpot sizes if available
- Live casino: tables, game shows, baccarat, blackjack variants
- Game search, filter, and navigation experience — is it easy to find games?
- Any exclusive titles?

## How Do You Deposit and Withdraw at [Casino]?
Cover each method individually:
- Instant EFT / Ozow: step-by-step process, limits, fees
- Credit/debit card: limits, processing time
- Bank transfer: which banks, how long
- Crypto (if available): which coins, process
- Any e-wallets (PayFlex, etc.)
For each: minimum deposit, minimum withdrawal, processing time, any fees.
Overall: how fast are withdrawals really? FICA verification process explained.

## How Do You Register an Account at [Casino]?
Step-by-step sign-up walkthrough:
1. Step one (click register / create account)
2. Personal details required (name, ID number, DOB)
3. FICA document upload — what's needed (ID, proof of address)
4. Age verification
5. Responsible gambling limits setup during registration
6. First login and lobby experience
Estimated time from registration to first bet.

## What Is [Casino]'s Mobile Experience Like?
- Dedicated iOS app and/or Android app? Or mobile web only?
- App store rating (check Apple App Store / Google Play — include rating if available)
- Key features available on mobile vs desktop
- Page load speed, any known issues or complaints
- Screenshot walkthrough description (lobby, bet slip, casino lobby)
- Data usage / lite mode if available

## Does [Casino] Have a VIP or Loyalty Programme?
- Does a loyalty/VIP programme exist?
- How do you qualify? Points system?
- Tiers and benefits at each level
- Cashback, faster withdrawals, dedicated manager?
- If no programme exists, note this clearly and compare to competitors who do

## How Does [Casino] Compare to Betway and Hollywoodbets?
Comparison table + narrative covering:
| Feature | [Casino] | Betway SA | Hollywoodbets |
| Welcome Bonus | | | |
| Sports Markets | | | |
| Casino Games | | | |
| Mobile App | | | |
| Withdrawal Speed | | | |
| Loyalty Programme | | | |
Narrative: who wins each category and overall recommendation.

## Is [Casino] Safe and Legal in South Africa?
- Licensing body (Western Cape Gambling Board, etc.) and licence number
- Responsible gambling tools (deposit limits, session limits, self-exclusion)
- SSL encryption and data protection
- Affiliation with RGSB or similar

## How Good Is [Casino]'s Customer Support?
- Channels: live chat, email, phone, WhatsApp?
- Hours of operation (24/7 or limited?)
- Response time experience
- Languages supported (Zulu, Afrikaans, etc.?)
- Quality of FAQ/help centre

## Pros and Cons
(Use a proper markdown table, not bullet lists)

## Final Verdict — Should South African Players Sign Up?
(200+ word conclusion. Summarise the key reasons to join or avoid. Final rating /5 with brief justification per category: Sports Betting, Casino, Bonuses, Mobile, Banking, Support.)

## Frequently Asked Questions
(Minimum 6 questions. Format: **Q: Question?** followed by a direct answer paragraph. Questions should match real search queries SA players type.)

## Responsible Gambling
(Standard responsible gambling section. Include RGSB, NCPGambling, Gamblers Anonymous SA contact details.)

SEO REQUIREMENTS:
- 1.5–2% primary keyword density (e.g. "[Casino] review South Africa")
- LSI keywords throughout: "online casino ZAR", "SA betting sites", "FICA casino", "Springboks betting", "PSL betting"
- Internal links marked as [INTERNAL LINK: suggested topic]
- Front matter block at top (YAML):
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

export async function POST(req) {
  try {
    const { casino, sources } = await req.json();
    if (!casino?.name || !casino?.domain) {
      return Response.json({ error: "Missing casino name or domain" }, { status: 400 });
    }

    const sourcesText = (sources || [])
      .map((s, i) => `${i + 2}. [SECONDARY] ${s.url} — search for ${casino.name} review content`)
      .join("\n");

    const userPrompt = `Research and write a 3,500–4,000-word SEO casino review for ${casino.name} (${casino.domain}) targeting South African bettors in 2026.

SOURCES — search in this priority order:
1. [PRIMARY] https://${casino.domain} — scrape current bonuses, deposit methods, game library, odds, T&Cs, licence info
${sourcesText}

SA SEO KEYWORDS TO WEAVE IN NATURALLY:
${SA_KEYWORDS.map((k) => `- ${k}`).join("\n")}

CRITICAL REMINDERS:
- Target word count: 3,500–4,000 words. Do NOT stop early.
- Every required section must be present and substantive.
- Bonus wagering section MUST include a worked ZAR example.
- Sports betting section MUST include odds comparison vs Betway and Hollywoodbets.
- Banking section MUST cover each payment method individually with limits and processing times.
- Include the step-by-step registration walkthrough.
- Include VIP/loyalty programme section (even if to say none exists).
- Include the competitor comparison table.
- Minimum 6 FAQ questions targeting real SA search queries.`;

    const stream = client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 8000,
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
