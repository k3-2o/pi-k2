---
name: project-setup
description: "Bootstrap or resume project workspaces — pre-flight discussion check, workspace directory selection in ~/.workspaces/, SPEC.md (Alzheimer's format), PLAN-TODO.md, just-based dev environment with fmt/lint/check/test pipeline, verify pipeline, initial git commit, then debrief the LOOP iteration cycle. Use when asked to set up a workspace, bootstrap a project, init a new project, prepare the environment, or resume work. Always runs a pre-check first."
compatibility: "Requires just (command runner). If missing, install via system package manager or ask user. Works with any language — Python/uv, TypeScript/npm, Rust/cargo, Go, etc."
---

# Workspace Bootstrap

The LOOP methodology — a pre-flight → setup → write → fmt → check → test → commit cycle for project workspaces. This skill handles the full bootstrap sequence from workspace creation through initial commit, with a verification pass and a debrief on the iteration methodology.

## The Workflow

```
Phase 0: Pre-check
    ↓ (not discussed → STOP)
Phase 1: Workspace Location
Phase 2: SPEC.md
Phase 3: PLAN-TODO.md
Phase 4: Environment Setup (just)
Phase 5: Pipeline Verification
Phase 6: Git Init
    ↓
Phase 7: Verify Setup
```

> **NOTE:** The phases below are the default path. Add additional phases as the project requires — the framework extends, it doesn't constrain.

---

## Resuming an Existing Project

If you're picking up an existing project or resuming work, don't start from Phase 0. Run this decision tree:

1. **Is there a SPEC.md?** — Check `.vscode/SPEC.md` (or project root). If missing, go to Phase 2.
2. **Is there a PLAN-TODO.md?** — Check `.vscode/PLAN-TODO.md`. If missing, go to Phase 3.
3. **Is there a justfile?** — Check project root. If missing, go to Phase 4.
4. **Is the pipeline green?** — Run `just check && just test`. If failing, go to Phase 5.
5. **Is git initialized with a clean state?** — If not, go to Phase 6.
6. **All present and green?** — Skip to Phase 7 (Verify Setup + debrief).

Fill gaps only where they exist. Don't regenerate what's already there — verify and supplement.

---

## Phase 0: Pre-check — Have We Discussed This?

**Run this before any action.** Do not skip.

1. Look through the conversation history. Has the user described what they want to build, the problem they're solving, or given enough context to write a detailed SPEC.md?
2. If there is **NO prior discussion** or the discussion is **too vague** to produce a detailed spec and plan, **stop and state clearly**:

   > "We haven't discussed this project enough to write a proper SPEC and PLAN-TODO. Before I bootstrap the workspace, I need to understand: what are we building? What problem are we solving? What technology stack? Key requirements?"

3. If there is **sufficient context**, proceed to Phase 1.
4. If there is **partial context** (discussed some aspects but not others), flag what's missing before proceeding — ask specific clarifying questions.

> **This phase is non-negotiable.** Even if the user explicitly says "set up a workspace" or "bootstrap the project", the pre-check runs first.

---

## Phase 1: Choose Workspace Location

Ask the user where they want the project created.

1. **Check if `~/.workspaces/` exists.**
   - If it does, list whatever classification directories are already there and ask which one to use (or whether to create a new category).
   - If it doesn't, skip it — just ask the user for a path.

2. **Ask the user** where the project directory should live. Accept whatever they give you.

3. **Create the project directory** at the chosen path and `cd` into it. This is now the working directory for all subsequent phases.

---

## Phase 2: Write SPEC.md

1. **Read [references/spec-guide.md](references/spec-guide.md)** — the Alzheimer's spec format guide. This is required reading before writing the spec.

2. Write `SPEC.md` following the guide. Capture:
   - Project overview and goals
   - Every architectural decision and trade-off
   - File-by-file breakdown — what each file does, why it exists
   - Dependencies and why each was chosen
   - The "why" behind every choice
   - Risks, unknowns, future concerns
   - Test strategy and edge cases

3. Create `.vscode/` directory:
   ```bash
   mkdir -p .vscode
   mv SPEC.md .vscode/SPEC.md
   ```

---

## Phase 3: Write PLAN-TODO.md

Write a detailed todo with plan structure:
- **Phases** broken into discrete tasks, each with enough context to understand what it accomplishes, what it depends on, and when it's done
- Each task gets a `[ ]` checkbox — checked off in the loop as work completes
- Phases ordered logically for the project (typically: environment → core → extensions → polish → documentation)

