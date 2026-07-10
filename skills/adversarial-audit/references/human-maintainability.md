# Leg 2: Human Maintainability

## Mission

Fix findings with code that a human can return to in 10 years and understand immediately. Correctness is the floor. Clarity is the bar.

---

## Safety Doctrine

You are the only leg that writes code. These rules are non-negotiable.

### Hard Rules

1. **Never change behavior and structure in the same commit.** Behavior fix first, structure second — two commits if both are needed.
2. **Tests must pass before AND after every change.** Baseline first, verify after.
3. **One concern per change.** Don't fix three things at once.
4. **The diff must be reviewable.** A human reads the diff and understands what changed and why.
5. **When in doubt, do less.** Minimal correct beats ambitious and wrong.

### Fallback

If a fix requires risky refactoring:
- Leave a `// TODO` explaining the intended change
- Flag it as known debt
- Move on — safety over perfection

---

## Clean Code Principles

These govern new code written during remediation, not the entire existing codebase (unless a full maintainability pass was requested).

### Naming

Naming is a cognitive load multiplier, not a style preference. Poor naming measurably increases comprehension time.

| Principle | Apply to | Example |
|-----------|----------|---------|
| **Intention-revealing** | Every identifier | `elapsedTimeInDays` not `d` or `retval` |
| **Pronounceable** | Every identifier | `generationTimestamp` not `gen_ts_tm` |
| **Searchable** | Every identifier | Single-letter names only in tiny scopes |
| **No prefix/suffix encoding** | Variables | `users` not `usersList` or `arrUsers` |
| **Consistent vocabulary** | Project-wide | Pick one term per concept and use it everywhere. Developers expect predictability — `get_user(id)` paired with `get_project(id)`, not `fetchProject(id)`. |
| **Scope-length match** | Variables | Short scope = short name acceptable. Wide scope = descriptive name required. |

### Functions

Empirically: nesting depth and number of unique variables in scope are the strongest predictors of comprehension difficulty (220-programmer study, Fowler et al. 2019).

| Principle | Apply to | Threshold |
|-----------|----------|-----------|
| **Small** | Every function | ~20 lines max. If it doesn't fit on screen, it's doing too much. |
| **Single responsibility** | Every function | Describe what it does in one sentence without "and" or "or" |
| **Few parameters** | Every function | Max 3. Bundle into an object/struct if more. |
| **No side effects** | Every function | Does it do anything beyond what its name says? |
| **Command-query separation** | Every function | Command (does something) or query (answers something). Not both. |
| **DRY but not over-abstracted** | Project-wide | Duplication is cheaper than the wrong abstraction. 3+ occurrences → extract. |

### Structure

| Principle | Apply to | Check |
|-----------|----------|-------|
| **Max 2-3 nesting levels** | Every branch | Deep nesting is the top predictor of comprehension failure. Early returns > else chains. |
| **Obvious data flow** | Every function | Inputs → transform → output. No hidden state mutations. |
| **Minimal dependencies** | Every module | Can you count them on one hand? |
| **Tell, don't ask** | Objects | Tell objects what to do rather than querying their state and deciding. |
| **Law of Demeter** | Method calls | `a.b.method()` not `a.b.c.d.method()` |
| **Positive conditionals** | If/else | `if (isActive)` not `if (!isInactive)` |

### Comments

| Principle | Apply to | Check |
|-----------|----------|-------|
| **Why, not what** | Every comment | The code says WHAT. Comments explain WHY. |
| **No commented-out code** | Every file | Delete it. Git history has the old version. |
| **No journal comments** | Every file | Don't log changes in comments. Git blame is better. |
| **Explain trade-offs** | Complex logic | "Using X here because Y doesn't handle edge case Z." |
| **Document surprises** | Non-obvious code | "This looks wrong but is correct because..." |
| **TODO format** | Known debt | `// TODO(2026-07): Refactor when auth module is updated — `[reason]` |

### Early Returns > Nested Conditionals

```typescript
// BAD — nested mess
if (isValid) {
  if (hasPermission) {
    if (isWithinLimit) {
      process();
    } else {
      reject("limit exceeded");
    }
  } else {
    reject("no permission");
  }
} else {
  reject("invalid");
}

// GOOD — early returns
if (!isValid) { reject("invalid"); return; }
if (!hasPermission) { reject("no permission"); return; }
if (!isWithinLimit) { reject("limit exceeded"); return; }
process();
```

---

## Fix Workflow

```
1. UNDERSTAND the finding
   ├── Root cause?
   ├── Minimal fix?
   └── Behavior change, structure change, or both?

2. PLAN
   ├── Behavior only → apply fix, verify with tests
   ├── Structure only → refactor, verify tests still pass
   └── Both → TWO PASSES (behavior first, then structure)

3. APPLY
   ├── Write clean code (follow principles above)
   ├── Keep the diff small and focused

4. VERIFY
   ├── Run the test suite
   ├── Behavior change → add a test that would catch the old bug
   └── Structure change → verify tests still pass (no behavior changed)

5. COMMIT — one fix per commit
   fix(category): brief description

   Why: [root cause]
   How: [approach]
   Verified: [test evidence]
   Finding: #[ID]
```

---

## Fix Decisions

| Situation | Action |
|-----------|--------|
| Finding real but fix risky | Leave `// TODO` with explanation, skip the fix, flag for human |
| Fix would change API contract | Don't. Flag for human. API changes need coordination. |
| Code works but ugly | Structure-only pass (separate from behavior fixes) |
| Code works but fragile | Add defensive checks + comments explaining the fragility |
| Dead code | Delete it. Git history preserves it. |
| Duplicate code | Extract only if the duplication is stable (same change pattern). If coincidental, leave it. |
| Complex function > 50 lines | Break into smaller functions. Each does one thing. Tests still pass. |
| Variable named `x` | Rename to intention-revealing name. Verify rename doesn't break anything. |
| Deep nesting | Convert to early returns. Same behavior, clearer flow. |

---

## Speed vs. Caution

**Move fast (low risk):**
- Renaming a poorly-named variable
- Extracting a helper function
- Adding a clarifying comment
- Removing dead code

**Slow down (high risk):**
- Changing control flow
- Modifying error handling
- Touching async/concurrent code
- Changing any auth/security logic

---

## Verification

After each fix, the diff is re-scanned (adversarial review on changed lines):

- **Adversarial re-scan**: Did this fix introduce any vulnerability? New logic paths? New attack surface?
- **Intelligence tools** (if run earlier): Re-run on changed files only. New dead code? Type errors?

Clean → commit. Issue found → fix and re-scan. Same issue twice → escalate to human.

---

## The Standard

A decade from now, someone opens this codebase. They can:
1. Understand a file's purpose from the first 10 lines
2. Trace a function call without opening 5 different files
3. Find and fix a bug without fear of breaking something unrelated
4. Understand why a commit was made from its message
5. Trust that the code does what it says and says what it does
