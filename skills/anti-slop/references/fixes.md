# Fix Guide, Per-Flag Fixes (Grounded in Real PRs)

`slop_audit.py` tells you *what* flagged. This file tells you *how to fix it*, structurally, never cosmetically. Every example below is a real line from a real PR audited during validation, not an invented one.

**The one rule that overrides everything below:** do not fix a flag by swapping the flagged surface token for a synonym. June Kim's experiment showed that an adversarial "humanizer" which did exactly that scored *worse* under a stronger detector, because the rhetorical polish it added was itself a tell, while the structure underneath remained. Fix by **injecting grounded substance and breaking the structure**, not by replacing words. `delve` → `look at` on an otherwise-AI draft makes you *more* detectable, not less.

---

## Flag: em-dash density (additive em-dashes)

**What the script measures:** density of real `—` (U+2014) characters per 1000 words. Flagged when 2+ and >4/1000. (CLI `--` separators are excluded, they're not punctuation.)

**Why it's a tell (from the research):** the tell is not *presence* of em-dashes, it's *distribution and function*. Human writers use em dashes for **sharp parenthetical asides or dramatic interruptions** ("the build broke, again, at 3am"). LLMs use them **additively**, to attach qualifying or explanatory segments that read like breath cycles. Vollmer's field guide: "Human em dashes interrupt; AI em dashes append."

**Real example, PR #7120 (9 em-dashes, flagged):**
```
… agent behavior—`SYSTEM.md` rep…
… ` appends to it—yet neither fil…
```
Both are additive: the em-dash glues a qualifier onto the prior clause. Neither interrupts.

**The fix (structural, not deletion):**
1. Fold the qualifier into the sentence so the em-dash disappears: "agent behavior—`SYSTEM.md` represents…" → "`SYSTEM.md` represents agent behavior and…"
2. Or make it a real sharp aside, short, interrupting, set off by commas or its own sentence: "appends to it—yet neither file…" → "It appends. Neither file is read, though."
3. If the em-dash is genuinely doing interruptive work (a real aside), keep it, one or two disruptive ones are human-normal. The flag fires on *clustered additive* use, not on a lone interrupter.

**Do not:** delete all em-dashes. That's cosmetic and leaves the underlying additive-qualifier structure intact, which is the actual tell.

---

## Flag: burstiness (stdev/mean CV < 0.45)

**What the script measures:** coefficient of variation of sentence word-counts. Low CV = uniform sentence length = "flat" prose. Skipped automatically for list-dominant text (command/validation lists are legitimately non-prose).

**Why it's a tell:** humans burst, short declaratives punctuated by long clausal ones. LLMs flatline at a 14–22 word median with small variance. This was GPTZero's original detection signal.

**Real example, PR #7110 (CV 0.34, flagged):**
```
Sentence lengths: [12, 10, 18, 15, 22, 18, 10, 7]
```
Eight sentences, all clustered between 7 and 22 words. No 3-word fragment, no 35-word sentence. The prose breathes at one constant rate.

**The fix (structural):**
1. Break the pattern deliberately. Drop in a 3-word fragment sentence. ("The rebind now captures its original session." → "The rebind captures the session. Stops early if replaced.")
2. Or let one sentence run long and clausal, a sentence that depends on the prior one and stacks constraints.
3. The goal is *variance*, not shortness. Mix 3-word and 30-word sentences. Don't make every sentence short, that's a different AI tell (the flattened tricolon).

**Do not:** arbitrarily shorten every sentence. Uniform-short is as detectable as uniform-medium.

---

## Flag: sentences in 14–22 word band (≥60%)

**What it measures:** the percentage of sentences falling in the 14–22 word "AI median" band. High % = uniform = AI band. Skipped for list-dominant text.

**Why it's a tell:** the same signal as burstiness, viewed differently. LLMs regress toward the 14–22 word mean; humans spread.

**Real example, PR #7120 (57% in band, near threshold):** sentences cluster in the safe middle. Combined with the em-dash flag, this is the "safe, predictable" StoryScope signature, the model making comfortable choices.

**The fix:** same as burstiness, create deliberate length variance. One short fragment, one long clausal sentence.

---

## Flag: contractions = 0 (weak signal)

**What it measures:** count of contractions (`don't`, `it's`, `we're`, etc.) in the text. Flags as [AI] when zero in a ≥100-word piece, *unless* the text is list-dominant or technical-register, in which case it's skipped.

**Why it's a tell (weak):** casual human prose uses contractions; LLMs near-zero them by default. But this is the **weakest** signal in the script because technical writing (PR descriptions, docs, issues) is legitimately contraction-free by convention. The script flags it but weights it lightly in the verdict.

**When it's a real flag:** the text is casual prose (a Discord message, a blog post, a chatty PR) and has zero contractions. That's the AI band.

**When it's a false positive (the script skips it):** technical/list writing. Don't force contractions into a PR description to clear the flag, `don't` in formal technical prose is worse than the missing one.

**The fix (only when casual):** let a few contractions in naturally. "This is not going to work" → "This won't work." Don't overdo it, a 50% contraction rate is itself unnatural.

---

## Flag: focal-word hits

**What it measures:** hits from the Kobak excess-vocabulary list (`delve`, `tapestry`, `realm`, `pivotal`, etc.), scanned in prose only, markdown URLs and capitalized proper nouns (e.g. "Amazon Bedrock") are excluded as false positives.

**Why it's a tell:** Kobak et al. 2025 found these words spiked 10–48× in scientific prose post-ChatGPT. They're stylistic, not content-bearing, the model reaches for them to sound thoughtful.

**Real example, PR #6216 (during validation):** 12 hits on `bedrock`, all from the literal product name "Amazon Bedrock" and its URLs. Correctly excluded after the fix. A genuine hit would be `bedrock` used as a prestige-metaphor ("the bedrock of our architecture").

**The fix (structural):**
1. If the word is doing real work (a literal name, a technical term), keep it, the script's capitalization/URL filters handle most of these.
2. If it's a prestige-metaphor or inflation (`pivotal`, `robust`, `seamless`, `comprehensive`), delete it and replace with the **specific** it was standing in for. "A pivotal moment in our codebase" → "The change that let sessions survive a rebind." The specific is the moat; the adjective is the tell.
3. Never swap `delve` → `dig into` as a synonym replacement. Either delete the phrase or replace it with what you actually mean.

---

## Flag: tricolon candidates (3× short sentences)

**What it measures:** three consecutive sentences ≤5 words each.

**Why it's a tell:** the flattened rule-of-three ("Fast. Simple. Effective."), algorithmic, not the classical Ciceronian tricolon. Wikipedia's signs guide and Vollmer both flag it.

**The fix:** break the pattern, let one of the three be a real sentence with a verb and a dependent clause, or merge two of them. The issue is the *parallel equal-length stacking*, not the number three itself.

---

## Flag: negated-contrast ("not X, but Y")

**What it measures:** patterns like "not just X, but Y" / "isn't merely X, it's Y".

**Why it's a tell:** among the most diagnostic single rhetorical moves (Vollmer calls it "perhaps the single most diagnostic rhetorical move"). Scales fractally, whole posts built of stacked "not X but Y."

**The fix:** rewrite as a direct affirmative. "It's not just about efficiency, it's about transformation" → say what it *is* about, specifically. The negation is almost always a way to sound profound without committing to a claim.

---

## Flag: signposting / closing-ritual phrases

**What it measures:** filler like "it's worth noting," "in today's fast-paced world," "play a pivotal role," "in conclusion," "ultimately," "the journey doesn't end here," "hope this helps."

**Why it's a tell:** the LLM's verbal tics of transition and emphasis. Kobak's excess-word list plus the Wikipedia signs guide.

**The fix:** delete outright. These phrases carry no information; removing them loses nothing and tightens the prose. If a transition is genuinely needed, make it concrete: "this matters because…" → state the actual reason.

---

## What the script cannot flag (judge qualitatively)

These are Layer 3, the durable signal. No script scores them; the model judging its own work is unreliable on them (κ≈0 in the Shaib study). Use the self-audit questions in SKILL.md.

- **Argument dependency chain**: does each sentence inherit a constraint from the prior one, or could you shuffle paragraphs without loss? (June Kim's strongest discriminator.)
- **Narrative scatter**: at least one tangent, aside, or unresolved thread. AI almost never does this; humans do constantly. (StoryScope.)
- **Grounded substance**: real file names, versions, errors, trade-offs, things that almost went wrong. The only signal that survives all detection layers.
- **Opinions and stakes**: what was annoying, surprising, what you'd do differently. Flat affect is a tell.
- **Uneven density**: compress some parts hard, let others breathe. Uniform information density is the AI signature.

When the script is clean but the draft still *feels* AI, the problem is here. No amount of word-swapping fixes it, only injecting what only someone who did the work could write.
