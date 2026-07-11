---
name: adversarial-audit
description: "Three-leg code audit with gated procedures. Leg 1 runs an adversarial forensic read (window-by-window, 9 axes, advance-gate, dismissal review, refinement pass) to find bugs and logic errors. Leg 2 applies clean minimal fixes through a 7-phase gated fix procedure (root-cause gate, classification gate, test-output gate, self-review gate). Leg 3 (advisory) recommends codebase intelligence tools based on project size. Use when: reviewing a codebase for bugs and vulnerabilities, enforcing code quality standards, cleaning up AI-generated code, or refactoring for long-term maintainability."
compatibility: "Requires: git and test suite access. Leg 1 uses reasoning + windowed read only. Leg 2 requires write access. Leg 3 (optional) may need tool installation — ask user first."
---

# Adversarial Audit

## Overview

A **three-leg pipeline**: adversarial forensic audit finds bugs through obsessive line-by-line interrogation; human-maintainability remediation fixes them through a gated anti-slop procedure; codebase intelligence tools are recommended at the end for complementary mechanical coverage.

| Leg | Name | Your role | Method |
|-----|------|-----------|--------|
| **1** | **Adversarial Audit** | Find bugs, logic errors, and vulnerabilities | Windowed forensic reading, 9 interrogation axes, advance-gate per window, dismissal review per file, refinement pass with 4 concrete questions, completion accounting |
| **2** | **Human Maintainability** | Fix each finding with minimal, reviewable, future-proof code | Rule Zero (read before write), 5 safety doctrine gates, 7-phase fix procedure (root cause → classify → read → write → verify → self-review → diff re-scan), clean code standard scoped to diff, 10-year test, completion accounting |
| **3** | **Codebase Intelligence** (advisory) | Recommend tools based on language and project size | Reference catalog, user decides whether to run them |

This document is the orchestration layer. Each leg has its own reference file. Read the reference at the start of that leg, follow it exactly, and return here for the next step.

---

## Workflow: Three-Phase with Gated Procedures

```
PHASE 0: ORIENTATION (Map first — no reading yet)
└── Build the file inventory and connection map
      │
      ▼
PHASE 1: DISCOVERY (Read-only — no code is modified)
├── Leg 1: Adversarial Audit ──→ Findings (bugs, vulns, logic errors)
│    ├── Per-window: 9 axes + advance-gate
│    ├── Per-file: dismissal review
│    └── Per-finding: attack step + refinement pass + empirical check
└── Prioritize findings by severity
      │
      ▼
PHASE 2: REMEDIATION (Gated — each fix verified before the next)
└── For each finding (priority order):
      ├── Leg 2: Apply fix through 7-phase procedure
      │    ├── Phase 1: Understand (root cause gate)
      │    ├── Phase 2: Read (Rule Zero applied)
      │    ├── Phase 3: Write (minimal-fix gate)
      │    ├── Phase 4: Verify (test output gate)
      │    ├── Phase 5: Self-review (diff re-read gate)
      │    ├── Phase 6: Commit (one concern, honest message)
      │    └── Phase 7: Diff re-scan (adversarial review on changed lines)
      ├── Clean → move to next finding
      └── Issue found → fix locally, re-verify
            │
            └── If cross-file/critical → escalate to full cycle
                  └── Re-run full Phase 1, append findings, re-enter Phase 2
      │
      ▼
PHASE 3: ADVISORY (After remediation — not part of the cycle)
└── Recommend codebase intelligence tools based on project size
    (For the user to consider — they decide whether to use them)
      │
      ▼
COMPLETION ACCOUNTING (No gaps — every file, every finding, every thread)
└── Reconcile against Phase 0 inventory
    ├── Every file audited in full
    ├── Every finding fixed, escalated, or confirmed invalid
    └── Every cross-file thread traced or dismissed with reason
```

---

## Persistent State File

All findings, the Phase 0 inventory, and the completion accounting live in **`AUDIT-FINDINGS.md`** at the repo root. Add it to `.gitignore` — it is a working artifact for the audit session, not project source.

The file uses this structure:

