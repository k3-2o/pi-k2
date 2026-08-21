---
name: session-memory
description: Recall past pi conversations from session history. Use when the user references earlier work, past decisions, or anything from a previous session.
---

# Session Memory

Find a past conversation in `~/.pi/agent/sessions/` and read back only the relevant turns.

## The skeleton of a session file

One file per session, one JSON object per line. The conversation is a spine inside noise:

    ~/.pi/agent/sessions/<cwd-slug>/<date>_<session-id>.jsonl
    │
    ├── session                    line 1: {version, id, timestamp, cwd}
    ├── model_change / thinking_level_change      metadata, skip
    │
    ├── message  ─ user            content[]: text                      ← KEEP
    ├── message  ─ assistant       content[]: thinking, text            ← keep text only
    ├── message  ─ assistant       content[]: thinking, toolCall        ← skip (no text)
    ├── message  ─ toolResult      tool output, NOT conversation        ← skip
    ├── message  ─ assistant / user ...                                 ← KEEP
    │    ... the user → assistant → (toolResult)* loop repeats
    │
    ├── session_info               {name} — human title, cheap pre-filter
    └── compaction                 {summary} — prose summary, searchable

Two traps: the role is NESTED (`line["message"]["role"]`, the outer line has none),
and assistant turns lead with a `thinking` block — walk all content blocks and keep
only `{"type": "text"}`.

Exact field shapes for every line type and content block are in
[references/session-format.md](references/session-format.md) — consult it before
writing the parser instead of guessing field names.

## Printing is the expensive part — read this before anything

Every line you print enters the conversation and eats context permanently. In THIS
workflow the danger is extreme: a raw jsonl line can be tens of KB (thinking blocks,
tool outputs, base64 images) — printing even two or three raw lines can blow more
context than the entire rest of the task. That is why nothing raw is ever printed and
no raw line is ever read. Raw grep also lies: keywords sit inside thinking blocks and
toolResults, so raw hits are mostly fake. The only safe surface is the cleaned
transcript: triage files on disk, convert to clean user/assistant text, hold it in
variables, search the variables, and print only small bounded windows — counts first,
then one ~5-line window at a time. The transcripts stay in the workspace, so later
cells re-query them instead of re-reading files.

## Workflow — two searches, never one

### Stage 1 — triage FILES with a keyword FLOCK (do not read them)

The sessions dir is huge: the first rg returns a BUNCH of candidate files, not one.
This pass only ranks files — never open them, never take line numbers from raw jsonl
(they point inside thinking/toolResult noise and mean nothing).

Build a flock of DISTINCTIVE keywords from the user's ask — 7 to 10 of them, not one
or three. One keyword is daft (matches half the corpus); a flock pins the session.
Drop filler words (the, a, an, me, my, you, we, it, is, was, that, this, of, to, and,
for, on, with) and drop generic verbs — keep identifiers, names, paths, exact phrases,
technical terms. Only include a keyword if it could plausibly appear verbatim.

    import subprocess, os
    SESSIONS = os.path.expanduser("~/.pi/agent/sessions")

    def triage(keywords, limit=8):
        cmd = ["rg", "-i", "-c", "-g", "*.jsonl"]
        for k in keywords:
            cmd += ["-e", k]
        cmd.append(SESSIONS)
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        # rg -c prints path:count of lines matching ANY keyword
        scored = []
        for line in r.stdout.splitlines():
            path, _, n = line.rpartition(":")
            scored.append((int(n), os.path.getmtime(path), path))
        scored.sort(reverse=True)
        return [(p, n) for n, _, p in scored[:limit]]

