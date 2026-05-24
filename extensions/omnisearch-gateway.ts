/**
 * OmniSearchGateway v3 — Unified, cost-aware search middleware
 *
 * Routes web search/discovery/extraction/research across Serper, Exa,
 * Firecrawl, and Tavily based on intent with silent cascading failover.
 *
 * Routing Matrix:
 *   fact       → Serper /search  → Exa /answer        → Tavily /search
 *   discovery  → Exa /search     → Tavily /search      → Serper /search
 *   extraction → Firecrawl v2    → Tavily /extract
 *   synthesis  → Exa /answer     → Tavily /search
 *
 * API keys from environment:
 *   SERPER_API_KEY, EXA_API_KEY, FIRECRAWL_API_KEY, TAVILY_API_KEY
 *
 * Auth: Serper uses X-API-KEY header, Exa uses x-api-key,
 *        Firecrawl uses Bearer, Tavily uses Bearer.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderConfig {
  id: string;
  label: string;
  url: string;
  envKey: string;
  buildHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (query: string, apiKey: string) => object;
  normalize: (data: any) => NormalizedResult;
}

interface ResearchProviderConfig extends ProviderConfig {
  /** Whether this provider requires async polling (true for research) */
  isAsync: true;
  /** Polling interval in ms */
  pollIntervalMs: number;
  /** Max total time to wait before timing out */
  maxWaitMs: number;
  /** POST to create the research task — returns an id string */
  createTask: (
    query: string,
    apiKey: string,
    signal: AbortSignal,
  ) => Promise<string>;
  /** GET to check research status — throws if task failed */
  getTaskResult: (
    taskId: string,
    apiKey: string,
    signal: AbortSignal,
  ) => Promise<any>;
}

type AnyProvider = ProviderConfig | ResearchProviderConfig;

function isResearchProvider(p: AnyProvider): p is ResearchProviderConfig {
  return "isAsync" in p && p.isAsync === true;
}

interface NormalizedResult {
  source: string;
  content: string;
  references: string[];
  /** Cost in USD — only present for providers that report it (Exa). */
  costDollars?: {
    total: number;
    [key: string]: any;
  };
}

interface OmniSearchDetails extends NormalizedResult {
  intent: string;
  query: string;
  routedTo: string;
}

