# pi-k2

**k3-2o's personal pi coding agent config** — extensions, themes, skills, and prompts bundled as a pi package.

## What's included

### Extensions

| File | Description | Source |
|------|-------------|--------|
| `ask-user-question.ts` | Ask the user multiple-choice questions | [pi-k2](https://github.com/k3-2o/pi-k2) |
| `clipboard.ts` | Copy text to system clipboard | [pi-k2](https://github.com/k3-2o/pi-k2) |
| `web_search.ts` | Web search, discovery, and extraction | [pi-k2](https://github.com/k3-2o/pi-k2) |

### Themes

| File | Description | Source |
|------|-------------|--------|
| `catppuccin-mocha.json` | Catppuccin Mocha | [pi-k2](https://github.com/k3-2o/pi-k2) |
| `dracula.json` | Dracula | [pi-k2](https://github.com/k3-2o/pi-k2) |
| `my-catppuccin-mocha.json` | Custom Catppuccin Mocha variant | [pi-k2](https://github.com/k3-2o/pi-k2) |
| `nightowl.json` | Night Owl | [pi-k2](https://github.com/k3-2o/pi-k2) |

### Skills

| Directory | Description | Source |
|-----------|-------------|--------|
| `prism/` | Structural code analysis — cyclomatic complexity, nesting depth, dead functions, code clones, and more across 12 languages | [k3-2o/prism](https://github.com/k3-2o/prism) |
| `scope/` | Codebase exploration — entry points, symbol maps, and test/source pairing across 25+ languages | [k3-2o/scope](https://github.com/k3-2o/scope) |
| `skill-creator/` | Create, refactor, validate, and package Agent Skills | [pi-k2](https://github.com/k3-2o/pi-k2) |
| `youtube-transcript/` | Fetch YouTube video transcripts and summarize | — |

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

```bash
pi install git:github.com/k3-2o/pi-read-image
```

## License

MIT
