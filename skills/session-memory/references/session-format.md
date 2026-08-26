# Session file format

## Layout
`~/.pi/agent/sessions/<cwd-slug>/<date>_<id>.jsonl` — one JSON object per line,
one session per file. Slug = session cwd with `/` → `-`; filename starts with date.

Every line is a node in one tree (`id` → `parentId`), a left-deep spine: each new
turn attaches to the latest leaf, so tool rounds nest deeper with every iteration.
Two roots: `session` (always line 1, holds cwd) and `model_change`; the first user
turn hangs off a `model_change` / `thinking_level_change` chain.

## Line types

| type | prevalence | shape | use |
|---|---|---|---|
| session | one per file | {version, id, timestamp, cwd [, parentSession]} | ignore (header) |
| model_change | common | {provider, modelId} | ignore |
| thinking_level_change | common | {thinkingLevel} | ignore |
| message | dominant | {type, id, parentId, timestamp, message} | parse |
| custom_message | common | {customType, content: <string>, display} | searchable (chrollo memory markers) |
| session_info | occasional | {name} | cheap pre-filter |
| compaction | occasional | {summary, firstKeptEntryId, details, ...} | searchable prose |
| custom | rare | {customType, data} | ignore |

## message line

Outer: {type, id, parentId, timestamp, message}

Inner `message` — the ONLY place the role lives; every role also carries an inner
`timestamp`:
- role: user | assistant | toolResult (rare: bashExecution)
- user: {content, role, timestamp}
- assistant: {content, role, timestamp, api, provider, model, responseId, stopReason, usage}
- toolResult: {content, role, timestamp, toolCallId, toolName, isError | details}

`content` is ALWAYS a list of blocks.

## Content blocks

| block | shape | keep? |
|---|---|---|
| text | {type: "text", text} | yes |
| toolCall | {type: "toolCall", id, name, arguments} | no |
| thinking | {type: "thinking", thinking, thinkingSignature} | no |
| image | {type: "image", data, mimeType} | no |

Most matching lines are noise: toolResult output and thinking blocks outnumber
real turns, which is why raw grep over the files mostly returns fake hits.