```markdown
# Audit Findings — repo-name

**Baseline**: `abc1234` — tests: 214 passed, 0 failed
**Status**: remediation in progress (3/12 fixed, 9 remaining)
**Orientation**: 14 files inventoried, 23 cross-file connections mapped

---

## Phase 0 — Orientation Inventory

### File inventory
- `src/routes/users.ts` — user management endpoints
- `src/routes/auth.ts` — authentication endpoints
- `src/utils/date.ts` — date formatting utilities
- ... (every file in the project, one line each)

### Cross-file connections
- `users.ts:45` → `auth.ts:22` — calls `checkPermission()` with user role
- `db.ts:12` → used by 8 files, shared connection pool
- ... (every cross-file thread identified)

---

## Phase 1 — Findings

### 🔴 Blocker

#### [A-01] SQL injection in user search endpoint
- **Source**: Leg 1 (adversarial)
- **File**: `src/routes/users.ts:45`
- **What**: Raw string interpolation in SQL query
- **Status**: `fixed → verified` — commit `abc1235`, diff re-scan clean

### 🟡 Concerning

#### [A-05] Dead function `formatDate` in utils/date.ts
- **File**: `src/utils/date.ts:88`
- **What**: Exported but no callers anywhere in project
- **Status**: `pending`

---

## Phase 3 — Completion Accounting

### File reconciliation
- 14/14 files audited in full (window-by-window, all 9 axes, dismissal review)
- 0 files skipped, 0 files partially audited

### Finding reconciliation
- 12/12 findings processed: 8 fixed → verified, 2 escalated to human, 2 confirmed invalid

### Cross-file thread reconciliation
- 23/23 threads traced (21 contracts confirmed, 2 escalated)
- 0 threads abandoned

### Dismissal review reconciliation
- 34 candidates raised across all files
- 34 dismissed with reason (each reason documented)
- 0 candidates missing from final accounting
```

Each finding has an ID and a status. IDs are `[A-N]` for adversarial, `[I-N]` for intelligence tool findings (if run). Update as you go.

---

### Phase 0 — Orientation

**Before reading any file, build the map.** Open and follow [references/adversarial-audit.md](references/adversarial-audit.md) — read the Phase 0 section, list every file in the project, name each file's responsibility in one line, and map the cross-file connections (what imports what, what calls what, what state crosses boundaries). Every file goes on the inventory. There is no scoping, no "out of scope," no "I'll skim it later." If it is code in the project, it gets the full treatment.

Add the inventory and connection map to `AUDIT-FINDINGS.md` under a `## Phase 0 — Orientation Inventory` section. Do not begin Phase 1 until the inventory is complete and written down. The inventory is the artifact against which completion will be reconciled.

### Phase 1 — Discovery (Read-only)

**Context**: Capture the baseline — `git log --oneline -1` for commit hash, run the test suite and record pass/fail. Add the baseline to `AUDIT-FINDINGS.md`.

**Step 1: Leg 1 — Adversarial Audit**
- Read and follow [references/adversarial-audit.md](references/adversarial-audit.md) in full — the opening, Rule Zero, the bias counter-table, the 9 axes, the advance-gate, the dismissal review, the attack step, the refinement pass, the empirical check, and the completion accounting.
- Work through every file in the inventory, window by window, applying all 9 axes per window.
- Execute the advance-gate before advancing each window: state what you verified.
- Execute the dismissal review at the end of each file: list everything you considered and dismissed, with reason.
- Attack every candidate through Step 2, then write each surviving finding to `AUDIT-FINDINGS.md` with ID `[A-N]`, file, lines, and reasoning.
- Run the refinement pass on every finding: answer the four concrete questions (is the line real? is the type real? does the precondition hold? does the test exist?).
- Run the empirical check: try to demonstrate before marking theoretical.
- **IMPORTANT**: Do NOT modify any files. Read-only.

**Step 2: Prioritize Findings**
- Re-read `AUDIT-FINDINGS.md`.
- Prioritize: Critical/Exploitable > Logic bug > Dead code > Code smell > Style.
- Re-number findings by priority. Update the status block at the top.

### Phase 2 — Remediation (Gated)