This is both the plan and the todo. It tells you what to do and tracks what's done.

**Every implementation task must have a corresponding `[ ] Write tests for ...` checkbox.** Testing is not a separate phase — it lives alongside the implementation it covers.

Tests must exercise real logic — assert on actual behavior, edge cases, and failure paths. Never write test theater: tests that only prove a function was called, assert on trivially true conditions, or exist solely to pass without questioning whether the code works.

> **NOTE:** Use standard remote repo and project structure, separation of concerns, single-responsibility per file, and meaningful naming — how much of this applies depends on the project's weight, state, and calibre. Intelligently decide what fits. Reach for patterns you already know: package-by-layer or package-by-feature, clean or hexagonal architecture, repository and service layer patterns; SOLID, GRASP, DRY, YAGNI, KISS, Law of Demeter, command-query separation, composition over inheritance; PascalCase, camelCase, snake_case, kebab-case; TDD or BDD, arrange-act-assert, given-when-then, red-green-refactor; keep cyclomatic complexity in check, cohesion high and coupling low, single source of truth, fail fast, least astonishment, immutability, idempotency, boy scout rule — and whatever else from the breadth of your knowledge fits the project.

```bash
mv PLAN-TODO.md .vscode/PLAN-TODO.md
```

After writing both SPEC.md and PLAN-TODO.md, add `.vscode/` to `.gitignore`:

```bash
echo ".vscode/" >> .gitignore
```

---

## Phase 4: Set Up the Dev Environment

Before proceeding, verify the tooling is available:

```bash
bash scripts/preflight.sh   # Checks for just, git
```

If anything is missing, install it or ask the user before continuing.

`just` is the command runner (replaces `make`). Orient yourself if needed:

### 4a — Orient on `just`

```bash
just --help          # Understand the CLI interface
just --man           # Full manual
```

Pay attention to:
- Recipe syntax (how to define and run recipes)
- Dependencies between recipes
- How to set variables
- How to run shell commands in recipes

### 4b — Determine the Project Type

Based on what you know about the project (from Phase 0 discussion), determine:
- **Language:** Python, TypeScript, Rust, Go, Terraform, etc.
- **Package manager:** uv, npm, cargo, go mod, etc.
- **Test framework:** pytest, vitest, cargo test, go test, etc.
- **Formatter:** ruff, prettier, rustfmt, gofmt, etc.
- **Linter:** ruff, eslint, clippy, golangci-lint, etc.
- **Type checker:** mypy, tsc, etc.
- **Security scanner:** bandit, npm audit, cargo audit, etc.

When in doubt, ask the user.

### 4c — Initialize the Project

```bash
# Python with uv
uv init --app --python 3.12

# TypeScript with npm
npm init -y

# Rust
cargo init

# Go
go mod init <module-name>
```

### 4d — Install Dev Dependencies

```bash
# Python example
uv add --dev ruff mypy bandit pytest pytest-cov

# TypeScript example
npm install --save-dev eslint prettier typescript vitest
```

### 4e — Write the `justfile`

Create a `justfile` in the project root with these recipes:

| Recipe | What it does |
|--------|-------------|
| `fmt` | Format all source files |
| `lint` | Lint all source files |
| `audit` | Check dependencies for known vulnerabilities |
| `check` | fmt + lint + type checks + security + audit (all static analysis) |
| `test` | Run the test suite |
| `ci` | Full pipeline: fmt → lint → typecheck → security → audit → test |

See [references/justfile-templates.md](references/justfile-templates.md) for starter templates by language (Python, TypeScript, Rust, Go). Adapt to the project's specific toolchain — these are starting points, not prescriptions.

### 4f — Write `.gitignore`

Write a `.gitignore` appropriate for the project language. Include common patterns:

```
# Python
__pycache__/
*.pyc
.venv/
*.egg-info/
dist/

# TypeScript
node_modules/
dist/
*.tsbuildinfo

# Rust
target/

# Go
vendor/

# General
.env
*.local
```

---

### 4g — Optional Extras (per-project)

These are **not required** for every project. Review with the user and confirm which to add — don't decide alone.

**Pipeline additions** (run as part of `just check` or as standalone recipes):
- **AST grep** — structural code search
- **Spell check** — `codespell` / `cspell` for typos in code and docs
- **Dead code detection** — `vulture` (Python), `ts-prune` (TypeScript), `unused` (Rust)

