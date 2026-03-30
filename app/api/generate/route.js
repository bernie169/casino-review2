import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an elite SEO content strategist and casino review expert for the South African online gambling market.

Write a comprehensive ~3000-word SEO-optimised casino review in Markdown.

RULES:
1. The casino's OWN WEBSITE is the PRIMARY SOURCE OF TRUTH — search it first for current promotions, bonuses, deposits, licensing, T&Cs.
2. Secondary sources provide supplementary review context only.
3. Weave in South African sports betting keywords naturally.
4. Use H1 > H2 > H3 hierarchy throughout.
5. Open with an HTML comment block: <!-- SEO META: Focus Keyphrase | Meta Description (max 155 chars) | Suggested Slug -->
6. All currency in ZAR (R).
7. Authoritative, trustworthy tone aimed at South African bettors.
8. End with a responsible gambling section.

REQUIRED SECTIONS:
<!-- SEO META block -->
# [Casino] Review South Africa [Year] – Is It Worth Your Rands?
## Quick Verdict
## Why South African Players Choose [Casino]
## Welcome Bonus & Promotions
## Sports Betting Markets
## Casino Games & Providers
## Banking: Deposits & Withdrawals in ZAR
## Mobile Experience
## Licensing & Safety
## Customer Support
## Pros & Cons
## Final Rating
## Frequently Asked Questions
## Responsible Gambling

SEO: 1.5-2% primary keyword density, LSI keywords throughout, power words in headings, FAQ as **Q:** / A: format, mark internal links as [INTERNAL LINK: topic].`;

const SA_KEYWORDS = [
  "best online casino South Africa", "SA sports betting", "casino bonuses South Africa",
  "online betting ZAR", "mobile casino South Africa", "FICA verified casino SA",
  "South African betting sites", "casino deposit methods South Africa",
  "sports betting South Africa 2025", "online gambling South Africa legal",
];

export async function POST(req) {
  try {
    const { casino, sources } = await req.json();

    if (!casino?.name || !casino?.domain) {
      return Response.json({ error: "Missing casino name or domain" }, { status: 400 });
    }

    const sourcesText = sources
      .map((s, i) => `${i + 2}. [SECONDARY] ${s.url} — find ${casino.name} review content`)
      .join("\n");

    const userPrompt = `Research and write a ~3000-word SEO casino review for ${casino.name} targeting South African bettors.

SOURCES TO SEARCH (in order of priority):
1. [PRIMARY – SOURCE OF TRUTH] https://www.${casino.domain} — current bonuses, promotions, payment methods, licensing
${sourcesText}

SA KEYWORDS TO INTEGRATE:
${SA_KEYWORDS.map(k => `• ${k}`).join("\n")}

Casino: ${casino.name} | Site: https://www.${casino.domain} | Currency: ZAR | Year: ${new Date().getFullYear()}

Search the sources above, then write the complete Markdown review.`;

    // Stream the response so the browser shows progress as text arrives
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (data) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          const messages = [{ role: "user", content: userPrompt }];
          let turn = 0;

          while (turn < 8) {
            turn++;
            send({ type: "status", text: `API call ${turn} — researching sources…` });

            const response = await client.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 8000,
              system: SYSTEM_PROMPT,
              tools: [{ type: "web_search_20250305", name: "web_search" }],
              messages,
            });

            // Log searches
            response.content.forEach((block) => {
              if (block.type === "tool_use") {
                send({ type: "search", text: `Searching: "${block.input?.query}"` });
              }
            });

            // Collect text
            const textBlocks = response.content
              .filter((b) => b.type === "text")
              .map((b) => b.text)
              .join("\n");

            if (response.stop_reason === "end_turn") {
              send({ type: "done", text: textBlocks });
              break;
            }

            if (response.stop_reason === "tool_use") {
              messages.push({ role: "assistant", content: response.content });
              const toolResults = response.content
                .filter((b) => b.type === "tool_use")
                .map((b) => ({
                  type: "tool_result",
                  tool_use_id: b.id,
                  content: "Search completed.",
                }));
              messages.push({ role: "user", content: toolResults });
              send({ type: "status", text: `Processing search results…` });
              continue;
            }

            // Any other stop reason
            send({ type: "done", text: textBlocks || "No content generated." });
            break;
          }
        } catch (err) {
          send({ type: "error", text: err.message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
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
