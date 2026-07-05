---
name: project-setup
description: "Sets up or resumes project workspaces following the LOOP methodology — pre-flight check for prior discussion, workspace directory selection in ~/.workspaces/, writing SPEC.md (Alzheimer's format) and PLAN-TODO.md, setting up a just-based dev environment (fmt/lint/check/test), verifying the pipeline, initial git commit, and establishing the write→fmt→check→test→commit loop. Use when asked to set up a workspace, bootstrap a project, init a new project, prepare the environment, resume work, or start the development loop. Always runs a pre-check to ensure the project has been discussed before proceeding."
compatibility: "Requires just (command runner) to be installed. Works with any language — Python/uv, TypeScript/npm, Rust/cargo, Go, etc. The agent determines the appropriate toolchain."
---

# Workspace Bootstrap

The LOOP methodology — a pre-flight → setup → write → fmt → check → test → commit cycle for project workspaces. This skill handles the full bootstrap sequence from workspace creation through initial commit, then establishes the iteration loop.

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
Phase 7: Enter the Loop (write → fmt → check → test → commit)
```

> **NOTE:** Not greenfield? If you're picking up an existing project or resuming work, run through the phases below and skip what's already in place — only fill in what's missing.

> **NOTE:** The phases below are the default path. Add additional phases as the project requires — the framework extends, it doesn't constrain.

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

The project always goes under `~/.workspaces/`.

1. **List the existing classification directories** — read `~/.workspaces/` and present whatever's there to the user.

2. **Ask the user** which directory to create the project under.

3. If the user wants a **new classification directory** that doesn't exist yet:
   - Show what's already there
   - Ask: "What should the new category be called?"
   - Create `<new-category>/` under `.workspaces/`

4. **Create the project directory:**
   ```
   ~/.workspaces/<category>/<project-name>/
   ```

5. `cd` into it. This is now the working directory for all subsequent phases.

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

Write a hybrid plan + todo document with:
- **Phases** broken into discrete tasks
- Each task has `[ ]` checkboxes for tracking progress
- A **progress bar** at the bottom showing completion per phase (e.g., `[###-------] 30%`)
- Phases ordered: environment → core → extensions → polish → documentation

Be detailed — this is also the execution plan, not just a checklist. Each phase needs context: what it accomplishes, what it depends on, and when it's done.

**Every phase must include a `[ ] Write tests for ...` checkbox.** Testing is not a separate phase — it lives alongside every implementation task, every time.

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

`just` is the command runner (replaces `make`). It **may not be in training data**, so orient yourself first.

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

Example `justfile` for a Python project:

```makefile
fmt:
    uv run ruff format src/ tests/

lint:
    uv run ruff check src/ tests/

types:
    uv run mypy src/

security:
    uv run bandit -r src/ -x tests/

audit:
    uv audit

check: fmt lint types security audit

test:
    uv run pytest

ci: check test
```

Example `justfile` for a TypeScript project:

```makefile
fmt:
    npx prettier --write src/

lint:
    npx eslint src/

types:
    npx tsc --noEmit

security:
    npm audit

audit:
    npm audit

check: fmt lint types security audit

test:
    npx vitest run

ci: check test
```

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

These are **not required** for every project. Review the list with the user and confirm which ones to add — don't decide alone.

- **Smoke test** — after build, run `<tool> --version && <tool> --help` to catch broken entry points
- **Dependency freeze** — commit lockfile after every `uv add` for reproducible installs
- **AST grep** — structural code search, add to `check`
- **Changelog workflow** — maintain `CHANGELOG.md` as part of the commit cycle
- **Pre-commit hooks** — run `just check` before every commit, block on failure
- **Secrets scanning** — `gitleaks` / `trufflehog` for accidentally committed credentials
- **Domain-specific security** — `tfsec`/`checkov` for Terraform, `trivy` for Docker, `trufflehog` for secrets, etc.
- **`just clean`** — nuke build artifacts, `__pycache__`, `node_modules`, `target/`, etc.
- **`just setup`** — single command from clone to dev-ready: install deps, copy config, create dirs
- **`just outdated`** — `uv outdated` / `npm outdated` to track dependency lag
- **Spell check** — `codespell` / `cspell` to catch typos in code and docs
- **Dead code detection** — `vulture` (Python), `ts-prune` (TypeScript), `unused` (Rust)
- **`just release`** — version bump + changelog + git tag + publish in one recipe

---

## Phase 5: Verify the Pipeline

Run each step and confirm it passes:

```bash
just fmt          # Should format cleanly
just check        # Should pass — lint + types + security all green
just test         # Should run (even if 0 tests collected)
```

If any step fails, fix it before proceeding. Common fixes:
- Missing `__init__.py` files for Python packages
- Unused imports in scaffolded files
- Missing type annotations

---

## Phase 6: Initial Git Commit

```bash
git init
git add -A
git commit -m "Initial — <project-name>: <brief description>"
```

---

## Phase 7: Enter the Loop

```
write → just [fmt lint check audit smoke test ...] → extras [outside just] → read & update docs → commit → repeat
```

### The Iteration Cycle

1. **Read & update docs** — check current tasks in PLAN-TODO.md, what's next, what changed. Update SPEC.md if scope or decisions shifted.
2. **Write** — create or edit source files
3. **Run checks** — `just fmt`, `just lint`, `just typecheck`, `just security`, `just audit`, or whatever the project's justfile defines. This step covers all static analysis.
4. **Test** — `just test` or `just test-cov`
5. **Update docs** — check off done tasks in PLAN-TODO.md, update progress bar, adjust remaining tasks.
6. **Commit** — only when all checks pass and docs are current

### If `just check` Fails

- Run the linter's auto-fix if available:
  ```bash
  # Python
  uv run ruff check --fix src/ tests/
  ```
  ```bash
  # TypeScript
  npx eslint --fix src/
  ```
- Re-format after fixes: `just fmt`
- Run `just check` again
- Fix remaining issues manually, repeat

### Important Rules

- **Never skip `just fmt && just check`**, even for "small changes." It catches import sorting, unused imports, type errors, and security flags that pile up if deferred.
- **Don't use the package manager directly** for project tasks — always go through `just` recipes. This keeps the workflow consistent and documented.
- **Docs stay current** — PLAN-TODO.md gets updated every cycle (check off done, adjust remaining). SPEC.md gets updated when scope or decisions change. These are living documents, not bootstrap artifacts.
- **Commit early, commit often** — each commit should represent a coherent unit of work with all checks passing.

---

## Resources

### references/
- [spec-guide.md](references/spec-guide.md) — The Alzheimer's spec format. Read this before writing SPEC.md (Phase 2). This is the polished version of the original beloved-prompts.md.
