# pi-k2

**k3-2o's personal pi coding agent config** — extensions, themes, skills, and prompts bundled as a pi package.

## What's included

### Extensions

| File | Description |
|------|-------------|
| `ask-user-question.ts` | Ask the user multiple-choice questions |
| `clipboard.ts` | Copy text to system clipboard |
| `web_search.ts` | Web search, discovery, and extraction |

### Themes

| File | Description |
|------|-------------|
| `catppuccin-mocha.json` | Catppuccin Mocha |
| `dracula.json` | Dracula |
| `my-catppuccin-mocha.json` | Custom Catppuccin Mocha variant |
| `nightowl.json` | Night Owl |

### Skills

| Directory | Description |
|-----------|-------------|
| `prism/` | Structural code analysis — cyclomatic complexity, nesting depth, dead functions, code clones, and more across 12 languages. Use with CLI tool [`prism`](https://github.com/k3-2o/prism). |
| `scope/` | Codebase exploration — entry points, symbol maps, and test/source pairing across 25+ languages. Use with CLI tool [`scope`](https://github.com/k3-2o/scope). |
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
| [`pi-read-image`](https://github.com/k3-2o/pi-read-image) | Local OCR for Pi — extracts text from screenshots and code images |
| [`pi-chrollo`](https://github.com/k3-2o/pi-chrollo) | Agentic memory for Pi — verbatim session capture + grep retrieval |
| [`pi-move`](https://github.com/k3-2o/pi-move) | Pi extension — `/move` command to switch directories from inside Pi |

```bash
pi install git:github.com/k3-2o/pi-read-image
pi install git:github.com/k3-2o/pi-chrollo
pi install git:github.com/k3-2o/pi-move
```

## License

MIT
