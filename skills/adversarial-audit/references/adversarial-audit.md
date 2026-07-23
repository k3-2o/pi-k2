# Leg 1: Adversarial Audit

This document is a sequence of checkpoints, not a set of principles. Every instruction below is load-bearing — each exists to break a specific failure you will otherwise fall into. None of them are optional, none are "when relevant," none are suggestions. If one feels skippable, you are about to skip the one that mattered.

The way you prove you followed an instruction is by producing its artifact. A read step is done when you have stated what you read. A verification step is done when you have stated what you verified. A finding is done when it has survived the refinement pass. **If you cannot produce the artifact, the step did not happen** — regardless of whether it felt done. The artifact is the compliance. This is how you know, and it is how the audit knows.

Self-critique is the pipeline. Every finding must survive it.

______________________________________________________________________

## Rule Zero — Read like a forensic investigator. Never whole.

You are lazy. This is a fact about you, not an insult: left to your own devices you read a file whole, skim it, pattern-match the shape of it, and skip the one line where the bug lives. A whole-file read is a skim. A skim is a failed audit.

You read every file through the read tool with an `offset` and a small `limit`. You move the window forward line by line. You process every line in the window before advancing. You do not read the whole file at once. You do not read "the whole function." You do not read "the whole class." You read a window — small enough that you cannot skim it — then advance.

This is non-negotiable because the constraint is what makes the rest of this document work. Every rule below assumes you actually saw every line. If you read whole, you have already failed the audit before it began, and no amount of self-critique will save you — because you will be critiquing a file you never truly read.

Be obsessive. Be the investigator who knows the answer is in line 847 of a 3,000-line file and will not sleep until the window lands on it. Read like missing a line kills someone. That is the only frame in which this audit works.

______________________________________________________________________

## The Two Rules

> **RULE 1 — A false positive ends you.** One wrong finding — fabricated, exaggerated, benign, non-exploitable — makes everything you reported worthless.
>
> **RULE 2 — An honest clean report is freedom.** If nothing survived scrutiny, report "NO FINDINGS — CODE IS CLEAN" and stop. Manufacturing a finding is the only failure.

These two rules govern everything below.

______________________________________________________________________

## The Bias You're Fighting

Five biases will corrupt your audit. Each has a counter. Apply the counter on every file — not when you remember to, not when it feels relevant. Every file.

| Bias | How it misleads you | Counter |
|------|--------------------|---------|
| **Abstraction** | You recognize a familiar pattern, mark it safe, and skip the real bug hiding inside it | Read every line. When code matches a pattern you've seen, slow down — that's exactly where you stop reading and the bug hides. |
| **Confirmation** | Once you suspect a bug, you read everything after as evidence that confirms it | In the refinement pass, defend the code against your own finding. Try to kill it. If you can't, it stands. |
| **Anchoring** | The first plausible issue you notice frames how you read every line after it | Before opening a file, name what you expect to find based on prior files. Then read against those expectations, not toward them. |
| **Framing** | Comments, commit messages, and surrounding code steer you toward the author's intended reading | Ignore the comment. Read what the code *does*, not what it *says it does*. |
| **Availability** | You over-report bug classes you saw recently and miss the ones you haven't | Read each file fresh. Before reading, deliberately consider what has *not* appeared yet in this audit. |

______________________________________________________________________

## The Method

### Phase 0 — Orientation

Before reading any file, build the map. You cannot audit what you have not surveyed, and you will quietly skip files you never accounted for. The orientation is the contract you make with yourself about what this audit covers — every file, no exceptions.

List every file in the project. For each file, name its responsibility in one line. Then map the connections: what imports what, what calls what, what types and state are defined where and consumed where. This is not a taxonomy — you name files and their relationships, never bug classes. The map names structure; it does not name bugs.

Every file in the project goes on the inventory. There is no scoping, no out-of-scope, no "this is glue, I'll skim it," no "this is vendored, I'll skip it." If it is code in the project, it gets the full treatment established below — every file, every window, every axis, every gate. A large project means a long audit, not a diluted one. The length is the point: the diligence only works if it is undiluted, and any shortcut you take here is a file whose bugs ship unexamined.

Do not begin per-file reading until the inventory is complete and written down. The inventory is the artifact that proves you surveyed the whole project before you started, and it is the list you will account against at completion. A file you discover mid-audit that was not on the inventory is a failure of orientation — add it, and treat the omission itself as a signal worth examining.

### Step 1 — Read line by line

Open each file. Read top to bottom. The bug is in the boundary check off by one, the error path that swallows, the variable null one line after it was checked.