**Justfile additions** (new recipes):
- **Smoke test** — `<tool> --version && <tool> --help` to catch broken entry points
- **`just clean`** — nuke build artifacts, `__pycache__`, `node_modules`, `target/`, etc.
- **`just setup`** — single command from clone to dev-ready: install deps, copy config, create dirs
- **`just outdated`** — track dependency lag (`uv outdated`, `npm outdated`)
- **`just release`** — version bump + changelog + git tag + publish

**Dependency & security:**
- **Dependency freeze** — commit lockfile after every package add for reproducible installs
- **Secrets scanning** — `gitleaks` / `trufflehog` for accidentally committed credentials
- **Domain-specific security** — `tfsec`/`checkov` (Terraform), `trivy` (Docker), etc.

**Process:**
- **Changelog workflow** — maintain `CHANGELOG.md` as part of the commit cycle
- **Pre-commit hooks** — run `just check` before every commit, block on failure
- **AGENT.md** — behavioral instructions for agents working on the project (tooling rules, code conventions, test rules, workflow rules, boundaries). Read [references/agent-md-guide.md](references/agent-md-guide.md) before writing. Place at project root, add to `.gitignore`.

---

## Phase 5: Verify the Pipeline

Run each step and confirm it passes:

```bash
just fmt          # Should format cleanly
just check        # Should pass — lint + types + security all green
just test         # Should run (even if 0 tests collected)
```

If any step fails, fix it before proceeding. Common issues by language:
- **Python** — missing `__init__.py` files, unused imports, missing type annotations
- **TypeScript** — missing type exports, implicit `any`, unused variables
- **Rust** — unused `#[allow(dead_code)]`, missing trait imports, lifetime annotations
- **Go** — missing imports, unused variables, incorrect module path in `go.mod`
- **General** — formatter vs. linter disagreement — always run `just fmt` first, then `just check`

---

## Phase 6: Initial Git Commit

```bash
git init
git add -A
git commit -m "Initial — <project-name>: <brief description>"
```

---

## Phase 7: Verify Setup

Confirm everything from Phases 0–6 landed correctly:

1. **Workspace exists** — `~/.workspaces/<category>/<project>/` is the cwd
2. **SPEC.md** — present at `.vscode/SPEC.md`, covers overview, goals, architecture, file breakdown, dependencies, testing strategy, risks
3. **PLAN-TODO.md** — present at `.vscode/PLAN-TODO.md`, has phased tasks with checkboxes and a progress bar
4. **`.gitignore`** — present, includes `.vscode/` and language-specific patterns
5. **`justfile`** — present with at minimum: `fmt`, `lint`, `check`, `test`, `ci` recipes
6. **Pipeline green** — `just fmt`, `just check`, and `just test` all pass
7. **Git repo** — initialized with at least one commit (the initial commit)

If anything is missing or broken, fix it now. Do not proceed until every item above is confirmed.

---

### Debrief: Explain the LOOP

Once verification passes, explain the iteration cycle **in the chat window** — not in a file. Walk the user through:

```
write → just [fmt lint check audit smoke test ...] → extras [outside just] → read & update docs → commit → repeat
```

For each step, explain:
- **What it does** and why it's in the cycle
- **Which `just` recipes** apply (the project's specific set — not a generic list)
- **What happens on failure** — auto-fix where available, manual fix where not, re-run
- **Docs update** — PLAN-TODO.md checkboxes get ticked every cycle, SPEC.md updated when scope or decisions change
- **Commit discipline** — only commit when all checks pass and docs are current

### Confirm with the User

After the explanation, ask:

> "Is that exactly what's supposed to happen with this project's loop? Anything to add, remove, or rearrange?"

Wait for their response. If they want changes, adjust and re-confirm. Once confirmed, **the setup is complete.** The skill ends here — no implementation starts.

---

## Resources

### references/
- [spec-guide.md](references/spec-guide.md) — The Alzheimer's spec format. Read this before writing SPEC.md (Phase 2).
- [justfile-templates.md](references/justfile-templates.md) — Starter justfile templates by language (Python, TypeScript, Rust, Go).
- [agent-md-guide.md](references/agent-md-guide.md) — What to write in AGENT.md and how to structure it. Read before writing AGENT.md if selected as an optional extra.

### scripts/
- [preflight.sh](scripts/preflight.sh) — Verifies `just` and `git` are available. Run at the start of Phase 4.
