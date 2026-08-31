# Pi Platform Facts

## Discovery locations

- Global: `~/.pi/agent/skills/`, `~/.agents/skills/`
- Project: `.pi/skills/`, `.agents/skills/` (cwd and ancestors up to the git root)
- Packages: `skills/` directories or `pi.skills` entries in `package.json`
- Settings: `skills` array in `settings.json`
- CLI: `--skill <path>` (repeatable; works even with `--no-skills`)

Root `.md` files in `~/.pi/agent/skills/` and `.pi/skills/` load as individual skills. Directories containing `SKILL.md` load recursively from every location.

`--no-skills` disables discovery. Skills register as `/skill:name` commands; arguments are appended as `User: <args>`.

## Frontmatter fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Max 64 chars, lowercase a-z, 0-9, hyphens; folder match recommended, not required |
| `description` | yes | Max 1024 chars; what + when + trigger phrases |
| `compatibility` | no | Max 500 chars; environment requirements |
| `license` | no | Name or reference to a bundled file |
| `metadata` | no | Arbitrary key-value mapping |
| `allowed-tools` | no | Space-delimited pre-approved tools (experimental) |
| `disable-model-invocation` | no | `true` hides the skill from the system prompt; `/skill:name` only |

## Do not include

README, CHANGELOG, installation guides, UI metadata files. The skill contains only what the agent needs to do the job.
