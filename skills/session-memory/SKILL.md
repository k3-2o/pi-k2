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
       (tool loops nest deeper)

`session_info {name}` / `compaction {summary}` attach anywhere. Compacted
spans are gone — only summaries survive.

## Traps (why a naive grep loses)

- **A filename is never a path.** Paths come only from rg output or
  transcripts, never rebuilt by hand — the slug subdir is part of the path.
- **Recurse.** Sessions nest under per-workspace slug dirs; scans must use
  `rglob`. Plain `glob` silently finds nothing (verify count ≠ 0).
- **`rg -e a -e b` is line-OR, not AND.** Hence the sketch runs one pass
  per term: co-occurrence is a set intersection, proximity a line-span.
- **The session you are in echoes your query.** The search itself must
  exclude it (rg `-g !` + parse-time skip) — it never shows up, ever.
- **Rank both roles.** The topic often lives in the assistant answer.

## Procedure

1. **Mine keywords from the event, not the noun.** Identifiers, paths, tool
   names, versions, dates; split camelCase; drop fillers and ≤2-char tokens.
   Mine the actor/verb/object of the claim separately — each may have its
   own term. <5 solid terms → stop and ask.
2. **rg → keep real turns → rank → cap → peek.** One `rg -F` pass per term;
   keep only lines whose message role is user/assistant with non-empty text.
   Sessions holding ALL terms outrank partials; among full matches, the
   tighter the terms are packed (min line-span) the better, then volume,
   then recency. Cap ~10 sessions. Print the top hits WITH their matched
   lines — never rank blind. The sketch below is illustrative — adapt it,
   don't replicate it line-for-line.
3. **Confirm** with `session_info.name` / `compaction.summary`.
4. **Read as turns** `[HH:MM] role: text`, ~300 chars each. Widen one window
   at a time (≤5 lines before/after). Never dump raw lines or a whole session.
5. **Miss → loop back:** next tier of ranked sessions, relax the per-file cap,
   try variant terms (2-3 passes is normal). Triage/eviction sessions name
   what they deleted — search them for the topic. Dead end → ask for better
   terms, never guess.

## Reporting

No match → "nothing in history matches"; failed → "retry". On a hit, quote
the matched user turn(s) verbatim — the user recognizes their own words
instantly, and the hunt is over.

## Illustrative example — one cell per stage

An example of the mechanics, not a spec to reproduce verbatim — and not one
blob: run the cells **in order, one at a time** (state carries over between
cells), adapting each as you go. Cell 1 maps to step 1, cells 2-4 to step 2.

**Cell 1 — setup** (terms already mined in step 1)

    import json, subprocess
    from collections import defaultdict
    from pathlib import Path

    SESSIONS = Path.home() / ".pi/agent/sessions"
    CURRENT = "<your own session file, resolved — never hand-built>"
    TERMS = [...]                            # mined in step 1

    def real_turn(raw):                  # keep only real user/assistant turns
        try:
            m = json.loads(raw).get("message", {})
        except json.JSONDecodeError:
            return False                 # tolerate stray non-JSON lines
        if m.get("role") not in ("user", "assistant"): return False
        return any(b.get("type") == "text" and b.get("text", "").strip()
                   for b in m.get("content", []) if isinstance(b, dict))

**Cell 2 — search** (one rg pass per term; the current session never surfaces)

    occ = defaultdict(lambda: defaultdict(set))   # path -> term -> {turn lines}
    raws = defaultdict(dict)                      # path -> line no -> raw jsonl
    for term in TERMS:
        out = subprocess.run(["rg", "-n", "-i", "-F", "-g", "*.jsonl",
                              "-g", f"!{Path(CURRENT).name}", "-m", "200",
                              "-e", term, str(SESSIONS)],
                             capture_output=True, text=True)
        for line in out.stdout.splitlines():
            path, _, rest = line.partition(":")
            ln, _, raw = rest.partition(":")
            if path != CURRENT and real_turn(raw):
                occ[path][term].add(int(ln))
                raws[path][int(ln)] = raw

**Cell 3 — rank** (all-terms first, then tighter proximity, then recency)

    def min_span(term_lines):            # tightest window holding every term
        if set(term_lines) != set(TERMS):
            return None                  # partial match: never outranks
        pos = sorted((ln, t) for t, ls in term_lines.items() for ln in ls)
        best = sum(len(ls) for ls in term_lines.values()) * 10**6
        for i in range(len(pos)):
            seen, j = {pos[i][1]}, i
            while len(seen) < len(TERMS) and j + 1 < len(pos):
                j += 1
                seen.add(pos[j][1])
            if len(seen) == len(TERMS):
                best = min(best, pos[j][0] - pos[i][0])
        return best

    span_of = {p: min_span(tl) for p, tl in occ.items()}
    span_key = {p: (s if s is not None else 10**9) for p, s in span_of.items()}
    ranked = sorted(occ.items(), key=lambda kv: (
        span_of[kv[0]] is None,
        span_key[kv[0]],
        -len(kv[1]),
        -sum(len(v) for v in kv[1].values()),
        -Path(kv[0]).stat().st_mtime))[:10]

**Cell 4 — peek, never rank blind** (show the hit lines, not just files)

    for path, term_lines in ranked[:3]:
        lns = sorted({ln for ls in term_lines.values() for ln in ls})
        print(f"== {Path(path).name}  span={span_of[path]}  hits={len(lns)}")
        for ln in lns[:3]:
            m = json.loads(raws[path][ln])["message"]
            text = " ".join(b.get("text", "") for b in m.get("content", [])
                            if isinstance(b, dict) and b.get("type") == "text")
            print(f"   [{ln}] {' '.join(text.split())[:220]}")
