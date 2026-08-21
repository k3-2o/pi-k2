# Session file format

## Layout
`~/.pi/agent/sessions/<cwd-slug>/<timestamp>_<id>.jsonl` — one file per session.
The slug is the session cwd with `/` replaced by `-`. Filename starts with the date.

## Line types

| type | count (this machine) | shape | recall use |
|---|---|---|---|
| message | ~77k | {type, id, parentId, timestamp, message} | parse |
| custom_message | 1.4k | {customType, content, display, ...} | skip |
| model_change | 1.2k | {provider, modelId, ...} | skip |
| thinking_level_change | 0.9k | {thinkingLevel, ...} | skip |
| session | 419 | {version, id, timestamp, cwd [, parentSession]} | first line |
| session_info | 57 | {name} | cheap pre-filter |
| compaction | 52 | {summary, firstKeptEntryId, ...} | searchable prose |
| custom | 6 | {customType, data, ...} | skip |

## message line

Outer: {"type": "message", "id", "parentId", "timestamp", "message"}

Inner message object — the ONLY place the role lives:
- role: user | assistant | toolResult (rare: bashExecution)
- content: ALWAYS a list of blocks
- assistant turns also carry provider, model, usage, stopReason (not needed)

## Content blocks

| block | shape | keep? |
|---|---|---|
| text | {type:"text", text} | yes |
| toolCall | {type:"toolCall", id, name, arguments} | no |
| thinking | {type:"thinking", thinking, thinkingSignature} | no |
| image | {type:"image", data, mimeType} | no |

Noise ratio: of ~77k message lines, ~33k are toolResult and ~26k blocks are thinking —
which is why raw grep over the files mostly returns fake hits.
