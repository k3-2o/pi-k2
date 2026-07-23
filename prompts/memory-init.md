______________________________________________________________________

## description: Scaffold a MEMORY.md file at project root for persistent session memory. Use when the project has grown complex enough to benefit from cross-session context. argument-hint: "[project-name]"

Create a MEMORY.md file at the project root. Substitute:

- `{{today}}` → the actual date (run `date -I` to get it)
- `{{project_name}}` → the project name (infer from context, or use "$1" if provided)
- Fill the Active Workstream bullets with current project state if you can infer it

```markdown
---
type: memory
created: {{today}}
last_updated: {{today}}
entry_count: 0
maintain_under: 300
---

# MEMORY.md — {{project_name}}

**Rules for the agent:**
- This file must stay under 300 lines
- Read this file at the start of every session
- Critical Decisions is append-only, date-stamped — never modify or delete past entries
- When approaching 300 lines, consolidate: prune old Session Log entries, collapse resolved bugs, remove stale Handoff Notes
- Mark superseded decisions with `[superseded by YYYY-MM-DD]` — never silently delete
- When the user says "note that:" or "remember this:", immediately write that entry to the appropriate section
- At end of session, when the user says "wrap up" or "end session", update Session Log and write Handoff Notes
- Never add trivia — only decisions, bugs, lessons, and environment quirks worth remembering

---

## Active Workstream

_What's in progress, blocked, or next._

- ✅ —
- ❌ —
- ⏭ —

## Critical Decisions

_Append-only. Date-stamped. One line each._

## Bugs Found & Fixed

_What broke, why, how fixed._

## Corrections & Lessons

_Mistakes the agent should not repeat._

## Environment & Gotchas

_Local setup quirks, hardware limits, non-obvious things._

## Session Log

_Compact record. Keep last ~5 sessions. Prune when approaching 300 lines._

| Date | Summary |
|------|---------|
| | |

## Handoff Notes

_Overwritten each session. Last entry is current._

**{{today}}:**
```

After writing the file, confirm to the user that MEMORY.md has been initialized and remind them:

- To update mid-session, say "note that: ..."
- To update at end of session, say "wrap up and update memory"
- The file must stay under 300 lines