The truth signal is ABUNDANCE IN ONE FILE: a file containing many occurrences of many
flock keywords is a true hit; scattered single matches across thirty files are not.
Want strict AND semantics (file must contain every keyword at least once)? Run rg
once per keyword and intersect the file sets — cheap, still no reading:

    def triage_and(keywords, limit=8):
        sets = []
        for k in keywords:
            r = subprocess.run(["rg", "-i", "-l", "-g", "*.jsonl", "-e", k, SESSIONS],
                               capture_output=True, text=True, timeout=60)
            sets.append(set(r.stdout.splitlines()))
        files = set.intersection(*sets)
        scored = sorted(((os.path.getmtime(p), p) for p in files), reverse=True)
        return [p for _, p in scored[:limit]]

Output = a shortlist of FILES (path, match-count). Nothing has been read yet.

### Between stages — judge the shortlist before converting

Converting files costs real work, so judge plausibility first:
- One or two files clearly denser than the rest (abundance concentrated) → proceed.
- Match counts are 1 everywhere, or thirty files tie → the keywords are not working.

**Push back on the user straight up.** If the keywords the user gave are too mealy to
work with — a single generic word, or phrasing that matches half the corpus — say so
directly: "these keywords are too broad to search the session history; give me one or
two distinctive terms (an identifier, a file path, an exact phrase you recall)".
Do NOT go in blindly because of the user's vague prompt. A vague ask is a reason to
ask again, never a reason to parse the whole corpus.

### Stage 2 — convert the shortlist, then rg the VARIABLES

Clean every shortlisted file into a transcript held in variables — a dict, so you can
search across all candidates, not just one:

    import json

    def clean_turns(path):
        out = []
        with open(path) as fh:
            for raw in fh:
                try:
                    o = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if o.get("type") != "message":
                    continue
                m = o.get("message", {})
                if m.get("role") not in ("user", "assistant"):
                    continue
                text = " ".join(" ".join(
                    b.get("text", "") for b in m.get("content", [])
                    if isinstance(b, dict) and b.get("type") == "text"
                ).split())                    # collapse whitespace: ONE turn = ONE line
                if not text:
                    continue
                out.append(f"[{o.get('timestamp','')[11:16]}] {m['role']}: {text}")
        return out

    transcripts = {p: clean_turns(p) for p, _ in shortlist}   # in variables, never printed

Now the second rg / substring scan runs over `transcripts` — and one line = one real
turn, so line numbers finally mean something. Fake hits are already gone (thinking and
toolResults were dropped at conversion).

    hits = {p: [i for i, ln in enumerate(lines) if needle in ln.lower()]
            for p, lines in transcripts.items()}
    print({os.path.basename(p): v for p, v in hits.items()})   # counts, not contents

### Stage 3 — read the hits gently, step by step

Walk the hits ONE at a time: print a small bounded window (~5 lines) around the best
hit, look, then move to the next hit or the next file. If a window is wrong, try the
next candidate — never print a bigger dump. One transcript line can still be long
(an assistant turn is one line, however big) — cap every printed line so a window
can never explode:

    def window(lines, i, before=2, after=3, cap=300):
        return "\n".join(ln[:cap] + (" …" if len(ln) > cap else "")
                         for ln in lines[max(0, i - before):i + after])

    i = next(iter([i for v in hits.values() for i in v]))      # first hit
    print(window(transcripts[p], i))

Iterate a few passes: refine the needle, re-scan the variables (cheap now — they are
already in memory), read the next window. Never dump a whole session.

## Cheap pre-filters

- `session_info.name` — the session's human title; grep it before parsing.
- `compaction.summary` — a prose summary of the compacted part of a long session;
  reading it can answer "was this the session?" without the spine.
- Folder slug — the cwd of the session; narrow by project when the topic implies one.

## The current session pollutes the search

The session you are in RIGHT NOW contains the same keywords the user is asking about
(their question itself mentions them), so the newest top hit is often the live session
file. Check filenames against the current date/time before converting — the target is
almost always the next one down. Cheap guard: skip any file whose mtime is within the
last few minutes, or whose path slug matches the current working directory unless the
user explicitly asks about today.

## Limits

Keyword recall over cleaned text. If the terms are too generic to pin one session, say
so and ask — do not guess. A huge hit count means the terms were too broad; narrow,
don't print more.
