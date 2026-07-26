---
name: anti-slop
description: "Generate or polish written text — PR descriptions, issue reports, Discord/Slack messages, commit messages, release notes, design docs, any writeup — so it reads as genuinely human and does not trip AI-slop detection at any layer. Use when writing or revising any text that humans will read and that must not read as AI-generated: drafting PRs/issues/changelog/chat, or auditing an existing draft for slop. Extracts real specifics via Q&A before writing; never fabricates."
compatibility: "Python 3 (stdlib only) for scripts/slop_audit.py. No external dependencies."
---

# anti-slop

Produce text that a practiced reader (or detector) cannot distinguish from human-written. Covers PRs, issues, chat, commits, release notes, docs — any writeup where the bar is "indistinguishable from a human."

## The thesis (read this first)

The moat is **not style**. It is **grounded specificity + controlled messiness + a real voice**.

A checklist of tells-to-avoid is itself an *exploit surface*: optimizing against it produces dehumanized text ("structurally necessary and nothing else") and the deeper layers still give you away. Detection works at three layers; scrubbing only the surface makes you *more* detectable, because the rhetorical polish you add is itself a tell while the structure underneath remains.

So: **do not optimize against a detector. Optimize for what detectors cannot survive** — which is the same thing that makes writing human: real specifics, argument dependency, controlled messiness, a voice with opinions and stakes.

**Grounding rule (non-negotiable):** every specific must come from provided facts, the repo, or the user. **Never fabricate file names, versions, errors, quotes, citations, or outcomes.** Fabricated specifics are themselves a slop tell (the Factuality code in the research) and destroy the only layer that survives detection. If you lack substance, ask for it (see Workflow) or write a thinner, honest draft.

## The three layers (depth: references/detection-layers.md)

1. **Surface** — lexical + punctuation tells (`delve`/`tapestry`/`realm`, "it's worth noting," additive em dashes, tricolons, "in conclusion"). Trivial to scrub. **Scrubbing only this layer makes you MORE detectable.**
2. **Structure** — low burstiness (uniform sentence length), templatedness, five-paragraph shape, excessive signposting, hedge-and-reassure, flat affect, resolution bias. Medium.
3. **Narrative / argument graph** — the durable signal. AI clusters and is safe/vague; humans scatter. AI stacks shufflable self-contained units; real writing forces later sentences to inherit constraints from earlier ones. The only un-fakeable part is **domain substance** (real facts, real trade-offs, real things that broke).

## Workflow

### Mode A — generate a draft

1. **Extract substance first (the moat).** Before writing, ask the user the questions that surface what only they know:
   - What actually happened? What broke, and how? The real error/cause?
   - What trade-off did you make, and what did you give up?
   - Real specifics: file paths, function/type names, versions, error strings, timestamps, commands, line numbers, prior decisions.
   - What was annoying, surprising, almost-went-wrong, or you'd do differently?
   - Who is the reader and what do they already know?
   Do **not** write until you have grounded specifics. If the user can't provide them, say so and write a thinner, honest draft rather than inventing detail.
2. **Draft with the positive moves** (below) baked in from the first word — not added after.
3. **Self-audit** across all three layers: run `scripts/slop_audit.py` for L1/L2; judge L3 qualitatively with the self-audit questions below.
4. **Iterate once.** One pass only — more passes drift toward the dehumanized optimum.

### Mode B — review/polish an existing draft

1. Run `scripts/slop_audit.py <file>` (or pipe text). Read the L1/L2 flags.
2. Judge L3 qualitatively (self-audit questions).
3. **Fix by injecting, not swapping.** Cosmetic word-swaps (`delve`→`look`) on a structurally-AI draft make it *more* detectable. Prefer: add a grounded specific, build a dependency chain, break burstiness, add one tangent/aside, add an opinion. **For per-flag structural fixes with real examples, read [references/fixes.md](references/fixes.md).**
4. If the draft lacks grounded substance entirely, send it back to Mode A step 1 — do not "fill in" with fabricated detail.

## The positive moves (what to DO — these matter more than the avoid-list)

- **Ground every specific.** Real file paths, names, versions, errors, timestamps, commands, places. If you don't have it, don't name it.
- **Build argument dependency chains.** Each sentence/paragraph must depend on the prior one — a later sentence should be hard to understand without the earlier one. No shufflable self-contained units. Paragraphs end on unresolved tension, not tidy closure.
- **Vary burstiness.** Mix 3-word and 30-word sentences. Let some sentences be fragments. Humans burst; AI flatlines.
- **Embrace controlled messiness.** One tangent, one aside, one unresolved thread, one opinionated compression, one loose end. Not chaos — *controlled* messiness.
- **Address the reader sometimes; name real things.** Not every time. But AI plays safe and vague; humans reference the concrete and occasionally talk to "you."
- **Opinions and stakes.** Say what was annoying, what almost broke, what you'd do differently, what the real cost was. Flat affect is a tell.
- **Uneven density.** Compress some parts hard; let others breathe. Uniform information density is the AI signature.
- **Match the medium's register** (below) — but never so uniformly that it reads templated.

