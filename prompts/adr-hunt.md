---
description: Reverse the git log and map every commit that smells like an architectural decision
argument-hint: "[max-commits]"
---

# ADR Hunt — Archaeological Git Log Scan

You are doing **decision archaeology**. Your goal: scan the entire git history of this repo, identify every commit that represents a genuine architectural decision, and produce a single annotated map file.

**Do not skip commits. Do not summarize large ranges. Read every commit message.**

---

## Step 1: Get the full git log

Run this command first:

```bash
git log --reverse --format="%H %ad %an %s" --date=short
```

If the repo has more than ${1:-1000} commits, ask: "This repo has more than ${1:-1000} commits. Should I scan all of them, or focus on a date range?"

If the user says proceed with all, run the command without limits and capture the full output. Stderr warnings (e.g., "detected dubious ownership") can be ignored; you can set `git config --global --add safe.directory '*'` if needed, but mention to the user that they should review this.

---

## Step 2: Classify every commit

For EACH commit, apply these filters:

### ADR-WORTHY — mark with `→ ★ ADR-CANDIDATE`
A commit is ADR-worthy if it represents a deliberate choice among alternatives that shaped the project's structure. Signals:

- Introduces a new architectural pattern, module boundary, or communication protocol
- Replaces one approach with another ("swap X for Y," "migrate from A to B")
- Makes a structural decision with lasting consequences (monorepo split, config format, session model, API design, extension system, custom implementation of a standard)
- Commit message contains words like: "initial," "introduce," "replace," "migrate," "extract," "architecture," "rewrite," "design," "split," "merge," "bridge," "proxy," "protocol," "abstraction"
- Introduces a new package, a new layer, or a new dependency boundary
- Breaking changes that reflect a deliberate architectural shift

### MAYBE — mark with `→ ○ REVIEW`
A commit might contain a decision but it's ambiguous from the message alone:

- Large refactors where the motivation is unclear
- Changes that touch many files but the commit message is thin
- Introduction of significant new dependencies
- Changes to core abstractions

### NOT ADR — leave unmarked
Everything else. Fixes, bumps, chores, style, small features, tests, docs, CI tweaks, version tags.

---

## Step 3: For each ADR-CANDIDATE, investigate deeply

For every commit marked `★ ADR-CANDIDATE`, do the following:

1. **Find the PR/issue.** Run:
   ```bash
   git log --oneline --all --grep="#<commit-hash-short>" 2>/dev/null
   git log <commit-hash>^..<commit-hash> --format="%B" | grep -oE '#[0-9]+' | head -5
   ```
   Also check the full commit body for references:
   ```bash
   git log <commit-hash> -1 --format="%B"
   ```

2. **If a PR or issue number is found**, note it. This is the richest ADR source.

3. **Read the diff summary** to understand the scope:
   ```bash
   git diff-tree --no-commit-id --stat <commit-hash>
   ```

4. **Produce a detailed entry** for this candidate with:
   - Commit hash and date
   - Author
   - Subject
   - What architectural decision this likely represents (1-2 sentences, your best inference)
   - What files/modules were affected (from the diff stat)
   - Linked issues/PRs (if found)
   - Key question: **"What was the alternative that was rejected?"** (If unknown, say so.)

---

## Step 4: Write the map file

Write everything to `GIT-ARCHAEOLOGY.md` in the current repo root.

### File structure:

```markdown
# Git Archaeology Map — <repo-name>

Generated: <date>
Total commits scanned: <N>
ADR candidates found: <N>
Commits needing review: <N>

---

## ADR Candidates (★)

<!-- One entry per ADR candidate, in chronological order -->

### ★ <commit-hash-short> — <date> — <author>
**Subject:** <commit subject>
**Decision:** <your 1-2 sentence inference of the architectural decision>
**Affected:** <files/modules from diff stat>
**Linked:** <issue/PR numbers if found>
**Rejected alternative:** <what else could they have done? your best inference>

---

### ★ <next one>

...

---

## Commits Needing Review (○)

<!-- Brief entries — these are MAYBEs that need a human to look closer -->

### ○ <commit-hash-short> — <date> — <author>
**Subject:** <commit subject>
**Reason for review:** <why it's ambiguous>

---

## Full Chronological Log

<!-- Every commit, in order. ADR candidates marked with → ★, maybes with → ○ -->

<commit-hash-short> <date> <author> <subject>
<commit-hash-short> <date> <author> <subject> → ★ ADR-CANDIDATE
<commit-hash-short> <date> <author> <subject>
<commit-hash-short> <date> <author> <subject> → ○ REVIEW
...
```

---

## Rules

- **Every commit must appear in the Full Chronological Log.** No summarization, no skipping.
- **No AI-generated slop.** Each inference in the ADR Candidates section must be specific to this repo. Do not use generic phrasing like "This decision improved maintainability." Name the actual tradeoff.
- **Be honest about uncertainty.** If the commit message is one word and there's no linked PR/issue, mark it as needing review — don't fabricate a decision.
- **If the repo has zero candidates**, say so clearly. An empty map is still a map.
- **Do not edit any files except `GIT-ARCHAEOLOGY.md`.**
- **When done, output:** "Done. `GIT-ARCHAEOLOGY.md` written with <N> ADR candidates out of <N> total commits. Next step: for each ★ candidate, trace the linked PR/issue discussion to extract context, decision, and tradeoffs for the actual ADR."
