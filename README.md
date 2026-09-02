# pi-k2

**k3-2o's personal pi coding agent config** — extensions, themes, skills, and prompts bundled as a pi package.

## What's included

### Extensions

| Directory/File | Description |
|----------------|-------------|
| `ask-user-question.ts` | Ask the user multiple-choice questions |
| `clipboard.ts` | Copy text to system clipboard |
| `web_search.ts` | Web search, discovery, and extraction |
| `bench-turns.ts` | Bench tool turns |
| `read_image/` | OCR tool — extracts text from images via native C Tesseract (fallback for models without vision) |

### Themes

| File | Description |
|------|-------------|
| `catppuccin-mocha.json` | Catppuccin Mocha |
| `dracula.json` | Dracula |
| `nightowl.json` | Night Owl |

### Skills

| Directory | Description |
|-----------|-------------|
| `docs-skill/` | Write excellent documentation — READMEs, API refs, architecture docs, tutorials, how-to guides, and changelogs. Diátaxis framework, ethics, and docs-as-code workflows. |
| `adversarial-audit/` | Adversarial code audit — finds real bugs and vulnerabilities with false-positive aversion, applies human-standards fixes with diff-level re-validation, and recommends intelligence tools for additional coverage. |
| `project-setup/` | Set up or resume project workspaces following the LOOP methodology — SPEC.md, PLAN-TODO.md, just dev pipeline, git init. |
| `scope/` | Codebase orientation — per-file cards showing entry points, exports, imports, cross-file deps, symbols ranked by importance, and structural anomalies. Use with CLI tool [`scope`](https://github.com/k3-2o/scope). |
| `skill-creator/` | Create, refactor, validate, and package Agent Skills |
| `youtube-transcript/` | Fetch YouTube video transcripts and summarize |
| `composio/` | 1000+ app integrations (Gmail, Slack, GitHub, Notion, etc.) via the Composio SDK — search the tool catalog, connect apps, and run actions from right in the workspace. |
| `session-memory/` | Recall past pi conversations from session history. |
| `anti-slop/` | Write or polish any text so it reads human and does not trip AI-slop detection, at any layer. |

### Prompts

| File | Description |
|------|-------------|
| `agents-init.md` | Agent initialization prompt |
| `memory-init.md` | Memory initialization prompt |

## Installation

```bash
pi install git:github.com/k3-2o/pi-k2
```

Also install the companion projects — separate repos that pi-k2 doesn't encompass but that extend Pi alongside it:

| Package (repo) | Description |
|---------|-------------|
| [`pi-chrollo`](https://github.com/k3-2o/pi-chrollo) | Retrieval layer for Pi's native session history — search past conversations, read matched windows. No storage, no capture, no injection. |
| [`pi-composio`](https://github.com/k3-2o/pi-composio) | Pi extension — 6 tools bridging to Composio's 1,000+ app integrations (Gmail, Slack, GitHub, etc.). No MCP required. |
| [`pi-move`](https://github.com/k3-2o/pi-move) | Pi extension — `/move` command to switch to a fresh Pi session in any directory. |
| [`pi-read-image`](https://github.com/k3-2o/pi-read-image) | OCR tool for Pi — extracts text from screenshots, terminal output, and code images (Tesseract + ImageMagick). |
| [`pi-repl-py`](https://github.com/k3-2o/pi-repl-py) | Pi extension — a single `execute` tool backed by a persistent Python evaluator (a real IPython kernel). |
| [`pi-semantic-edit`](https://github.com/k3-2o/pi-semantic-edit) | Drop-in replacement for Pi's built-in `edit` — same `edits[]` contract, improved semantics. |
| [`pi-remote`](https://github.com/k3-2o/pi-remote) | WebSocket-first server runtime for Pi — start it once, talk to Pi from anywhere. |
| [`pi-streak`](https://github.com/abboskhonov/pi-streak) | Bun terminal contribution chart for Pi session data — GitHub-style calendar rendered from session JSONL files. |
| [`pi-vimotion`](https://github.com/k3-2o/pi-vimotion) | Modal vim editing for Pi's prompt box — Normal + Insert modes, operators that compose with motions. |

```bash
pi install git:github.com/k3-2o/pi-chrollo
pi install git:github.com/k3-2o/pi-composio
pi install git:github.com/k3-2o/pi-move
pi install git:github.com/k3-2o/pi-read-image
pi install git:github.com/k3-2o/pi-repl-py
pi install git:github.com/k3-2o/pi-semantic-edit
pi install git:github.com/k3-2o/pi-remote
pi install git:github.com/abboskhonov/pi-streak
pi install git:github.com/k3-2o/pi-vimotion
```

## License

MIT
