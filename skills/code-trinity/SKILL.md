---
name: code-trinity
description: "Three-lens code audit, quality, and maintainability pipeline. Runs an adversarial bug-hunt (Leg 1), codebase intelligence analysis (Leg 2), and human-standards maintainability review (Leg 3) as a coordinated two-phase workflow with diff-level re-validation. Use when reviewing a codebase for bugs/vulnerabilities, enforcing code quality standards, refactoring for human readability, or any combination of audit+quality+cleanup. Trigger words: audit, review, quality, maintainability, clean code, bug hunt, trinity, code review, code audit, adversarial, refactor for readability, code quality tools, human standards code."
compatibility: "Requires: git, language-specific tools (install on-demand per references/codebase-intelligence.md), and test suite access. You use only reasoning + context for Leg 1. Internet for tool installation."
---

# Code Trinity — Three-Lens Codebase Review

## Overview

The Code Trinity is a **coordinated three-lens pipeline** that enforces three distinct quality dimensions on a codebase:

| Leg | Name | Your role | Method |
|-----|------|-----------|--------|
| **1** | **Adversarial Audit** | Find real bugs & vulnerabilities | Adversarial framing, false-positive aversion |
| **2** | **Codebase Intelligence** | Structural, complexity, dead code, risk, duplication, dependency, type, security, churn analysis | Real tools per language (knip, semgrep, vulture, etc.) |
| **3** | **Human Maintainability** | Ensure code is clean & readable | Clean code principles, SOLID, naming, safety-guarded refactoring |

The core innovation is the **coordination protocol**: you run a two-phase workflow with diff-level re-validation that catches regressions without full re-scans.

---

## Workflow: Two-Phase with Targeted Re-scan

```
PHASE 1: DISCOVERY (Read-only — no code is modified)
├── Leg 1: Adversarial Audit  ──→ Findings A (bugs, vulns, logic errors)
└── Leg 2: Codebase Intelligence ──→ Findings I (dead code, smells, tech debt)
      │
      ▼
  Merge, deduplicate, prioritize by severity
      │
      ▼
PHASE 2: REMEDIATION (Guarded — each fix verified)
└── For each finding (priority order):
      ├── Leg 3: Apply fix with clean code standards
      ├── Run test suite (or relevant subset)
      └── Diff re-scan with Legs 1 & 2  ◄── Key validation gate
            │
            ├── Clean → move to next finding
            └── Issue found → fix locally, re-verify
                  │
                  └── If cross-file/critical → escalate to full cycle
```

## Persistent State File

All findings and their status live in **`TRINITY-FINDINGS.md`** at the repo root (or `docs/TRINITY-FINDINGS.md` if a `docs/` directory exists). This file is your source of truth across the entire workflow — you write to it, read from it, and update it. It survives context rolls so you never lose track.

The file uses this structure:

```markdown
# Trinity Findings — repo-name

**Baseline**: `abc1234` — branch: `main` — tests: 214 passed, 0 failed
**Generated**: 2026-07-05
**Status**: remediation in progress (3/12 fixed, 9 remaining)

---

### 🔴 Blocker

#### [A-01] SQL injection in user search endpoint
- **Source**: Leg 1 (adversarial) + Leg 2 (semgrep)
- **File**: `src/routes/users.ts:45`
- **What**: Raw string interpolation in SQL query
- **Status**: `fixed` → `verified`
- **Fix commit**: `abc1235` — diff re-scan: clean

#### [I-03] Cyclic import between auth and session modules
- **Source**: Leg 2 (Boundary Atlas)
- **Files**: `src/auth/ → src/session/ → src/auth/`
- **What**: auth imports session imports auth creates initialization deadlock risk
- **Status**: `pending`

### 🟡 Concerning

#### [Q-07] Dead function `formatDate` in utils/date.ts
- **Source**: Leg 2 (knip)
- **File**: `src/utils/date.ts:88`
- **What**: Exported but no callers anywhere in project
- **Status**: `pending`
```

Each finding has an ID (`[A-01]`, `[I-03]`, `[Q-07]` — prefixed by leg), a status, and a paper trail. Update the file as you go.

---

### Phase 1 — Discovery (Read-only)

**Context**: Checkout the latest stable release branch (not mainline HEAD — maintainers reject findings against unreleased code). Capture the baseline: `git log --oneline -1` for commit hash, run test suite and record pass/fail. **Create or clear** `TRINITY-FINDINGS.md` in the repo root (or `docs/` if it exists).

