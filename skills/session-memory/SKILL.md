---
name: session-memory
description: Recall past pi conversations from session history. Use when the user references earlier work, past decisions, or anything from a previous session.
---

# Session Memory

## Ground truth

Sessions are JSONL under `~/.pi/agent/sessions/<cwd-slug>/<date>_<id>.jsonl`.
Each line is a node in one tree, linked `id` → `parentId`:

    session {cwd}
    └─ message[user] → message[assistant] → message[toolResult] → …
       (tool loops nest deeper; searchable text often lives in thinking)

`session_info {name}` / `compaction {summary}` attach anywhere. Compacted
spans are gone — only summaries survive.

## Traps (why a naive grep loses)

- **A filename is never a path.** Paths come only from rg output or
  transcripts, never rebuilt by hand — the slug subdir is part of the path.
- **Recurse.** Sessions nest under per-workspace slug dirs; scans must use
  `rglob`. Plain `glob` silently finds nothing (verify count ≠ 0).
- **Search `thinking` blocks too.** Keywords often live in the assistant's
  reasoning, not the visible reply; never filter to text-only.
- **`rg -e a -e b` is line-OR, not AND.** Co-occurrence needs a second pass
  or a set intersection.
- **The session you are in echoes your query** and ranks #1 — drop it.
- **Rank both roles.** The topic often lives in the assistant answer.

## Procedure

1. **Mine keywords from the event, not the noun.** Identifiers, paths, tool
   names, versions, dates; split camelCase; drop fillers and ≤2-char tokens.
   Mine the actor/verb/object of the claim separately — each may have its
   own term. <5 solid terms → stop and ask.
2. **rg → keep real turns → rank → cap → peek.** `rg -F` across the sessions
   dir; keep only lines whose message role is user/assistant with non-empty
   text; rank by hits per session with recency as tiebreak; cap ~10 sessions
   and ~10 hits per session; peek at matched lines before reading far. The
   sketch below is illustrative — adapt it, don't replicate it line-for-line.
3. **Confirm** with `session_info.name` / `compaction.summary`.
4. **Read as turns** `[HH:MM] role: text` (thinking flattened in), ~300 chars
   each. Widen one window
   at a time (≤5 lines before/after). Never dump raw lines or a whole session.
5. **Miss → loop back:** next tier of ranked sessions, relax the per-file cap,
   try variant terms (2-3 passes is normal). Triage/eviction sessions name
   what they deleted — search them for the topic. Dead end → ask for better
   terms, never guess.

## Reporting

No match → "nothing in history matches"; failed → "retry". On a hit, quote
the matched user turn(s) verbatim — the user recognizes their own words
instantly, and the hunt is over.

## Illustrative sketch

A shape, not a spec. The point is the invariants: turn-filter before ranking,
exclude the current session, cap, peek.

    import json, subprocess
    from collections import defaultdict
    from pathlib import Path

    def real_turn(raw):
        m = json.loads(raw).get("message", {})
        if m.get("role") not in ("user", "assistant"): return False
        return any(isinstance(b, dict) and (b.get("text") or b.get("thinking"))
                   for b in m.get("content", []))

    out = subprocess.run(["rg", "-n", "-i", "-F", "-g", "*.jsonl", "-m", "200"]
                         + [f"-e{t}" for t in terms]
                         + [str(Path.home() / ".pi/agent/sessions")],
                         capture_output=True, text=True)
    hits = defaultdict(list)
    for line in out.stdout.splitlines():
        path, _, rest = line.partition(":")
        ln, _, raw = rest.partition(":")
        if real_turn(raw):
            hits[path].append(int(ln))
    # drop the session you are in now, rank, cap, then peek at the winner:
    ranked = sorted(hits.items(),
                    key=lambda kv: (-len(kv[1]), -Path(kv[0]).stat().st_mtime))[:10]
    for path, lns in ranked:
        print(len(lns), Path(path).name)
    # then read winners as flattened turns [HH:MM] role: text — text + thinking