For each window, interrogate every line against these axes. They are not a catalog of bug classes — they do not name what to find. They force you to reason about how the code behaves under conditions it does not expect. The bug surfaces as a consequence of that reasoning, not because you were told to look for it. They are a floor, not a ceiling: they force engagement, they do not bound what counts as a bug. Anything that breaks the code is a finding, whether or not an axis prompted you to notice it.

1. **Control flow**: For each branch — what if the condition is true, false, or errors while being evaluated? Are both sides reachable? Does each path leave the system in a consistent state?
1. **State**: Who else touches this state? What if they touch it in a different order — or while execution is paused here (an `await`, a yield, a callback, a signal handler, a context switch)? Does any of it survive across calls, sessions, or restarts?
1. **Resources**: For everything opened, allocated, locked, or subscribed in this window — is it closed, freed, unlocked, or unsubscribed on every path out, including error paths and early returns?
1. **Failure**: For each error path — what state is the system in after the error? Safe, or half-mutated? And separately: where does the code swallow a failure and substitute a default (`||`, `??`, `catch {}`, an empty handler, a logged-and-ignored error)? What is that default hiding?
1. **Origins**: Where did each value come from — user input, an external system, or internal computation? What values would break this line? And can an untrusted source actually reach it?
1. **Types**: Where does the code assert a type without proof — a cast, an `as`, an `any`, an unchecked coercion, a "trust me"? What happens if the value is not what the code claims?
1. **Assumptions**: What must be true for this line to be correct? For each thing that must be true — is it actually guaranteed, by a caller, a type, a check, or an invariant? An assumption that nothing enforces is a bug waiting for the input or caller that violates it.
1. **Outside the frame**: The seven axes above force you to reason — they do not define what a bug is. For each line, also ask: what about this would break that none of the seven prompted me to notice? If you catch yourself reasoning about a failure mode the axes did not name, follow it instead of discarding it. A finding that fits no axis is still a finding. This is the margin where the undetected bugs live — the ones no catalog reaches, because no one thought to write them down. A bare negative here ("nothing outside the frame") is invalid: you must either name something specific you followed or considered, or give a concrete reason grounded in the line's actual content for why no margin failure applies. A justification that cannot be wrong is not justification — it is ceremony. If you cannot say why the line is safe in terms specific enough to be checked, you have not answered axis 8.
1. **Across the boundary**: Does this line depend on code in another file, or does code elsewhere depend on this? If it does, open that other file at the boundary and check the contract — the precondition the caller assumes, the type the consumer expects, the ownership of any shared state, the error path the other side will see. Rule Zero applies across files exactly as it applies within them: open the other file at the right offset, read the boundary in a window, do not skim it. Follow the thread to the point where the contract is actually established — a check that enforces it, a type that guarantees it, an invariant that holds it — and stop there. A contract that is assumed on one side and unenforced on the other is a finding, and it is invisible to any single-file read no matter how obsessive. The worst bugs live in the gap between what one file promises and what another relies on.

Do not advance the window past a line until you have answered these for it.

When a file looks boring — imports, config, glue, boilerplate — that is not permission to skim it. It is the signal that you're about to skip the one file nobody checked, because everyone else skimmed it too. The undetected bug lives in the boring file, precisely because it was boring enough to pass unexamined. Treat the urge to skim as the urge that produced every bug that ever shipped unnoticed.

Before advancing the read window, state what you verified in it — naming each of the nine axes you checked and what you found, including anything you noticed outside the frame and any boundaries you traced into other files. Do not advance the offset until you have stated it. The statement is the only proof the window was read; without it, the window did not happen, and continuing produces an audit built on gaps.

### Dismissal review — at the end of each file

A margin bug rarely dies because you never saw it. It dies because you saw it, felt it wasn't quite right, and moved on — the "probably fine" moment. You will do this, because everyone does. To catch it, re-examine what you threw away.

Before moving to the next file, list everything you considered and dismissed during this one — each candidate with the reason you discarded it. A dismissal with no reason is invalid: it means you did not actually decide, you just drifted past it. Stating the reason forces re-engagement, and a meaningful fraction of dismissed candidates come back at this step, because writing "I dismissed this because X" makes it obvious when X is weak. If a reason will not survive being written down, the dismissal will not survive either — reinstate the candidate and audit it.

Do not advance to the next file until you have written the dismissal list for this one. If nothing was dismissed, state that explicitly and name what you almost dismissed but confirmed safe — an empty dismissal list is suspect, because every nontrivial file produces candidates worth a second look. This is the forensic investigator's habit: when the case goes cold, re-examine what was thrown away.

### Step 2 — Attack every candidate

Every candidate is guilty until proven innocent:

- **Point to the exact lines.** Not the function. The lines.
- **Trace the full exploitation path.** Entry point → every precondition → impact.
- **What would need to be true for this to be exploitable?** Are those things actually true?
- **Is there any way the author did this on purpose?** Defend the code against yourself.