**Step 3: Leg 2 — Fix Application**
- Read `AUDIT-FINDINGS.md` for the ordered list of findings.
- Read and follow [references/human-maintainability.md](references/human-maintainability.md) in full — the opening, Rule Zero, the 5 safety doctrine gates, the 7-phase fix procedure, the clean code standard, the fix decisions table, the speed-vs-caution guidance, the 10-year test, and the completion accounting.
- Process findings in priority order. Every finding gets the full 7-phase procedure. No finding is shortchanged, no finding is skipped.
- For each finding:
  1. **Phase 1 — Understand**: State the root cause. If you cannot, you do not understand the finding — read more before writing.
  2. **Phase 2 — Classify**: Behavior, structure, or both. If both, two commits (behavior first).
  3. **Phase 3 — Read**: Apply Rule Zero — read the function, its callers, its state, its tests.
  4. **Phase 4 — Write**: Apply the minimal fix. Every line justifies itself against the finding.
  5. **Phase 5 — Verify**: Run the test suite. Capture the output. For behavior changes, add a test that catches the original bug.
  6. **Phase 6 — Self-review**: Re-read the diff. State what each hunk does and why it's there. Every hunk traces to the finding.
  7. **Phase 7 — Diff re-scan**: Re-run the adversarial frame on the changed lines.
- **Update the finding's status** in `AUDIT-FINDINGS.md` after each finding.
- If the diff re-scan is clean → update status to `fixed → verified`, write the commit hash, commit with a clear message.
- If the diff re-scan finds issues → fix locally, re-verify, re-scan.
- If the diff re-scan finds **cross-file or critical issues** → update status to `escalated`, escalate to full cycle:
  - Re-run full Phase 1 on the entire codebase
  - Append new findings to the file
  - Process new findings in Phase 2
- **Update the status block** at the top of the file after each change.

**Convergence Guards**:
- Max 5 cycles total (1 initial + 4 re-scans)
- Same finding in two consecutive scans → escalate to human
- A fix that reverts a previous fix → flag for human review

### Phase 3 — Advisory (After Remediation)

**Step 4: Advise on Codebase Intelligence Tools**
- Assess the project: language, framework, approximate size (lines of code).
- Read [references/codebase-intelligence.md](references/codebase-intelligence.md) for tool options matching the project's language and size.
- List the recommended tools with what each catches and why they are proportionate for this codebase's size. The audit is complete — the user decides whether to run them later.

### Completion Accounting (Before the audit is declared done)

Reconcile against the Phase 0 inventory. Add the reconciliation to `AUDIT-FINDINGS.md` under a `## Phase 3 — Completion Accounting` section:

- **Every file**: audited in full (window-by-window, all 9 axes, advance-gate, dismissal review). Any file not fully audited means the audit is incomplete — return and audit it.
- **Every finding**: fixed (with commit hash and verification evidence), escalated to human (with reason), or confirmed invalid (with reason). No "skipped" findings.
- **Every cross-file thread from the Phase 0 map**: traced to where the contract is established, or dismissed with reason. No abandoned threads.
- **Every candidate from the dismissal reviews**: confirmed dismissed with reason, or reinstated. None lost between the dismissal review and the final report.

If the accounting reveals a gap — a file, finding, thread, or candidate unaccounted for — the audit is not complete. Return to the gap, apply the established procedure, and account again. Report only when the accounting balances: every file covered, every finding resolved, every thread accounted for. A report issued without a balanced accounting is a report built on gaps you chose not to see.

---

## When to Run Which Legs

| Scenario | Run |
|----------|-----|
| Full audit / after AI code / before handoff | Phase 0 → Leg 1 → Leg 2 → Leg 3 (advisory) → Completion Accounting |
| Bug/vulnerability sweep only | Phase 0 → Leg 1 only → Completion Accounting (file + thread reconciliation only) |
| Quick pre-commit review | Phase 0 → Leg 1 only (targeted files) → Completion Accounting |
| Legacy code cleanup (smells, not bugs) | Phase 0 → Leg 2 only (start with known smells or run Leg 1 on targeted files first) → Completion Accounting |
| After AI-generated code | Phase 0 → Leg 1 → Leg 2 → Leg 3 (advisory) → Completion Accounting |

---

## Reference Files

| File | When to read |
|------|-------------|
| [references/adversarial-audit.md](references/adversarial-audit.md) | Phase 0 (Orientation) and Phase 1, Step 1 (Adversarial Audit) — read the full file at the start of the leg, re-read individual sections as needed |
| [references/human-maintainability.md](references/human-maintainability.md) | Phase 2, Step 3 (Fix application) — read the full file before processing findings |
| [references/codebase-intelligence.md](references/codebase-intelligence.md) | Phase 3 (Advisory tool recommendations) — consult for tool options matching language and size |