interface ExaSearchResult {
  title?: string;
  url?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

interface ExaCitation {
  id?: string;
  url?: string;
  title?: string;
  text?: string;
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeSerper(data: any): NormalizedResult {
  const organic = Array.isArray(data.organic) ? data.organic : [];
  const content = organic
    .map(
      (r: any, i: number) =>
        `${i + 1}. **${r.title ?? "Untitled"}**\n   ${r.snippet ?? ""}\n   ${r.link ?? ""}`,
    )
    .join("\n\n");
  const references = organic.map((r: any) => r.link ?? "").filter(Boolean);
  return { source: "serper", content: content || "(no results)", references };
}

function normalizeExaSearch(data: any): NormalizedResult {
  const results: ExaSearchResult[] = Array.isArray(data.results)
    ? data.results
    : [];
  const parts = results.map((r, i) => {
    let block = `${i + 1}. **${r.title ?? "Untitled"}**\n`;
    if (r.summary) block += `   *${r.summary}*\n`;
    if (r.text) block += `   ${r.text.slice(0, 600)}\n`;
    if (r.highlights?.length) {
      const h = r.highlights.join(" | ");
      block += `   > ${h.slice(0, 400)}\n`;
    }
    block += `   ${r.url ?? ""}`;
    return block;
  });
  const content = parts.join("\n\n");
  const references = results.map((r) => r.url ?? "").filter(Boolean);
  const costDollars = data.costDollars?.total != null ? data.costDollars : undefined;
  return {
    source: "exa",
    content: content || "(no results)",
    references,
    costDollars,
  };
}

function normalizeExaAnswer(data: any): NormalizedResult {
  const answer = typeof data.answer === "string" ? data.answer : "";
  const citations: ExaCitation[] = Array.isArray(data.citations)
    ? data.citations
    : [];
  let content = `**Answer:** ${answer}`;
  if (citations.length) {
    content += "\n\n**Sources:**\n" + citations
      .map((c, i) => `${i + 1}. [${c.title ?? c.url ?? "Source"}](${c.url ?? ""})`)
      .join("\n");
  }
  const references = citations.map((c) => c.url ?? "").filter(Boolean);
  const costDollars = data.costDollars?.total != null ? data.costDollars : undefined;
  return { source: "exa", content, references, costDollars };
}

function normalizeFirecrawl(data: any): NormalizedResult {
  // v2 response: markdown at top level. v1 fallback: nested under data.
  const markdown: string =
    data?.markdown ?? data?.data?.markdown ?? "";
  const sourceUrl: string =
    data?.url ??
    data?.metadata?.sourceURL ??
    data?.data?.metadata?.sourceURL ??
    "";
  return {
    source: "firecrawl",
    content: markdown || "(no content extracted)",
    references: sourceUrl ? [sourceUrl] : [],
  };
}

function normalizeTavilySearch(data: any): NormalizedResult {
  const results = Array.isArray(data.results) ? data.results : [];
  const answer = typeof data.answer === "string" ? data.answer : "";
  let content = "";
  if (answer) content += `**Answer:** ${answer}\n\n---\n\n`;
  content += results
    .map(
      (r: any, i: number) =>
        `${i + 1}. **${r.title ?? "Untitled"}**\n   ${(r.content ?? "").slice(0, 600)}\n   ${r.url ?? ""}`,
    )
    .join("\n\n");
  const references = results.map((r: any) => r.url ?? "").filter(Boolean);
  return { source: "tavily", content: content || "(no results)", references };
}

function normalizeTavilyExtract(data: any): NormalizedResult {
  const results = Array.isArray(data.results) ? data.results : [];
  const content = results
    .map(
      (r: any, i: number) =>
        `${i + 1}. **${r.url ?? "URL"}**\n   ${(r.raw_content ?? "").slice(0, 800)}`,
    )
    .join("\n\n");
  const references = results.map((r: any) => r.url ?? "").filter(Boolean);
  return {
    source: "tavily",
    content: content || "(no content extracted)",
    references,
  };
}

function normalizeTavilyResearch(data: any): NormalizedResult {
  const content = typeof data.content === "string" ? data.content : "";
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const references: string[] = sources
    .map((s: any) => s.url ?? "")
    .filter(Boolean);
  return {
    source: "tavily",
    content: content || "(no research result)",
    references,
  };
}

function normalizeExaResearch(data: any): NormalizedResult {
  const output = data.output ?? data;
  const content: string =
    typeof output.content === "string"
      ? output.content
      : typeof output.parsed === "object" && output.parsed
        ? JSON.stringify(output.parsed, null, 2)
        : "";
  // Sources are embedded in the research output text, not always separate
  const references: string[] = [];
  const costDollars = data.costDollars?.total != null ? data.costDollars : undefined;
  return {
    source: "exa",
    content: content || "(no research result)",
    references,
    costDollars,
  };
}

// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------

const SERPER: ProviderConfig = {
  id: "serper_search",
  label: "serper",
  url: "https://google.serper.dev/search",
  envKey: "SERPER_API_KEY",
  buildHeaders: (apiKey) => ({
    "X-API-KEY": apiKey,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({ q: query, num: 10 }),
  normalize: normalizeSerper,
};

const TAVILY_SEARCH: ProviderConfig = {
  id: "tavily_search",
  label: "tavily",
  url: "https://api.tavily.com/search",
  envKey: "TAVILY_API_KEY",
  buildHeaders: (apiKey) => ({
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({
    query,
    search_depth: "basic",
    include_answer: true,
    max_results: 10,
  }),
  normalize: normalizeTavilySearch,
};

const TAVILY_SEARCH_ADVANCED: ProviderConfig = {
  id: "tavily_search_advanced",
  label: "tavily",
  url: "https://api.tavily.com/search",
  envKey: "TAVILY_API_KEY",
  buildHeaders: (apiKey) => ({
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({
    query,
    search_depth: "advanced",
    include_answer: true,
    max_results: 10,
  }),
  normalize: normalizeTavilySearch,
};

const TAVILY_EXTRACT: ProviderConfig = {
  id: "tavily_extract",
  label: "tavily",
  url: "https://api.tavily.com/extract",
  envKey: "TAVILY_API_KEY",
  buildHeaders: (apiKey) => ({
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({
    urls: [query],
    format: "markdown",
  }),
  normalize: normalizeTavilyExtract,
};

const EXA_SEARCH: ProviderConfig = {
  id: "exa_search",
  label: "exa",
  url: "https://api.exa.ai/search",
  envKey: "EXA_API_KEY",
  buildHeaders: (apiKey) => ({
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({
    query,
    type: "auto",
    numResults: 10,
    contents: { text: true, highlights: true },
  }),
  normalize: normalizeExaSearch,
};

const EXA_ANSWER: ProviderConfig = {
  id: "exa_answer",
  label: "exa",
  url: "https://api.exa.ai/answer",
  envKey: "EXA_API_KEY",
  buildHeaders: (apiKey) => ({
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({ query, text: true }),
  normalize: normalizeExaAnswer,
};

const FIRECRAWL: ProviderConfig = {
  id: "firecrawl_v2",
  label: "firecrawl",
  url: "https://api.firecrawl.dev/v2/scrape",
  envKey: "FIRECRAWL_API_KEY",
  buildHeaders: (apiKey) => ({
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({ url: query, formats: ["markdown"] }),
  normalize: normalizeFirecrawl,
};

const EXA_RESEARCH: ResearchProviderConfig = {
  id: "exa_research",
  label: "exa",
  url: "https://api.exa.ai/research/v1",
  envKey: "EXA_API_KEY",
  buildHeaders: (apiKey) => ({
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({ instructions: query, model: "exa-research" }),
  normalize: normalizeExaResearch,
  isAsync: true,
  pollIntervalMs: 2000,
  maxWaitMs: 60_000,

  async createTask(query, apiKey, signal) {
    const headers = this.buildHeaders(apiKey);
    headers["Content-Type"] = "application/json";
    const res = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(this.buildBody(query, apiKey)),
      signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "(could not read body)");
      throw new Error(`Exa research returned HTTP ${res.status}: ${body.slice(0, 500)}`);
    }
    const json = await res.json();
    return json.researchId as string;
  },

  async getTaskResult(taskId, apiKey, signal) {
    const res = await fetch(`https://api.exa.ai/research/v1/${taskId}`, {
      headers: { "x-api-key": apiKey },
      signal,
    });
    if (!res.ok) {
      throw new Error(`Exa research GET returned HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json.status === "failed") {
      throw new Error(`Exa research failed: ${json.error ?? "unknown error"}`);
    }
    if (json.status === "canceled") {
      throw new Error("Exa research was canceled");
    }
    // Still running — signal caller to keep polling
    if (json.status === "pending" || json.status === "running") {
      return null;
    }
    return json;
  },
};

const TAVILY_RESEARCH: ResearchProviderConfig = {
  id: "tavily_research",
  label: "tavily",
  url: "https://api.tavily.com/research",
  envKey: "TAVILY_API_KEY",
  buildHeaders: (apiKey) => ({
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }),
  buildBody: (query) => ({ input: query, model: "auto" }),
  normalize: normalizeTavilyResearch,
  isAsync: true,
  pollIntervalMs: 2000,
  maxWaitMs: 60_000,

  async createTask(query, apiKey, signal) {
    const headers = this.buildHeaders(apiKey);
    headers["Content-Type"] = "application/json";
    const res = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(this.buildBody(query, apiKey)),
      signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "(could not read body)");
      throw new Error(`Tavily research returned HTTP ${res.status}: ${body.slice(0, 500)}`);
    }
    const json = await res.json();
    return json.request_id as string;
  },

  async getTaskResult(taskId, apiKey, signal) {
    const res = await fetch(`https://api.tavily.com/research/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });
    const json = await res.json();
    if (res.status === 202) {
      // Still pending — caller will retry
      return null;
    }
    if (!res.ok) {
      throw new Error(`Tavily research GET returned HTTP ${res.status}`);
    }
    if (json.status === "failed") {
      const msg = json.error ?? "unknown error";
      throw new Error(`Tavily research failed: ${msg}`);
    }
    return json;
  },
};

// ---------------------------------------------------------------------------
// Intent → ordered provider list
// ---------------------------------------------------------------------------

type Intent = "fact" | "discovery" | "extraction" | "synthesis";

const INTENT_ROUTING: Record<Intent, AnyProvider[]> = {
  fact:       [SERPER,          EXA_ANSWER,          TAVILY_SEARCH],
  discovery:  [EXA_SEARCH,      TAVILY_SEARCH_ADVANCED, SERPER],
  extraction: [FIRECRAWL,       TAVILY_EXTRACT],
  synthesis:  [EXA_ANSWER,      TAVILY_SEARCH_ADVANCED],
};

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 15_000;

function mergedSignal(
  agentSignal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (agentSignal && !agentSignal.aborted) {
    return AbortSignal.any([agentSignal, timeoutSignal]);
  }
  return timeoutSignal;
}

async function callProvider(
  provider: ProviderConfig,
  query: string,
  apiKey: string,
  agentSignal: AbortSignal | undefined,
): Promise<NormalizedResult> {
  const signal = mergedSignal(agentSignal, TIMEOUT_MS);
  const response = await fetch(provider.url, {
    method: "POST",
    headers: provider.buildHeaders(apiKey),
    body: JSON.stringify(provider.buildBody(query, apiKey)),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(could not read body)");
    throw new Error(
      `${provider.id} returned HTTP ${response.status}: ${body.slice(0, 500)}`,
    );
  }

  const json = await response.json();
  return provider.normalize(json);
}

async function callResearchProvider(
  provider: ResearchProviderConfig,
  query: string,
  apiKey: string,
  agentSignal: AbortSignal | undefined,
  onUpdate: ((update: any) => void) | undefined,
): Promise<NormalizedResult> {
  // Step 1: create the task
  const createSignal = mergedSignal(agentSignal, TIMEOUT_MS);
  const taskId = await provider.createTask(query, apiKey, createSignal);

  onUpdate?.({
    content: [
      {
        type: "text",
        text: `${provider.id}: task ${taskId} created, polling for results...`,
      },
    ],
  });

  // Step 2: poll until complete or timeout
  const deadline = Date.now() + provider.maxWaitMs;
  let result: any = null;

  while (Date.now() < deadline) {
    // Each poll gets the standard timeout (plus whatever's left of maxWaitMs)
    const remaining = Math.max(deadline - Date.now(), 1000);
    const pollSignal = mergedSignal(agentSignal, Math.min(remaining, TIMEOUT_MS));

    try {
      result = await provider.getTaskResult(taskId, apiKey, pollSignal);
    } catch (err) {
      // Treat polling errors as terminal for this provider
      throw err;
    }

    if (result !== null) {
      // Got a completed result
      onUpdate?.({
        content: [
          {
            type: "text",
            text: `${provider.id}: task ${taskId} completed, raw keys: ${JSON.stringify(Object.keys(result).slice(0, 10))}`,
          },
        ],
      });
      return provider.normalize(result);
    }

    // Still pending — wait and retry
    await new Promise((resolve) => setTimeout(resolve, provider.pollIntervalMs));
  }

  throw new Error(
    `${provider.id}: timed out after ${provider.maxWaitMs / 1000}s waiting for task ${taskId}`,
  );
}

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

export default function omniSearchGateway(pi: ExtensionAPI) {
  pi.registerTool({
    name: "omnisearch_gateway",
    label: "OmniSearch Gateway",
    description:
      "Unified web search, discovery, and extraction gateway. " +
      "Routes to the best provider based on intent: " +
      '"fact" (quick facts, definitions), ' +
      '"discovery" (broad research, finding resources), ' +
      '"extraction" (scrape a URL for content), ' +
      '"synthesis" (deep research with AI answer synthesis). ' +
      "Failover is automatic and silent.",
    promptSnippet:
      "Search the web, discover resources, extract page content, or synthesize research — all through one gateway",
    promptGuidelines: [
      "Use omnisearch_gateway with intent='fact' for quick factual lookups, definitions, and simple Q&A.",
      "Use omnisearch_gateway with intent='discovery' for broad research, finding articles, and exploring topics.",
      "Use omnisearch_gateway with intent='extraction' when you need to scrape and extract content from a specific URL — pass the URL as the query.",
      "Use omnisearch_gateway with intent='synthesis' for deep research questions where an AI-generated answer is preferred.",
    ],
    parameters: Type.Object({
      query: Type.String({
        description:
          "Search query, or URL for 'extraction' intent (pass the URL to scrape)",
      }),
      intent: StringEnum([
        "fact",
        "discovery",
        "extraction",
        "synthesis",
      ] as const),
    }),

    renderCall(args, theme) {
      const intent = args.intent ?? "?";
      const query = typeof args.query === "string" ? args.query : "";
      const preview = query.length > 50 ? query.slice(0, 47) + "..." : query;
      const line =
        theme.fg("toolTitle", theme.bold("omnisearch ")) +
        theme.fg("muted", `${intent} `) +
        theme.fg("dim", `"${preview}"`);
      return new Text(line, 0, 0);
    },

    renderResult(result, { expanded }, theme) {
      const d = result.details as OmniSearchDetails | undefined;
      if (!d) {
        const text = result.content?.[0];
        return new Text(
          text?.type === "text" ? text.text.slice(0, 80) : "",
          0,
          0,
        );
      }
      const line =
        theme.fg("success", "✓ ") +
        theme.fg("dim", `${d.routedTo} · `) +
        theme.fg("muted", `${d.references.length} refs`);
      if (!expanded) return new Text(line, 0, 0);
      return new Text(line + "\n" + theme.fg("dim", d.content), 0, 0);
    },

    async execute(_toolCallId, params, signal, onUpdate, _ctx) {
      const { query, intent } = params as { query: string; intent: Intent };

      if (signal?.aborted) {
        throw new Error("OmniSearchGateway: aborted before execution");
      }

      onUpdate?.({
        content: [
          {
            type: "text",
            text: `OmniSearchGateway: routing "${intent}" intent...`,
          },
        ],
      });

      const routing = INTENT_ROUTING[intent];
      const errors: string[] = [];

      for (const provider of routing) {
        const apiKey = process.env[provider.envKey];

        if (!apiKey) {
          errors.push(`${provider.id}: API key not set (${provider.envKey})`);
          continue;
        }

        try {
          onUpdate?.({
            content: [
              {
                type: "text",
                text: `OmniSearchGateway: trying ${provider.id}...`,
              },
            ],
          });

          let normalized: NormalizedResult;
          if (isResearchProvider(provider)) {
            normalized = await callResearchProvider(
              provider,
              query,
              apiKey,
              signal,
              onUpdate,
            );
          } else {
            normalized = await callProvider(provider, query, apiKey, signal);
          }

          // Treat empty research results as a provider failure so we fall back
          if (!normalized.content || normalized.content === "(no research result)" || normalized.content === "(no results)") {
            throw new Error(`${provider.id}: returned empty content`);
          }

          const details: OmniSearchDetails = {
            ...normalized,
            intent,
            query,
            routedTo: provider.label,
          };

          return {
            content: [
              {
                type: "text",
                text: `[OmniSearchGateway · source: ${normalized.source} · intent: ${intent}]\n\n${normalized.content}`,
              },
            ],
            details,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${provider.id}: ${msg}`);
          continue;
        }
      }

      const errorSummary = errors.map((e) => `  - ${e}`).join("\n");
      throw new Error(
        `OmniSearchGateway: all providers exhausted for intent "${intent}".\nErrors:\n${errorSummary}`,
      );
    },
  });
}
