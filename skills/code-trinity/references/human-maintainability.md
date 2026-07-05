# Leg 3: Human Maintainability

## Your Mission

Make code that a human can return to in 10 years and understand immediately. Legs 1 and 2 find problems. You fix them — with human clarity as an additional constraint beyond correctness.

---

## Safety Doctrine

You are the only leg that writes code. Modify nothing until you have verified these rules hold.

### Hard Rules

1. **Never change behavior and structure in the same commit.** Behavior changes are for Leg 1 fixes. Structural improvements are for Leg 3. If both are needed, do two separate passes.
2. **Tests must pass before AND after every change.** Run the test suite before starting (baseline) and after each fix.
3. **One concern per change.** Don't fix three things at once. Each fix is isolated, verified, and committed separately.
4. **The diff must be reviewable.** A human should be able to read the diff and understand exactly what changed and why.
5. **When in doubt, do less.** A minimal improvement that's clearly correct beats an ambitious refactor that might be wrong.

### The Fallback

If a fix would require complex refactoring that risks breaking things:
- Leave a clear comment explaining what should be done
- File it as a known debt item
- Move on — prioritize safety over perfection

---

## Clean Code Principles

Apply these standards to every fix you write. They govern new code during remediation, not the entire existing codebase (unless a full maintainability pass was requested).

### Naming

| Principle | Apply to | Example |
|-----------|----------|---------|
| **Intention-revealing** | Every identifier | `elapsedTimeInDays` not `d` or `retval` |
| **Pronounceable** | Every identifier | `generationTimestamp` not `gen_ts_tm` |
| **Searchable** | Every identifier | Single-letter names only in tiny scopes |
| **No prefix/suffix encoding** | Variables | `users` not `usersList` or `arrUsers` |
| **Consistent vocabulary** | Project-wide | Pick one term per concept and use it everywhere |
| **Scope-length match** | Variables | Short scope = short name OK, wide scope = descriptive name |

### Functions

| Principle | Apply to | Check |
|-----------|----------|-------|
| **Small** | Every function | Can you fit it on screen? (~20 lines max per function) |
| **Single responsibility** | Every function | Describe what it does in one sentence without "and" or "or" |
| **Few parameters** | Every function | Max 3. If you need more, bundle into an object/struct. |
| **No side effects** | Every function | Does it do anything beyond what its name says? |
| **Command-query separation** | Every function | It either does something (command) or answers something (query). Not both. |
| **DRY but not over-abstracted** | Project-wide | Duplication is cheaper than the wrong abstraction. 3+ occurrences → extract. |

### Structure

| Principle | Apply to | Check |
|-----------|----------|-------|
| **Clear control flow** | Every branch | Avoid deep nesting (max 2-3 levels). Early returns > else chains. |
| **Obvious data flow** | Every function | Inputs → transform → output. No hidden state mutations. |
| **Minimal dependencies** | Every module | Can you count them on one hand? |
| **Tell, don't ask** | Objects | Tell objects what to do rather than querying their state and deciding. |
| **Law of Demeter** | Method calls | `a.b.method()` not `a.b.c.d.method()` |
| **Positive conditionals** | If/else | `if (isActive)` not `if (!isInactive)` |

### Comments

| Principle | Apply to | Check |
|-----------|----------|-------|
| **Why, not what** | Every comment | The code already says WHAT. Comments explain WHY. |
| **No commented-out code** | Every file | Delete it. Git history has the old version. |
| **No journal comments** | Every file | Don't log changes in comments. Git blame is better. |
| **Explain trade-offs** | Complex logic | "Using X here because Y doesn't handle edge case Z." |
| **Document surprises** | Non-obvious code | "This looks wrong but is correct because..." |
| **TODO format** | Known debt | `// TODO(2026-07): Refactor when auth module is updated — `[reason]` |

### Early Returns > Nested Conditionals

```
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

For each finding from Phase 1, follow this process:

```
1. UNDERSTAND the finding
   ├── What is the root cause?
   ├── What is the minimal fix?
   └── Does this fix need behavior change, structure change, or both?

2. PLAN the fix
   ├── If behavior change only: apply the fix, verify with tests
   ├── If structure change only: refactor, verify with tests
   └── If both: DO TWO PASSES (behavior first, then structure)

3. APPLY the fix
   ├── Write clean code (follow principles above)
   ├── Write a clear commit message explaining WHY
   └── Keep the diff small and focused

4. VERIFY the fix
   ├── Run the test suite
   ├── If behavior change: add a test that would catch the old bug
   └── If structure change: verify tests still pass (they should — no behavior changed)

5. COMMIT
   ├── One fix per commit
   ├── Commit message format:
   │   fix(category): brief description
   │
   │   Why: [root cause]
   │   How: [approach]
   │   Verified: [test evidence]
   └── Reference the finding ID
```

### Commit Message Convention

```
fix(auth): reject expired tokens at middleware level

Why: Tokens were checked only at the controller layer,
leaving a window where expired tokens could reach
downstream services.

How: Added token expiry validation in the auth middleware
before routing to controllers. The check is minimal — one
comparison against UTC timestamp.

Verified: Added test `test_expired_token_rejected_at_middleware`
— passes. All 214 existing tests pass.

Finding: #A-17 (adversarial audit)
```

---

## Fix Decisions

| Situation | Action |
|-----------|--------|
| Finding is real but fix is risky | Leave a `// TODO` with explanation, skip the fix, flag for human |
| Fix would change API contract | Don't. Flag for human. API changes need coordination. |
| Code is working but ugly | Clean it up in a structure-only pass (separate from behavior fixes) |
| Code is working but fragile | Add defensive checks + comments explaining the fragility |
| Dead code found | Delete it. Git history preserves it. |
| Duplicate code | Extract only if the duplication is stable (same change pattern). If coincidental, leave it. |
| Complex function > 50 lines | Break into smaller functions. Each sub-function does one thing. Test still passes. |
| Variable named `x` | Rename to intention-revealing name. Check rename doesn't break anything. |
| Deep nesting | Convert to early returns. Same behavior, clearer flow. |

---

## When to Move Fast vs Slow

Move fast on safe changes. Slow down on risky ones.

**Speed up when:**
- Renaming a poorly-named variable
- Extracting a helper function
- Adding a clarifying comment
- Removing dead code

**Slow down when:**
- Changing control flow
- Modifying error handling
- Touching async/concurrent code
- Changing any auth/security logic

---

## Self-Check Before Committing

Run through these before every commit:

- [ ] Can a new developer understand this in 5 minutes?
- [ ] Does the function name tell you exactly what it does?
- [ ] Are the tests readable as documentation?
- [ ] Would I be embarrassed to show this to a senior engineer?
- [ ] If I come back in a year, will I understand why this change was made?
- [ ] Is this the simplest possible correct fix?

If any answer is concerning, refine before committing.

---

## Verification with Legs 1 & 2

After each fix, the diff must be re-scanned:

- **Leg 1 re-scan**: Did this fix introduce any vulnerability? New logic paths? New attack surface?
- **Leg 2 re-scan**: Run tools on the changed files only. New dead code? Type errors?

Clean → commit. Issue found → fix and re-scan. Same issue twice → escalate to human. That is the oscillation guard.

---

## The Standard

A decade from now, someone will open this codebase. They should be able to:
1. Open a file and understand its purpose from the first 10 lines
2. Trace a function call without opening 5 different files
3. Find and fix a bug without fear of breaking something unrelated
4. Understand why a commit was made from its message
5. Trust that the code does what it says and says what it does

Hold every fix to that bar.
