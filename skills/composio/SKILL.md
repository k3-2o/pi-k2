---
name: composio
description: "Use the composio Python SDK directly from the repl workspace to reach 1000+ app integrations (Gmail, Slack, GitHub, Notion, etc.). Search the tool catalog, check which apps are connected, execute app actions, and authorize new apps via OAuth. Use when a task needs a real app action (send email, post to Slack, create a doc, query GitHub) and the composed helper is not available. Trigger: composio, app integration, connect an app, send/execute a tool, Gmail/Slack/GitHub action."
compatibility: "Requires the composio SDK in the repl venv (composio 0.x) and apiKey+userId in ~/.config/pi-composio/config.json. Uses the raw SDK only — no helper object."
---

# Composio

Drive any of composio's 1,000+ app integrations through one Python SDK. The whole shape is
`Composio(api_key)` -> `sessions.create(user_id)` -> a session with `search` / `execute` / `authorize`.

## Bootstrap (first use in a session)

```python
import json, os
from composio import Composio

cfg = json.load(open(os.path.expanduser("~/.config/pi-composio/config.json")))
c = Composio(api_key=cfg["apiKey"])
s = c.sessions.create(user_id=cfg["userId"])     # a real session; keep `s` in scope
```

`apiKey` and `userId` live in `~/.config/pi-composio/config.json`. The `ak_...` value is the
API key; the long `pg-test-...` string is the user id. There is **no per-app client id** — reuse
`apiKey` + `userId` for every app. Keep the session around for many calls; use
`session_id` + `sessions.use(...)` to reopen it later.

**NEVER print, echo, or paste the api key value.** Api keys and secrets are excluded from
"just reading the file." If you must inspect the config, redact the secret first:

```python
cfg = json.load(open(os.path.expanduser("~/.config/pi-composio/config.json")))
print({k: (v if not any(s in k.lower() for s in ("key", "token", "secret"))
          else f"{v[:6]}...{v[-4:]} ({len(v)} chars)") for k, v in cfg.items()})
```

Result looks like `ak_SaB...yYR4 (23 chars)` — enough to confirm it's set, never the value
itself. Pass values to `Composio(api_key=cfg["apiKey"])` by reference; never print them.

## The flow: find -> check -> run

Every app action follows this order. Do NOT skip the connection check.

```python
# 1. Find the tool
res = s.search(query="send gmail email")
#    tool_schemas -> {slug: {toolkit, description}}
#    toolkit_connection_statuses -> which apps are connected

# 2. Check connection BEFORE running
conns = {t.toolkit.upper(): t.has_active_connection for t in res.toolkit_connection_statuses}
if not conns.get("GMAIL", False):
    req = s.authorize("gmail")              # 3. connect first
    # GIVE THE USER req.redirect_url to open + log in, then wait, then retry
    ...

# 4. Run it
resp = s.execute("GMAIL_SEND_EMAIL", arguments={
    "to": "...", "subject": "...", "body": "...",
})
data = resp.data      # error is None on success
```

- **Result is a pydantic model**, not a dict. Read fields off it; use `.model_dump()` only when
  you need a plain dict.

- **NEVER let a raw response reach context.** A `search`/`execute` model_dump is 15-18KB of
  fluff you don't need. ALWAYS route it through a variable first:

  ```python
  res  = s.search(...)          # raw model -> variable
  lean = trim_search(res)       # CUT the fluff -> variable (11x smaller)
  print(lean)                   # ONLY the trimmed var ever reaches context
  ```

  Same for execute: `data = trim_execute(resp)["data"]` — never print `resp.model_dump()`.

- **The tools are always auto-picked:** default sessions have one connected account per app
  per user and execute against it automatically. No account selection needed.
- **THE DATA PAYLOAD IS the app's field schema — trim it, don't invent it.** The envelope
  (`search`/`schema`/`execute`) is already trimmed above, but `resp.data` itself is per-app and
  is frequently ~40KB of garbage. Always recognize the payload's real fields via
  `schema(tool)` or by inspecting ONE message's keys — then pull ONLY the small useful fields
  and leave the body/HTML fields untouched.

  **Email (GMAIL_FETCH_EMAILS): keep `sender`/`subject`/`messageTimestamp`/`messageId`/
  `threadId`/`display_url`/`preview`/`to`. CRITICAL — DROP `messageText` and `payload`:**
  those are raw HTML bodies (measured **26KB and 40KB each**). Use `preview`, not `messageText`.
  Example:

  ```python
  resp = s.execute("GMAIL_FETCH_EMAILS", arguments={"limit":3,
                  "message_type":"UNREAD", "exclude_body":True})
msgs = resp.data["messages"]
lean = [{k: m[k] for k in ("sender","subject","messageTimestamp","messageId",
                           "display_url","preview")} for m in msgs]
print(lean)                    # small struct; 40KB HTML never entered context
  ```

## Authorizing a new app

An app that isn't connected has NO connection on the user. When you get composio's
deterministic `BadRequestError` whose message contains
`"No active connection found for toolkit(s) 'X'"`, that is NOT a real failure — the app is
simply not connected. Handle it:

```python
req = s.authorize("slack")   # toolkit slug, e.g. "slack"
print(req.redirect_url)      # give this URL to the user to open + log in
# user authorizes, then you can execute slack tools
```

`authorize()` returns `{id: "ca_...", status: "INITIATED", redirect_url}` — the user must open
the `redirect_url` in a browser. Ask the user to do so, confirm, then retry the action.

## Response bloat — READ THE MAP

> **IMPORTANT — [references/field-map.md](references/field-map.md) is the response-decoder.**
> It has the exact field paths and the deterministic trims for every response (measured, not guessed).
>
> **Read it when a `search` / `schema` / `execute` result comes back too large.** Raw `data` alone
> can exceed 17KB. The map tells you exactly what to keep and what to drop.

## Use the raw SDK, not a wrapper

Import `from composio import Composio` directly. Do NOT hand-roll a wrapper class around the
SDK — call the SDK's objects (`.sessions.create`, `.search`, `.execute`, `.authorize`) exactly
as shown. Point to install venv: `~/.pi/agent/pi-repl/venv`.
