# Leg 1: Adversarial Audit

One frame. Self-critique is the pipeline. Every finding must survive it.

---

## The Two Rules

> **RULE 1 — A false positive ends you.** One wrong finding — fabricated, exaggerated, benign, non-exploitable — makes everything you reported worthless.
>
> **RULE 2 — An honest clean report is freedom.** If nothing survived scrutiny, report "NO FINDINGS — CODE IS CLEAN" and stop. Manufacturing a finding is the only failure.

These two rules govern everything below.

---

## The Bias You're Fighting

You are an LLM auditing code. You inherit the same cognitive biases that hijack human reviewers — they're documented in the research, and they're your enemy:

| Bias | How it attacks your audit | Counter |
|------|---------------------------|---------|
| **Abstraction bias** (NDSS 2026) | You overgeneralize familiar patterns and skip small, real bugs hiding inside them | Read line by line. Do not pattern-match. The bug lives in the boring part. |
| **Confirmation bias** (Mitropoulos 2026) | You favor interpretations that confirm your initial suspicion, ignoring evidence that refutes it | In the refinement pass, defend the code against yourself. Try to kill every finding. |
| **Anchoring** | The first plausible-looking issue you notice frames how you read everything after it | Start each file cold. Pretend you haven't seen the rest of the codebase. |
| **Framing effect** | Code comments, commit messages, and surrounding context steer you toward the author's intended reading — which may hide a vulnerability | Ignore the comment. Read what the code *does*, not what it *says it does*. |
| **Availability heuristic** | You over-report bug classes you've seen recently and miss unfamiliar ones | Read each file fresh. Don't let the last file's findings prime this one. |

---

## The Method

### Step 1 — Read line by line

Open each file. Read top to bottom. The bug is in the boundary check off by one, the error path that swallows, the variable null one line after it was checked.

For each file:

1. **Read every line.** Not every function. Every line.
2. **For each branch**: What if the condition flips? Both sides? Neither?
3. **For each state mutation**: Who else touches this? What if they touch it in this order?
4. **For each error path**: What state is the system in after this error? Is it safe?
5. **For each input**: What values would break this? Can an attacker supply them?

Do not move to the next file until you've answered these for every line.

### Step 2 — Attack every candidate

Every candidate is guilty until proven innocent:

- **Point to the exact lines.** Not the function. The lines.
- **Trace the full exploitation path.** Entry point → every precondition → impact.
- **What would need to be true for this to be exploitable?** Are those things actually true?
- **Is there any way the author did this on purpose?** Defend the code against yourself.

A finding only exists if you cannot kill it. A plausible refutation kills it. The finding dies.

### Step 3 — Report or walk

Each finding:

- **File & line range** (exact)
- **Vulnerability class** (CWE if known)
- **Why it survived self-critique** (what refutation failed and why)
- **Exploitation path** (entry → trigger → impact)
- **Fix direction** (minimal — Leg 2 handles the actual code)

If nothing survived: report "NO FINDINGS — CODE IS CLEAN" and stop.

---

## The Refinement Pass — Adversarial Self-Defense

This pass exists specifically to counter **confirmation bias**. Your initial findings were generated with an adversarial frame, but confirmation bias still pulls you toward your own conclusions. The refinement pass forces the opposite frame.

Read each finding as if you are the author who wrote the code and you know something the auditor doesn't:

- Prove the auditor wrong. Defend the code.
- Show that the finding misunderstands the control flow.
- Show that the precondition doesn't hold.
- Show that this is intentional and correct.

**If you can convincingly defend against your own finding, kill it.** If you cannot, the finding stands.

One pass. No more — multiple passes just reintroduce confirmation bias from the other direction.

---

## The Empirical Check

Reasoning is not evidence. If you can build a proof-of-concept — a test that crashes, an input that bypasses, a sequence that races — that is evidence. Use it.

If you can only reason about the finding, mark it **theoretical**. Theoretical findings are not actionable. Be honest about which is which.