## The avoid-list (L1+L2 — keep these out, but they are NOT the point)

Strip these, but never stop here. Full catalog in `references/detection-layers.md`.

- **Focal words**: delve, tapestry, realm, pivotal, intricate, meticulously, multifaceted, robust, seamless, leverage, navigate, testament, foster, elevate, underscore, showcasing, landscape, paradigm, nuanced, holistic, comprehensive, transformative, ever-evolving, beacon, cornerstone, bedrock.
- **Signposting filler**: "it's worth noting," "in today's fast-paced world," "in the realm of," "play a pivotal role," "at its core," "when it comes to."
- **Closing rituals**: "in conclusion," "in summary," "overall," "ultimately," "the journey doesn't end here," "hope this helps," "let me know if you'd like me to go deeper."
- **Rhetorical moves**: the negated contrast ("it's not X, it's Y"), flattened tricolons ("Fast. Simple. Effective."), the participial tail ("…, marking a pivotal moment in…"), hedge-and-reassure stacks.
- **Punctuation/structure**: additive em dashes (attaching qualifiers — human em dashes *interrupt*), curly quotes where straight belong, emoji bullets, title-case headings where none belong, nested bullets for non-list ideas, section recaps, uniform 14–22-word sentences.
- **Tone**: sycophantic openers ("great question!"), flat affect, promotional adjectives on non-promotional subjects, false profundity, both-sides hedges.

## Per-medium register (brief)

- **PR description**: structured but voiced. Lead with the why and the trade-off, not a summary paragraph. Real file/function names. One sentence on what almost went wrong. Skip "## Summary / ## Changes / ## Testing" boilerplate unless the repo convention demands it — and if it does, keep each section to substance, not restatement.
- **Issue report**: factual, with stakes. Real repro: exact command, real error string, real version, real environment. Expected vs. actual. What you tried. Don't moralize about the bug.
- **Discord/Slack**: terse, lowercase-tolerant, fragments fine. One tangent or aside is normal. React to things. Don't post a five-paragraph essay.
- **Commit message**: imperative subject ≤50 chars; body explains the why and the trade-off; references real specifics. No marketing language.
- **Release notes / changelog**: what changed, in user-facing terms, with real names/versions. Group by impact, not by PR. Skip adjectives.
- **Design doc / general**: lead with the decision and its stakes, not background. Address the reader. Leave one tension unresolved on purpose.

## Self-audit (L3 — qualitative, after writing)

Answer honestly. Any flagged answer is a slop risk:

1. Could I shuffle this paragraph with another without loss? If yes → rebuild the dependency chain.
2. Is every specific grounded in provided facts/the repo? Any I invented? Delete or replace with grounded truth.
3. Does each sentence inherit a constraint from the prior one?
4. Is there at least one tangent, aside, or unresolved thread? (Chaos ≠ messiness. One is enough.)
5. Does the sentence-length distribution actually vary (burstiness)? Check `slop_audit.py`.
6. Is there a real opinion, stake, or thing-that-almost-went-wrong in here?
7. Would a heavy LLM user (the ~90%-accurate human detector) flag this? Re-read as that person.
8. Did I reflexively add a `delve`/`tapestry`/`in conclusion`/qualifier em dash? Strip.

## scripts/slop_audit.py — deterministic L1/L2 scorer

```bash
python scripts/slop_audit.py path/to/draft.md      # audit a file
echo "text..." | python scripts/slop_audit.py -      # audit stdin
```

Reports: sentence-length burstiness (mean/stdev/CV), em-dash density per 1000 words, focal-word hits, signposting/closing-phrase hits, tricolon candidates, negated-contrast hits, type-token ratio, contraction count. Flags anything in the AI band. **Covers L1 and part of L2 only.** L3 (argument dependency, narrative scatter, domain substance) cannot be scored automatically — judge it with the self-audit above.

## References

- `references/detection-layers.md` — the full three-layer model, complete tell catalogs, and research citations (StoryScope; Shaib et al. "Measuring AI Slop"; June Kim's adversarial experiment; Kobak et al.; Vollmer's field guide; McGovern et al.; Bharadwaj et al.). Read when you need depth, the full focal-word/phrase lists, or to justify a call.
- `references/fixes.md` — per-flag fix guide with real examples from audited PRs. **Read this when the audit flags something and you need to know how to fix it structurally** (not by cosmetic word-swaps). Each entry: what the flag measures, why it's a tell, a real example, the structural fix, and what NOT to do.
