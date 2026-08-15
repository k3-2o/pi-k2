import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Optional per-turn telemetry for mode comparisons.
 *
 * Enable with PI_BENCH=1. Set PI_BENCH_LABEL to distinguish runs:
 *
 *   PI_BENCH=1 PI_BENCH_LABEL=repl pi --repl
 *   PI_BENCH=1 PI_BENCH_LABEL=standard pi
 *
 * Records are written outside the working tree so git resets cannot remove
 * them: ~/.pi/bench/<label>-<session>-<timestamp>.jsonl.
 */

const OUTPUT_DIR = join(homedir(), ".pi", "bench");
const ZERO_TOTALS = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 });

function modelName(model: any): string {
	return model ? `${model.provider}/${model.id}` : "unknown";
}

function safeLabel(value: string | undefined): string {
	return (value || "unlabeled").replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export default function (pi: ExtensionAPI) {
	if (!process.env.PI_BENCH) return;

	const label = safeLabel(process.env.PI_BENCH_LABEL);
	const turnStarts = new Map<number, number>();
	const totals = ZERO_TOTALS();
	let outputFile = "";
	let turnCount = 0;
	let costTotal = 0;

	function record(value: Record<string, unknown>) {
		if (!outputFile) return;
		try {
			appendFileSync(outputFile, `${JSON.stringify(value)}\n`, "utf8");
		} catch {
			// Telemetry must never interrupt the agent.
		}
	}

	pi.on("session_start", async (event: any, ctx: any) => {
		try {
			mkdirSync(OUTPUT_DIR, { recursive: true });
		} catch {
			return;
		}

		const sessionId = String(ctx?.sessionManager?.getSessionId?.() || "nosession").slice(0, 8);
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		outputFile = join(OUTPUT_DIR, `${label}-${sessionId}-${timestamp}.jsonl`);

		record({
			type: "session_start",
			ts: Date.now(),
			reason: event?.reason,
			label,
			model: modelName(ctx?.model),
			cwd: ctx?.cwd,
			file: outputFile,
		});
		ctx?.ui?.notify?.(`[bench] recording → ${outputFile}`, "info");
	});

	pi.on("model_select", async (event: any) => {
		record({
			type: "model_select",
			ts: Date.now(),
			label,
			model: modelName(event?.model),
			previousModel: event?.previousModel ? modelName(event.previousModel) : null,
			source: event?.source,
		});
	});

	pi.on("turn_start", async (event: any) => {
		turnStarts.set(event.turnIndex, Date.now());
	});

	pi.on("turn_end", async (event: any, ctx: any) => {
		const turnIndex = event.turnIndex;
		const startedAt = turnStarts.get(turnIndex) ?? Date.now();
		turnStarts.delete(turnIndex);
		const usage = event.message?.usage;
		const toolResults = Array.isArray(event.toolResults) ? event.toolResults : [];
		const toolErrors = toolResults.filter((result: any) => result?.isError).length;

		if (usage) {
			totals.input += usage.input || 0;
			totals.output += usage.output || 0;
			totals.cacheRead += usage.cacheRead || 0;
			totals.cacheWrite += usage.cacheWrite || 0;
			totals.totalTokens += usage.totalTokens || 0;
			costTotal += usage.cost?.total || 0;
		}
		turnCount++;

		record({
			type: "turn",
			turnIndex,
			ts: Date.now(),
			label,
			model: modelName(ctx?.model),
			elapsedMs: Date.now() - startedAt,
			usage: usage
				? {
						input: usage.input || 0,
						output: usage.output || 0,
						cacheRead: usage.cacheRead || 0,
						cacheWrite: usage.cacheWrite || 0,
						totalTokens: usage.totalTokens || 0,
					}
				: null,
			cost: usage?.cost?.total ?? null,
			toolCount: toolResults.length,
			toolErrors,
		});
	});

	pi.on("session_shutdown", async () => {
		record({ type: "session_shutdown", ts: Date.now(), label, turnCount, totals, costTotal });
	});
}
