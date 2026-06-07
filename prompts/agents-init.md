---
description: Initialize AGENTS.md by asking diagnostic questions first
---

# AGENTS.md Initialization

You are about to create an AGENTS.md for this project. Use the AskUserQuestion tool to gather real information — never guess or make up commands.

The questions below are a standard starting point, not a rigid script. Adapt as needed: ask more if something warrants digging deeper, combine questions when the answer is obvious, skip what doesn't apply. The goal is accurate information, not ticking through a checklist.

---

## Phase 1 — Foundation

Use AskUserQuestion for each of these. Ask them one at a time.

1. **Project identity**: "What's the project name and what does it do in one sentence?"
   → Goes into `# Project Name` and `## Project Overview`

2. **Tech stack**: "What's the tech stack? (language, framework, runtime)"
   → Provides context for the Commands section

3. **Build command**: "What's the exact build command?"
   Options: `pnpm build`, `npm run build`, `make`, `cargo build`, `go build ./...`, `npm run dev` (if no build step), `other`, `none`

4. **Test command**: "What's the exact test command?"
   Options: `pnpm test`, `npm test`, `cargo test`, `go test ./...`, `pytest`, `other`, `none`

5. **Lint/format command**: "Any linting or formatting commands?"
   Options: `pnpm lint`, `eslint`, `prettier --check`, `cargo fmt --check`, `ruff`, `other`, `none`

---

## Phase 2 — Reference Documents (Your Addition to the Standard)

This is a custom section that comes right after Project Overview in the generated file. Ask:

6. **Specification**: "Do you have a specification document somewhere I should reference at session start? It can be anywhere on your system (e.g. `~/Documents/project-spec.md`)."
   If they provide a path, include it. If not, note "None provided."
   Behavior: Read once at session start. Do not edit without asking.

7. **MEMORY.md**: "Do you have a MEMORY.md in this project?"
   Note the path if they have one.
   Behavior: Load at session start. Append decisions and session log at fundamental changes as the session goes on and at the end of each session.

8. **PLAN.md/todo.md**: "Do you have a PLAN.md or todo.md for task tracking?"
   Always include in Reference Documents. Note the path if they have one.

After questions 6-8, ask: **"Should MEMORY.md, PLAN.md, and any in-project spec files be committed to git or gitignored?"**

---

## Phase 3 — Additional Context, Boundaries & Workflow

9. **Additional Context**: "Any other important context or quirks about this project that don't fit the standard sections? (e.g. database setup, monorepo layout, CI quirks, environment-specific config)"
   → Goes into `## Additional Context`

10. **Boundaries**: "Are there any boundaries the agent should follow? (things to never do, files to never touch, security-sensitive areas, areas where it should ask permission)"

11. **PR conventions**: "Any PR or commit conventions? (title format, required checks, review process)"

12. **Code style**: "Any code style preferences? (naming conventions, patterns to follow or avoid)"

---

## Phase 4 — Generate & Validate

After collecting all answers, write `./AGENTS.md` with this structure:

```markdown
# <Project Name>

## Project Overview
<one-sentence description>

## Reference Documents
These files are read at session start and maintained throughout the project's lifetime:

**AGENTS.md** (this file)
- Path: `./AGENTS.md`
- Purpose: Project instructions, conventions, and reference document manifest
- Behavior: Updated by the agent as project knowledge evolves.

**MEMORY.md**
- Path: `./MEMORY.md`
- Purpose: Session memory and decision log
- Behavior: Load at session start. Append new decisions and session log at end of each session.

**Specification**
- Path: `<path provided>`
- Purpose: Project specification and architecture
- Behavior: Read once at session start. Do not edit without human approval.

**PLAN.md**
- Path: `./PLAN.md`
- Purpose: Task tracking and planning
- Behavior: Load at session start. Update as tasks progress and priorities change.

## Additional Context
<answer to question 9 — freeform bullets of project-specific quirks>

## Commands
- Build: `<answer>`
- Test: `<answer>`
- Lint: `<answer>`

## Code Style
<answer>

## Boundaries
<answer>

## PR Guidelines
<answer>
```

Only include sections that have content. Omit Code Style, Boundaries, or PR Guidelines entirely if the user had nothing to say for them.

After writing, tell the user:
> *"I've generated `AGENTS.md` from your answers. Please review it — especially the build/test commands and spec path. You can edit it anytime with `/agents-init` to regenerate."*

**Important rules:**
- Always ask before writing. Never guess a command.
- If the user gives a vague answer, ask for specifics.
- The Reference Documents section must come immediately after Project Overview.
- AGENTS.md itself can be updated later by the agent as project knowledge evolves.
