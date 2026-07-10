---
name: adversarial-audit
description: "Two-lens code audit with advisory tool recommendations. Runs an adversarial bug-hunt (Leg 1) to find real bugs and vulnerabilities, then applies human-standards fixes (Leg 2) with diff-level re-validation. Optionally recommends codebase intelligence tools based on project size for additional coverage. Use when reviewing a codebase for bugs/vulnerabilities, enforcing code quality standards, refactoring for readability, or cleaning up after AI-generated code."
compatibility: "Requires: git and test suite access. Leg 1 uses reasoning + context only. Optional intelligence tools may need installation — ask user first."
---

# Adversarial Audit

## Overview

A **two-lens pipeline with an optional third**: adversarial audit finds real problems, human maintainability fixes them with clean code standards, and codebase intelligence tools are recommended at the end for additional fortification.

| Leg | Name | Your role | Method |
|-----|------|-----------|--------|
| **1** | **Adversarial Audit** | Find real bugs & vulnerabilities | Adversarial framing, false-positive aversion |
| **2** | **Human Maintainability** | Fix with clean code standards | Clean code principles, SOLID, naming, safety-guarded refactoring |
| **3** | **Codebase Intelligence** (advisory) | Recommend tools based on project size | Reference catalog, user decides |

The core innovation is the **coordination protocol**: you run a two-phase workflow with diff-level re-validation that catches regressions without full re-scans.

---

## Workflow: Two-Phase with Targeted Re-scan

```
PHASE 1: DISCOVERY (Read-only — no code is modified)
├── Leg 1: Adversarial Audit  ──→ Findings (bugs, vulns, logic errors)
└── Prioritize findings by severity
      │
      ▼
PHASE 2: REMEDIATION (Guarded — each fix verified)
└── For each finding (priority order):
      ├── Leg 2: Apply fix with clean code standards
      ├── Run test suite (or relevant subset)
      └── Diff re-scan (adversarial review on changed files)
            │
            ├── Clean → move to next finding
            └── Issue found → fix locally, re-verify
                  │
                  └── If cross-file/critical → escalate to full cycle
      │
      ▼
PHASE 3: ADVISORY (After remediation — not part of the cycle)
└── Recommend codebase intelligence tools based on project size
    (For the user to consider — they decide whether to use them)
```

## Persistent State File

All findings and their status live in **`AUDIT-FINDINGS.md`** at the repo root. Add it to `.gitignore` — it's a working artifact for the audit session, not project source.

The file uses this structure:

```markdown
# Audit Findings — repo-name

**Baseline**: `abc1234` — tests: 214 passed, 0 failed
**Status**: remediation in progress (3/12 fixed, 9 remaining)

---

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
```

Each finding has an ID, a status, and a paper trail. IDs are `[A-N]` for adversarial, `[I-N]` for intelligence tool findings (if run). Update as you go.

---

### Phase 1 — Discovery (Read-only)

**Context**: Capture the baseline — `git log --oneline -1` for commit hash, run test suite and record pass/fail. **Create or clear** `AUDIT-FINDINGS.md` in the repo root. Add `AUDIT-FINDINGS.md` to `.gitignore`.

**Step 1: Leg 1 — Adversarial Audit**
- Read and follow [references/adversarial-audit.md](references/adversarial-audit.md)
- Work through the codebase with the adversarial frame — self-critique every finding
- **Write each finding** to `AUDIT-FINDINGS.md` with ID `[A-N]`, file, lines, and reasoning
- **IMPORTANT**: Do NOT modify any files. Read-only.

**Step 2: Prioritize Findings**
- Re-read `AUDIT-FINDINGS.md`
- Prioritize: Critical/Exploitable > Logic bug > Dead code > Code smell > Style
- Re-number findings by priority. Update the status block at the top

### Phase 2 — Remediation (Guarded)

**Step 3: Leg 2 — Human-Standard Fix Application**
- Read `AUDIT-FINDINGS.md` for the ordered list
- Read and follow [references/human-maintainability.md](references/human-maintainability.md)
- Process findings in priority order
- For each finding:
  1. Apply the **minimal correct fix** using clean code principles
  2. **Update the finding's status** in `AUDIT-FINDINGS.md` to `fixing`
  3. **Run the test suite** (or relevant subset) — all tests must pass
  4. **Diff re-scan**: Re-run adversarial review on just the changed lines/files
  5. If diff re-scan is clean → update status to `fixed → verified`, write the commit hash, commit with a clear message
  6. If diff re-scan finds issues → fix them locally, re-verify, update status
  7. If diff re-scan finds **cross-file or critical issues** → update status to `escalated`, escalate to full cycle:
     - Re-run full Phase 1 on the entire codebase
     - Append new findings to the file
     - Process new findings in Phase 2
  8. **Update the status block** at the top of the file after each change

**Step 4: Advise on Codebase Intelligence Tools**
- Assess the project: language, framework, approximate size (lines of code)
- Read [references/codebase-intelligence.md](references/codebase-intelligence.md) for tool options matching the project's language and size
- List the recommended tools with what they catch. The audit is complete — the user decides whether to run them later.

**Convergence Guards**:
- Max 5 cycles total (1 initial + 4 re-scans)
- Same finding in two consecutive scans → escalate to human
- A fix that reverts a previous fix → flag for human review

---

## When to Run Which Legs

| Scenario | Run |
|----------|-----|
| Full audit / after AI code / before handoff | Leg 1 → Leg 2, then advise on intelligence tools |
| Bug/vulnerability sweep only | Leg 1 only |
| Quick pre-commit review | Leg 1 only |
| Legacy code cleanup (smells, not bugs) | Leg 2, then advise on intelligence tools |

---

## Reference Files

| File | When to read |
|------|-------------|
| [references/adversarial-audit.md](references/adversarial-audit.md) | Phase 1, Step 1 (Adversarial Audit) |
| [references/human-maintainability.md](references/human-maintainability.md) | Phase 2, Step 3 (Fix application) |
| [references/codebase-intelligence.md](references/codebase-intelligence.md) | Phase 2, Step 4 (Advisory tool recommendations) |


