# Composio response map (measured against composio 0.19.0)

Everything comes back as a **pydantic model** (`.field` access or `.model_dump()`), NOT raw JSON.
Read fields off the object directly; use `model_dump()` only when you need a plain dict.

## search(query) -> SessionSearchResponse  (~21KB raw)

Top-level fields:

| field | what | keep? |
|---|---|---|
| `tool_schemas` | dict `{slug: ToolSchemas}` — the tools found | keep slug + toolkit + description; drop schema bodies here |
| `results` | list of `Result` | keep `primary_tool_slugs` only; drop the rest |
| `toolkit_connection_statuses` | list `{toolkit, has_active_connection, status_message, accounts}` | flatten to `{toolkit: needs_connection_bool}` |
| `success` | bool | keep (already lean) |
| `error` | str / None | keep (it's null on success) |
| `next_steps_guidance` | list[str] | drop |
| `time_info` | TimeInfo | drop |
| `session` | Session | drop (has `instructions` noise) |

Each `tool_schemas[slug]` (`ToolSchemas` model): `tool_slug`, `toolkit`, `description`,
`input_schema`, `output_schema`, `schema_ref`. Keep `tool_slug`+`toolkit`+`description[:160]`;
**discard the JSON schema bodies** (`input_schema`) here — that belongs in schema() only.

`toolkit_connection_statuses[*]`:
- `toolkit`: slug string (lowercase, e.g. "gmail")
- `has_active_connection`: bool  <-- THE field that matters
- `status_message`: human text
- `connection_details.connected_account_id`, `current_user_info.emailAddress`
- `account_selection`: "required" when multi-account needs explicit pick

## schema: tool arguments — the 4.7KB -> 1.5KB trim

`schema` for a tool lives in `tool_schemas[slug].input_schema` = `{type, properties}` where
`properties[name]` is a dict with keys `[type, items, default, examples, description]`.

Per property, drop `examples` (multi-hundred-char arrays = the bulk):
- FULL per-property spec (with examples): ~4.7KB
- MINIMAL `{name, type, description[:120]}`: ~1.5KB  (~3x smaller)

Keep the top-level `required` list = mandatory arguments. Example `GMAIL_SEND_EMAIL` has 10 props.

## execute -> SessionExecuteResponse: `{data, error, log_id}`

- `data`: dict, the real payload. Can be large (repo list ~17KB) — **slice before reporting** (`.data[:5]` / `str(...)[:200]`).
- `error`: `None` on success, else a message string.
- `log_id`: audit receipt string. Drop unless debugging.

## authorize -> ConnectionRequest

`{id: "ca_...", status: "INITIATED", redirect_url: "https://connect.composio.dev/link/..."}`.
Give the `redirect_url` to the user to open+log in. `id` is the connection/request id.

## Deterministic no-connection error

`BadRequestError` (from `composio_client`), message contains
`"No active connection found for toolkit(s) 'X'"`. This is NOT a real failure —
the app just isn't connected yet. Handle: `session.authorize("X")` -> show redirect_url ->
user opens link -> retry the `execute`.

## session / persistence

- `session_id` attribute on a created session (`trs_...`), populated immediately.
- `sessions.use(session_id)` re-opens an existing session in a later process
  (api key + userId are baked in at create time; don't re-feed them).

## Multi-account (only if needed)

A user can hold multiple accounts on one app (e.g. two gmail) inside a session created
with `multi_account={"enable": True, "require_explicit_selection": bool}`.
- each account in `toolkit_connection_statuses[].accounts[]`: `{id: "ca_", is_default, alias}`
- `execute(..., account="alias_or_ca_id")` picks the account.
- Requires the `account` param when `require_explicit_selection=true`.
Default mode (no multi_account): one account per app per user, auto-picked. Skip this entirely unless you need it.

## Ready-to-use trimmers

Runnable functions that cut a raw response down to the useful core. Copy these; they're the
"cut the fluff" layer. All operate on the pydantic models `search`/`execute` return.

**The rule: raw response -> variable -> trim -> THEN into context.**
Never let `res.model_dump()` or a raw `resp.data` touch the transcript directly. Assign, trim,
and only reference the trimmed/lear value from there.

```python
def trim_search(res):
    """search()/' -> lean list of tools + connection state (~20KB -> ~600B)."""
    schemas = res.tool_schemas or {}
    statuses = {t.toolkit.upper(): bool(t.has_active_connection)
                for t in (res.toolkit_connection_statuses or [])}
    return [
        {
            "tool": slug,
            "toolkit": (getattr(s, "toolkit", "") or "").upper(),
            "description": (getattr(s, "description", "") or "")[:160],
            "needs_connection": not statuses.get((getattr(s, "toolkit", "") or "").upper(), False),
        }
        for slug, s in schemas.items()
    ]

def schema_flat(s):
    """args for one tool: drop 'examples' (the 3x win). Returns list of names."""
    props = (getattr(s, "input_schema", None) or {}).get("properties", {})
    return list(props.keys())

def trim_execute(resp):
    """Slice execute payload before reporting; error is None on success."""
    return {"error": resp.error, "data": resp.data}
```

- `search` barely returns the tool list worth seeing. Call `trim_search` and report that — never the raw model.
- `schema`: use `schema_flat` for arg names (drop `examples` bodies).
- `execute`: `resp.data` is the user-facing payload — slice it (`[:5]` / `[:200]` chars) before reporting.
