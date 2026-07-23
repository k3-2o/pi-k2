# AGENT.md Writing Guide

AGENT.md is a concise set of behavioral instructions for AI agents working on the project. It tells the agent *how to work here* — not what the project is (that's SPEC.md), not what to do next (that's PLAN-TODO.md), but the rules of engagement.

## What AGENT.md Is

- **Instructions, not documentation.** Imperative, direct, specific. Not "the project uses just" — "always use `just` recipes, never the package manager directly."
- **Thin and stable.** Write it once at setup. Update only when conventions change. It does not track progress — that's PLAN-TODO.md's job.
- **Supplementary to SPEC.md.** SPEC.md covers architecture and decisions. AGENT.md covers behavior and conventions. They don't repeat each other.

## What Belongs in AGENT.md

### 1. Tooling Rules

How to use the project's tools correctly.

```
- Use `just ci` before every commit — never commit with a failing pipeline
- Format with `just fmt`, never run formatters manually
- Run `just check` which includes lint, type checks, and security scanning
```

### 2. Code Conventions

Project-specific patterns the agent should follow.

```
- Use dependency injection — no module-level singletons
- Error handling: return Result<T, E>, never panic/unwrap in library code
- Naming: PascalCase for types, snake_case for functions and modules
- One public struct per file — if a file grows, split it
```

### 3. Test Rules

How to write tests for this project.

```
- Write real tests — exercise actual logic, edge cases, and failure paths
- Never write test theater — no tests that only prove a function was called
- Place tests in tests/ mirroring the src/ structure
- Run `just test` which includes coverage
```

### 4. Workflow Rules

How the iteration loop works for this specific project.

```
- Update PLAN-TODO.md every cycle — check off completed tasks
- Update SPEC.md when scope or architectural decisions change
- Commit messages: short, imperative — "Add user auth middleware" not "added auth"
- Commit only when all checks pass and docs are current
```

### 5. Boundaries

What the agent should and should not do.

```
- Do not add new dependencies without updating SPEC.md's dependency table
- Do not modify justfile recipes without understanding the pipeline graph
- Do not skip `just fmt && just check` even for small changes
```

## What Does NOT Belong in AGENT.md

| Does not belong here | Lives in |
|---------------------|----------|
| Project overview and goals | SPEC.md |
| Architecture decisions and trade-offs | SPEC.md |
| File-by-file breakdown | SPEC.md |
| What tasks to do next | PLAN-TODO.md |
| Progress tracking | PLAN-TODO.md |
| Generic coding principles (SOLID, DRY) | Agent already knows these |
| Language basics | Agent already knows these |

## Length

Keep it under 100 lines. If it's growing, ask: does this belong in SPEC.md instead? Agent.md is a reference card, not a manual.

## Placement

Write at project root: `AGENT.md`. Add to `.gitignore` — it's for agents, not for the repo.