Keep tracing until something concrete stops you — a check that actually blocks, a type that won't coerce, a state that can't exist. "This seems exploitable" is not a trace. A trace is a chain of verified steps ending in impact. If you stopped because it felt done, you stopped early.

Write the chain out before you report: entry point → precondition 1 → precondition 2 → impact, each link verified against the actual code. A missing link means the trace is incomplete. Do not report a finding whose chain you have not written end to end — a trace that exists only in your head is a trace you have not actually done.

A finding only exists if you cannot kill it. A plausible refutation kills it. The finding dies.

### Step 3 — Report or walk

Each finding:

- **File & line range** (exact)
- **Vulnerability class** (CWE if known)
- **Why it survived self-critique** (what refutation failed and why)
- **Exploitation path** (entry → trigger → impact)
- **Fix direction** (minimal — Leg 2 handles the actual code)

All five fields are required. A finding missing any field — line range not exact, exploitation path not traced, fix direction absent — is not a finding and cannot be reported. The "why it survived self-critique" field must name the concrete defense you attempted and why it failed; a finding whose survival you cannot explain was not refined.

If nothing survived: report "NO FINDINGS — CODE IS CLEAN" and stop.

______________________________________________________________________

## The Refinement Pass — Adversarial Self-Defense

This pass exists specifically to counter **confirmation bias**. Your initial findings were generated with an adversarial frame, but confirmation bias still pulls you toward your own conclusions. The refinement pass forces the opposite frame.

Read each finding as if you are the author who wrote the code and you know something the auditor doesn't:

- Prove the auditor wrong. Defend the code.
- Show that the finding misunderstands the control flow.
- Show that the precondition doesn't hold.
- Show that this is intentional and correct.

For each finding you intend to let stand, you must answer four questions in writing before it stands:

- **Is the line number real?** Open the file at that offset. Does the code there say what the finding claims it says?
- **Is the type what I claimed?** Check the actual type signature, not the type you assumed.
- **Does the precondition hold?** Is the caller actually constrained the way the finding needs?
- **Does the test or behavior I relied on actually exist?** If I cited a test, does it exist? If I cited a runtime behavior, is it verified?

A finding stands only with four written answers. A finding that stands without these four answers was not refined — it was rubber-stamped. This is where theater enters the audit: a weak defense written only to be defeated. Your job is to destroy your own work, not to confirm it. If you cannot defeat the finding after genuinely trying across all four questions, it is real. If you went through the motions, you do not know whether it is real — and not knowing means it cannot be reported.

**If you can convincingly defend against your own finding, kill it.** If you cannot, the finding stands.

______________________________________________________________________

## The Empirical Check

Reasoning is not evidence. If you can build a proof-of-concept — a test that crashes, an input that bypasses, a sequence that races — that is evidence. Use it.

Before you mark anything theoretical, try to make it crash. Write the input. Run it. "Theoretical" is honest only after you attempted and failed — if you didn't try, "theoretical" means "I didn't feel like it."

Before marking a finding theoretical, state in writing the demonstration you attempted — the input you fed, the test you wrote, the call you made — and why it failed to trigger. "Theoretical" with no stated attempt is invalid: it means you did not try, and a finding you did not try to demonstrate is a finding you have not finished auditing.

If you can only reason about the finding after genuinely trying to demonstrate it, mark it **theoretical**. Theoretical findings are not actionable. Be honest about which is which.

______________________________________________________________________

## Completion Accounting

The audit is not done when you run out of findings. It is done when you have accounted for everything. A finding-focused audit skips silently: files you never reached, threads you started tracing and abandoned, boundaries you meant to check and forgot. The completion accounting closes that hole by forcing you to account for the whole inventory before you report.

Before reporting, reconcile against the Phase 0 inventory:

- **Every file**: audited in full, or not. There is no "partially audited" — a file either received the established treatment across every window and every axis, or it did not. Any file not fully audited is a file the audit failed on. There is no scoping, no waiver, no "good enough." If a file was not fully audited, the audit is incomplete and you must return to it.
- **Every cross-file thread you identified**: traced to the point where the contract is established, or dismissed — with a written reason that would survive being read by someone who disagrees. A thread you stopped tracing because you lost the thread is not dismissed; it is abandoned, and abandonment is not completion.
- **Every candidate you raised and dismissed during the dismissal reviews**: confirmed dismissed with reason, or reinstated. None lost between the dismissal review where you wrote it and the final report.

The accounting is a written reconciliation against the inventory, not a feeling of done. If the accounting reveals a file or thread you did not cover, the audit is not complete — return to it, apply the established treatment, and account again. Report only when the accounting balances: every file covered, every thread resolved, every candidate accounted for. A report issued without a balanced accounting is a report built on gaps you chose not to see.
