---
name: session-memory
description: Recall past pi conversations from session history. Use when the user references earlier work, past decisions, or anything from a previous session.
---

# Session Memory

Find a past conversation in `~/.pi/agent/sessions/` and read back the relevant turns.

## Why raw grep lies

Sessions are JSONL — one JSON object per line — under
`~/.pi/agent/sessions/<cwd-slug>/<date>_<id>.jsonl` (slug = cwd with `/` → `-`).

Most lines are not conversation: on this machine ~33k of ~77k message lines are
toolResult and ~26k content blocks are thinking. A raw `rg` hit usually lands inside
that noise. The only text worth searching is the cleaned transcript — user/assistant
turns only, one per line. Everything else (tool output, thinking, images, headers,
model-change metadata) is dropped at parse time.

Two traps when parsing:

- the role is NESTED: `line["message"]["role"]` — the outer line has none
- assistant turns are `content: [{type:"thinking",…}, {type:"text",…}]` — keep only
  `type == "text"` blocks

Every field shape for every line type is in
[references/session-format.md](references/session-format.md).

## Procedure

1. **Pick 2–4 rare terms** from the ask — names, paths, identifiers, exact phrases.
   Split camelCase (`k3sIngress` → `k3s ingress`), lowercase, drop stopwords and
   ≤2-char fragments. If the ask yields no distinctive term, ask the user for one or
   two — never run a search on filler.

2. **One rg over the corpus**, counting matches per file:

       rg -i -c -e TERM1 -e TERM2 -e TERM3 -- ~/.pi/agent/sessions

   Rank files by match count, then by mtime. Skip the file for the session you are
   in right now — it contains the ask by definition and is already in your context.

3. **Convert only the top candidates** — the few files with real density, not
   everything — into transcripts held in variables, one real turn per line:

       import json

       TURNS = {}
       for path in candidates:
           turns = []
           for raw in open(path):
               try: o = json.loads(raw)
               except json.JSONDecodeError: continue
               if o.get("type") != "message": continue
               m = o.get("message", {})
               if m.get("role") not in ("user", "assistant"): continue
               text = " ".join(b.get("text", "") for b in m.get("content", [])
                               if isinstance(b, dict) and b.get("type") == "text")
               text = " ".join(text.split())
               if text: turns.append(f"[{o.get('timestamp','')[11:16]}] {m['role']}: {text}")
           TURNS[path] = turns

   Two cheap confirmations before or instead of converting: `session_info.name`
   (the session's human title) and `compaction.summary` (prose recap of the
   compacted part) can verify a candidate without touching the spine.

4. **Search the variables, print almost nothing.** One transcript line = one real
   turn, so a hit is a real turn and no hit is a fake keyword win:

       from pathlib import Path
       hits = {p: [i for i, ln in enumerate(turns) if needle in ln.lower()]
               for p, turns in TURNS.items()}
       print({Path(p).name: v for p, v in hits.items()})    # counts only

   Then print ONE ~5-line window (truncate each line to ~300 chars) around the best
   hit; refine the needle and re-scan — variables are free now. Never dump a whole
   session; never print a raw line: a thinking block can be tens of KB and would
   permanently eat context.

## Failure discipline

- No clean hits → "nothing in the session history matches", not "no memories".
- rg error or timeout → say the search failed and retry; a failure is not a "none".
- Terms that match everything → narrow them or ask. Search less, don't print more.

## Limits

Keyword recall over cleaned text. Compaction summaries are searchable; the compacted
span itself is not. If the terms cannot pin one session, say so and ask for a more
distinctive one — do not guess.
