---
name: session-memory
description: Recall past pi conversations from session history. Use when the user references earlier work, past decisions, or anything from a previous session.
---

# Session Memory

Find a past conversation in `~/.pi/agent/sessions/` and read back the relevant turns.

## Why raw grep lies

Sessions are JSONL (one JSON object per line) under
`~/.pi/agent/sessions/<cwd-slug>/<date>_<id>.jsonl` (slug = cwd with `/` → `-`).

Every line is a node in one tree, linked by `id` → `parentId`: a left-deep spine
where each new turn hangs off the latest leaf. Two roots: `session` (the header,
always the first line) and `model_change`. The first user turn hangs off the
model_change / thinking_level_change chain, not off session.

    session {cwd}
    model_change {provider, modelId}
    └─ thinking_level_change {thinkingLevel}
       └─ message[user] {text}
          └─ message[assistant] {thinking, text, toolCall…}
             └─ message[toolResult]              ← output of the call
                └─ message[assistant] {toolCall}
                   └─ message[toolResult]        ← tool loops nest deeper
                      └─ …
                         └─ message[assistant] {thinking, text}
                            └─ message[user] {text}   ← next turn

Three rarer types attach anywhere on the spine: `session_info` {name},
`compaction` {summary}, and `custom_message` {content: plain string}.

Most lines are not conversation: toolResult messages and thinking blocks dominate
the files, so a raw `rg` hit usually lands inside that noise, not in something the
user actually said.

Search the transcript instead: the same file reduced to conversation. Build it by
filtering every line: keep only `type == "message"` lines whose role is `user`
or `assistant`, keep only the `text` blocks inside each turn, drop everything else
(tool output, thinking, images, headers, model-change metadata). One turn becomes
one line.

Two traps in that filter:

- the role is NESTED: `line["message"]["role"]`; the outer line has none
- an assistant turn's `content` is `[{type:"thinking",…}, {type:"text",…}]`;
  keep the `text` block, drop the thinking

Every field shape for every line type is in
[references/session-format.md](references/session-format.md).

## Procedure

1. **Pick 2–4 rare terms** from the ask: names, paths, identifiers, exact phrases.
   Split camelCase (`k3sIngress` → `k3s ingress`), lowercase, drop stopwords and
   ≤2-char fragments. If the ask yields no distinctive term, ask the user for one or
   two. Never run a search on filler.

2. **rg the corpus, noise-filtered, newest file first.** One rg over
   `~/.pi/agent/sessions` with line numbers on and `--sortr modified` (rg walks
   files newest first; `-F` makes the terms literal). Parse only the MATCHING
   lines through the turn filter from above; a match that fails it is muck
   (thinking, tool output, headers) and dies on the spot. Every match that
   survives is a real user/assistant turn. Group the survivors by file, keeping
   rg's date order: those files are the hit sessions, newest session on top. What
   you are after is often not the newest hit; work down the list. Drop the file of
   the session you are in right now; it contains the ask by definition and is
   already in your context.

       import json, os, subprocess
       from collections import defaultdict

       def is_real_turn(raw):
           try: o = json.loads(raw)
           except json.JSONDecodeError: return False
           if o.get("type") != "message": return False
           m = o.get("message", {})
           if m.get("role") not in ("user", "assistant"): return False
           return any(isinstance(b, dict) and b.get("type") == "text" and b.get("text", "").strip()
                      for b in m.get("content", []))

       r = subprocess.run(["rg", "-n", "-i", "-F", "--sortr", "modified",
                           "-g", "*.jsonl", "-m", "200"]
                          + [f"-e{t}" for t in terms]
                          + [os.path.expanduser("~/.pi/agent/sessions")],
                          capture_output=True, text=True)
       hit_sessions = defaultdict(list)      # path -> [real-turn line numbers]
       for mline in r.stdout.splitlines():
           path, _, rest = mline.partition(":")
           ln, _, raw = rest.partition(":")
           if is_real_turn(raw):
               hit_sessions[path].append(int(ln))   # order = newest session first

3. **Confirm before converting.** A hit session might still be the wrong session.
   `session_info.name` (human title) and `compaction.summary` (recap of the
   compacted part) settle it without touching the spine.

4. **Convert each hit session into its own transcript**, one variable per session,
   one real turn per line:

       TURNS = {}                            # path -> transcript
       for path in hit_sessions:
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

   Transcripts stay in the variables for the rest of the search. The files are not
   touched again.

5. **rg the transcripts.** One transcript line = one real turn, so a hit here is a
   real turn and a miss is a real miss:

       from pathlib import Path
       hits = {p: [i for i, ln in enumerate(turns) if needle in ln.lower()]
               for p, turns in TURNS.items()}
       print({Path(p).name: v for p, v in hits.items()})    # counts only

6. **Read turn by turn.** For the best hit session, walk the hit lines in order:
   print a ~5-line window (each line capped at ~300 chars), then move forward past
   what you've seen and print the next window, following the conversation until
   you have what the user needs. Only then move to the next session's hits. Never
   dump a whole transcript; never print a raw line, a thinking block can be tens of
   KB and would permanently eat context.

7. **Not found? Loop back.** Take the next tier of hit sessions from step 2 (or
   relax the `-m` cap (200), or drop in a variant term), convert them into transcripts,
   and search again by the same steps. Two or three passes is normal. When the
   loop stops turning up new material, the terms do not match history: say so and
   ask for a more distinctive term.

## Failure discipline

- No clean hits → "nothing in the session history matches", not "no memories".
- rg error or timeout → say the search failed and retry; a failure is not a "none".
- Terms that match everything → narrow them or ask. Search less, don't print more.

## Limits

Keyword recall over cleaned text. Compaction summaries are searchable; the compacted
span itself is not. If the terms cannot pin one session, say so and ask for a more
distinctive one. Do not guess.
