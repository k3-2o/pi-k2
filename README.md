# pi-k2

**k3-2o's personal pi coding agent config** — extensions, themes, skills, and prompts bundled as a pi package.

## What's included

### Extensions

| Directory/File | Description |
|----------------|-------------|
| `ask-user-question.ts` | Ask the user multiple-choice questions |
| `chrollo/` | Agentic memory — verbatim session capture + g repel retrieval |
| `clipboard.ts` | Copy text to system clipboard |
| `pi-move/` | `/move` command to switch directories from inside Pi |
| `read_image/` | Local OCR for Pi — extracts text from screenshots and code images |
| `web_search.ts` | Web search, discovery, and extraction |

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

### Prompts

| File | Description |
|------|-------------|
| `agents-init.md` | Agent initialization prompt |
| `memory-init.md` | Memory initialization prompt |

## Installation

```bash
pi install git:github.com/k3-2o/pi-k2
```

Also install the standalone packages:

| Package | Description |
|---------|-------------|
| [`pi-chrollo`](https://github.com/k3-2o/pi-chrollo) | Agentic memory for Pi — verbatim session capture + grep retrieval |
| [`pi-composio`](https://github.com/k3-2o/pi-composio) | Pi extension — 6 meta tools for 1,000+ app integrations (Gmail, Slack, GitHub, etc.) via Composio's TypeScript SDK |
| [`pi-move`](https://github.com/k3-2o/pi-move) | Pi extension — `/move` command to switch directories from inside Pi |
| [`pi-read-image`](https://github.com/k3-2o/pi-read-image) | Local OCR for Pi — extracts text from screenshots and code images |

```bash
pi install git:github.com/k3-2o/pi-chrollo
pi install git:github.com/k3-2o/pi-composio
pi install git:github.com/k3-2o/pi-move
pi install git:github.com/k3-2o/pi-read-image
```

## License

MIT