**Step 1: Leg 1 — Adversarial Audit**
- Read and follow [references/adversarial-audit.md](references/adversarial-audit.md)
- Work through the codebase with the adversarial frame — self-critique every finding
- **Write each finding** to `TRINITY-FINDINGS.md` with ID `[A-N]`, file, lines, and reasoning
- **IMPORTANT**: Do NOT modify any files. Read-only.

**Step 2: Leg 2 — Codebase Intelligence**
- Read and follow [references/codebase-intelligence.md](references/codebase-intelligence.md)
- Detect the project language(s) and framework
- For each tool: check if it exists. If missing, install it (ask the user first). Then run it.
- Collect and categorize findings
- **Write each finding** to `TRINITY-FINDINGS.md` with ID `[I-N]`, file, tool, and output
- **IMPORTANT**: Do NOT modify any files. Read-only.

**Step 3: Merge and Prioritize**
- Re-read `TRINITY-FINDINGS.md` (it has all raw findings from both legs)
- Deduplicate across both legs (a bug found by audit AND flagged by semgrep = 1 finding, tag as `[both]`)
- Prioritize: Critical/Exploitable > Logic bug > Dead code > Code smell > Style
- Re-number findings by priority. Update the status block at the top

### Phase 2 — Remediation (Guarded)

**Step 4: Leg 3 — Human-Standard Fix Application**
- Read `TRINITY-FINDINGS.md` for the ordered list
- Read and follow [references/human-maintainability.md](references/human-maintainability.md)
- Process findings in priority order
- For each finding:
  1. Apply the **minimal correct fix** using clean code principles
  2. **Update the finding's status** in `TRINITY-FINDINGS.md` to `fixing`
  3. **Run the test suite** (or relevant subset) — all tests must pass
  4. **Diff re-scan**: Re-run Legs 1 & 2 on just the changed lines/files
     - Leg 1: "Did this fix introduce any new vulnerability? Be honest — a clean verdict is a win."
     - Leg 2: Re-run tools on the changed files only
  5. If diff re-scan is clean → update status to `fixed → verified`, write the commit hash, commit with a clear message
  6. If diff re-scan finds issues → fix them locally, re-verify, update status
  7. If diff re-scan finds **cross-file or critical issues** → update status to `escalated`, escalate to full cycle:
     - Re-run full Phase 1 on the entire codebase
     - Append new findings to the file
     - Process new findings in Phase 2
     - Guard against oscillation: if the same finding appears in two consecutive cycles, STOP and escalate to the user
  8. **Update the status block** at the top of the file after each change

**Convergence Guards**:
- Max 5 cycles total (1 initial + 4 re-scans)
- Same finding in two consecutive scans → escalate to human
- A fix that reverts a previous fix → flag for human review

---

## When to Run Which Legs

| Scenario | Run |
|----------|-----|
| Full codebase audit | All 3 legs, full pipeline |
| Bug/vulnerability sweep only | Leg 1 only |
| Quality/greenkeeping pass | Legs 2 → 3 only (discover issues with tools, fix with human standards) |
| After AI-generated code | All 3 legs (AI slop prevention) |
| Before handoff to humans | All 3 legs (the "decade-proof" pass) |
| Quick pre-commit review | Leg 2 only (fast intelligence scan) |
| Legacy code cleanup | Legs 2 → 3 (find smells then human-refactor) |

---

## Principles

1. **False positive aversion first**: You prefer missing a finding over reporting a wrong one. "No answer is better than a wrong answer."
2. **Intelligence is broad, but not deep**: Leg 2 maps structural health across 9 domains. Leg 1 goes deep on specific bugs. They are complementary, not redundant.
3. **Human standards for the long tail**: Code that passes all tests but is unreadable is still debt. A human should understand it in 10 years.
4. **Do no harm**: Every fix is test-verified and re-scanned. Never modify code in one leg without the others checking it.
5. **Progressive disclosure**: Read this SKILL.md first. Read the leg reference files only when executing that leg. Keep your context lean.

---

## Reference Files

| File | When to read |
|------|-------------|
| [references/adversarial-audit.md](references/adversarial-audit.md) | When running Leg 1 (Adversarial Audit) |
| [references/codebase-intelligence.md](references/codebase-intelligence.md) | When running Leg 2 (Codebase Intelligence) |
| [references/human-maintainability.md](references/human-maintainability.md) | When running Leg 3 (Human Maintainability fixes) |


