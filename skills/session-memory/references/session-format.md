# Session file format

## Layout
`~/.pi/agent/sessions/<cwd-slug>/<timestamp>_<id>.jsonl` — one file per session.
The slug is the session cwd with `/` replaced by `-`. Filename starts with the date.

## Line types

| type | prevalence | shape | recall use |
|---|---|---|---|
| message | dominant | {type, id, parentId, timestamp, message} | parse |
| custom_message | common | {customType, content, display, ...} | skip |
| model_change | common | {provider, modelId, ...} | skip |
| thinking_level_change | common | {thinkingLevel, ...} | skip |
| session | one per file | {version, id, timestamp, cwd [, parentSession]} | first line |
| session_info | occasional | {name} | cheap pre-filter |
| compaction | occasional | {summary, firstKeptEntryId, ...} | searchable prose |
| custom | rare | {customType, data, ...} | skip |

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

Most matching lines are noise: toolResult output and thinking blocks outnumber
real turns, which is why raw grep over the files mostly returns fake hits.
