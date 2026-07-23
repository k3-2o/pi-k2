______________________________________________________________________

## name: skill-creator description: "Create, validate, and iterate on Pi skills. Use when the user wants to create a new skill, update an existing skill, validate a skill folder, or package improvements to a skill. Trigger words: skill, SKILL.md, init_skill, quick_validate, scaffold, new skill." compatibility: "Scripts in scripts/, run from this directory."

# Skill Creator

This skill provides guidance for creating effective skills that extend Pi's capabilities with specialized knowledge, workflows, or tool integrations.

## About Skills

Skills are modular, self-contained folders that extend Pi by providing specialized knowledge, workflows, and tools. They transform Pi from a general-purpose agent into a specialized agent equipped with procedural knowledge about specific domains or tasks.

Pi implements the [Agent Skills standard](https://agentskills.io/specification). Skills load on-demand: the agent sees the name and description at startup (always in context), and reads the full SKILL.md body only when the skill triggers.

### What Skills Provide

1. Specialized workflows — Multi-step procedures for specific domains
1. Tool integrations — Instructions for working with CLI tools or APIs
1. Domain expertise — Project-specific knowledge, conventions, business logic
1. Bundled resources — Scripts and reference docs for complex tasks

### How Pi Loads Skills

Pi discovers skills from these locations:

- **Global:** `~/.pi/agent/skills/`, `~/.agents/skills/`
- **Project:** `.pi/skills/`, `.agents/skills/` (cwd and ancestor dirs up to git root)
- **Packages:** `skills/` directories or `pi.skills` entries in `package.json`
- **Settings:** `skills` array in `settings.json`
- **CLI:** `--skill <path>` (repeatable, additive even with `--no-skills`)

In `~/.pi/agent/skills/` and `.pi/skills/`, direct root `.md` files are discovered as individual skills. In all locations, directories containing `SKILL.md` are discovered recursively.

Disable discovery with `--no-skills`. Use `--skill <path>` to load specific skills explicitly.

### Skill Commands

Skills register as `/skill:name` commands:

```
/skill:brave-search           # Load and execute the skill
/skill:pdf-tools extract      # Load skill with arguments
```

Arguments after the command are appended to the skill content as `User: <args>`.

Toggle via `enableSkillCommands` in settings (default: true in interactive mode).

## Core Principles

### Concise is Key

The context window is shared. Skills compete with system prompt, conversation history, other skills' metadata, and the actual user request.

**Default assumption: Pi is already very smart.** Only add context Pi doesn't already have. Challenge each piece of information: "Does Pi really need this explanation?" and "Does this paragraph justify its token cost?"

Prefer concise examples over verbose explanations.

### Set Appropriate Degrees of Freedom

Match specificity to the task's fragility and variability:

- **High freedom (text-based instructions):** Use when multiple approaches are valid, decisions depend on context, or heuristics guide the approach.
- **Medium freedom (pseudocode or scripts with parameters):** Use when a preferred pattern exists, some variation is acceptable, or configuration affects behavior.
- **Low freedom (specific scripts, few parameters):** Use when operations are fragile and error-prone, consistency is critical, or a specific sequence must be followed.

Pi explores a path — narrow bridges need guardrails (low freedom), open fields allow many routes (high freedom).

### Progressive Disclosure

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** — Always in context (~100 words)
1. **SKILL.md body** — Loaded when skill triggers (\<500 lines recommended)
1. **Bundled resources** — Loaded as needed by reading references/ or executing scripts/

#### Progressive Disclosure Patterns

Keep SKILL.md body under 500 lines. Split variant-specific details into reference files. When splitting, reference them from SKILL.md and describe clearly when to read them.

**Pattern 1: High-level guide with references**

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:
[code example]

## Advanced features

- **Form filling**: See [references/forms.md](references/forms.md)
- **API reference**: See [references/api.md](references/api.md)
```

Pi reads forms.md or api.md only when needed.

**Pattern 2: Domain-specific organization**

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── references/
    ├── finance.md
    ├── sales.md
    ├── product.md
    └── marketing.md
```

When the user asks about sales metrics, Pi only reads sales.md.

**Pattern 3: Conditional details**

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [references/docx-js.md](references/docx-js.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [references/redlining.md](references/redlining.md)
```

**Guidelines:**

- Keep references one level deep from SKILL.md
- For files >100 lines, include a table of contents at the top
- Avoid duplication — information lives in SKILL.md OR references/, not both

## Anatomy of a Skill

```
my-skill/
├── SKILL.md (required)
│   ├── YAML frontmatter (required)
│   │   ├── name: (required)
│   │   ├── description: (required)
│   │   ├── compatibility: (optional, max 500 chars)
│   │   ├── license: (optional)
│   │   ├── metadata: (optional)
│   │   ├── allowed-tools: (optional, experimental)
│   │   └── disable-model-invocation: (optional, true/false)
│   └── Markdown body (required)
├── scripts/ (optional)
│   └── helper scripts for deterministic/repeated tasks
└── references/ (optional)
    └── detailed docs loaded on-demand
```

### SKILL.md (required)

**Frontmatter (YAML):** Contains `name` and `description` — the only fields Pi reads to determine when the skill triggers. Be specific and comprehensive.

Pi supports these frontmatter fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars. Lowercase a-z, 0-9, hyphens. No leading/trailing hyphens. Unlike the Agent Skills standard, Pi does **not** require this to match the parent directory. |
| `description` | Yes | Max 1024 chars. What the skill does and when to use it. Include trigger scenarios. |
| `license` | No | License name or reference to bundled file. |
| `compatibility` | No | Max 500 chars. Environment requirements. |
| `metadata` | No | Arbitrary key-value mapping. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools (experimental). |
| `disable-model-invocation` | No | When `true`, skill is hidden from system prompt. Users must use `/skill:name`. |

**Body (Markdown):** Instructions for using the skill and its bundled resources. Only loaded after the skill triggers.

### Bundled Resources (optional)

#### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include:** When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Benefits:** Token efficient, deterministic, may be executed without loading into context
- **Note:** Scripts may still need to be read by Pi for patching or environment-specific adjustments

#### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Pi's process and thinking.

- **When to include:** For documentation that Pi should reference while working
- **Benefits:** Keeps SKILL.md lean, loaded only when Pi determines it's needed
- **Best practice:** If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication:** Information should live in either SKILL.md or reference files, not both

#### Assets

Pi skills can include any other files (templates, configs, etc.) but there is no dedicated `assets/` convention in Pi's spec — just place them in the skill directory and reference them with relative paths.

### What to Not Include

- README.md, CHANGELOG.md, INSTALLATION_GUIDE.md — these are for users, not the agent
- UI metadata files — Pi doesn't read them

The skill should only contain what the agent needs to do the job.

## Skill Creation Process

1. Understand the skill with concrete examples
1. Plan reusable skill contents (scripts, references)
1. Initialize the skill (run `init_skill.py`)
1. Edit the skill (implement resources and write SKILL.md)
1. Validate the skill (run `quick_validate.py`)
1. Iterate based on usage

Follow these steps in order, skipping only when there is a clear reason they don't apply.

### Skill Naming

- Use lowercase letters, digits, and hyphens only
- Normalize user-provided titles to hyphen-case (e.g., "Plan Mode" → `plan-mode`)
- Keep under 64 characters
- Prefer short, verb-led phrases
- Namespace by tool when it improves clarity (e.g., `gh-comment-resolve`, `linear-triage-bot`)
- Name the folder exactly after the skill name (for consistency, even though Pi doesn't enforce this)

### Step 1: Understand the Skill with Concrete Examples

Skip only when usage patterns are already clearly understood.

To create an effective skill, understand concrete examples of how it will be used:

- "What functionality should this skill support?"
- "Can you give examples of how this skill would be used?"
- "What would a user say that should trigger this skill?"
- "Where should I create it? Default is `~/.pi/agent/skills/` so Pi auto-discovers it."

Avoid asking too many questions in a single message. Start with the most important ones.

### Step 2: Plan the Reusable Skill Contents

For each concrete example, analyze:

1. How would you execute this from scratch?
1. What scripts, references, and other files would help when repeating these workflows?

Example: A `pdf-editor` skill for "Help me rotate this PDF":

1. Rotating a PDF requires re-writing the same code each time
1. A `scripts/rotate_pdf.py` script would be helpful

Example: A `frontend-builder` skill for "Build me a todo app":

1. Writing a frontend requires the same boilerplate each time
1. Template files in the skill directory would be helpful

### Step 3: Initialize the Skill

Skip if the skill already exists.

Ask where the user wants the skill created. If they don't specify, default to `~/.pi/agent/skills/` so Pi auto-discovers it.

```bash
python scripts/init_skill.py <skill-name> --path <output-directory> [--resources scripts,references]
```

Examples:

```bash
# Basic skill
python scripts/init_skill.py my-skill --path ~/.pi/agent/skills

# With resource directories
python scripts/init_skill.py my-skill --path ~/.pi/agent/skills --resources scripts,references

# With example files
python scripts/init_skill.py my-skill --path ~/.pi/agent/skills --resources scripts --examples

# Project-local skill (add to .pi/settings.json to enable)
python scripts/init_skill.py project-tools --path .pi/skills
```

The script:

- Creates the skill directory
- Generates a SKILL.md template with proper frontmatter and TODO placeholders
- Optionally creates resource directories
- Optionally adds example files

### Step 4: Edit the Skill

When editing, remember the skill is created for another Pi instance to use. Include information that would be beneficial and non-obvious. Consider what procedural knowledge or reusable assets would help another Pi execute these tasks more effectively.

#### Start with Reusable Skill Contents

Implement scripts/ and references/ first. This may require user input (e.g., brand assets, API docs).

Test scripts by actually running them to ensure they work. If there are many similar scripts, test a representative sample.

Delete any placeholder files that aren't needed.

#### Write the Frontmatter

```yaml
---
name: my-skill
description: What this skill does and when to use it. Be specific — include trigger scenarios. Max 1024 chars.
compatibility: "Environment requirements if any. Max 500 chars."  # optional
---
```

**Description best practices:** The description is the trigger. Be specific:

Good:

```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents.
```

Poor:

```yaml
description: Helps with PDFs.
```

Always include "when to use" information in the description — not in the body. The body is only loaded after triggering, so "When to Use This Skill" sections in the body aren't helpful.

#### Write the Body

Use imperative/infinitive form. Write instructions for using the skill and its bundled resources.

Structure options (adapt from these patterns, don't copy them literally):

1. **Workflow-Based** — sequential processes with clear steps
1. **Task-Based** — different operations or capabilities
1. **Reference/Guidelines** — standards or specifications
1. **Capabilities-Based** — interrelated features

Use relative paths for everything:

```markdown
See [the reference guide](references/REFERENCE.md) for details.
Run `python scripts/process.py <input>` to transform data.
```

### Step 5: Validate the Skill

```bash
python scripts/quick_validate.py <path/to/skill-folder>
```

The validation script checks:

- YAML frontmatter format and required fields
- Name rules (length, character restrictions)
- Description rules (length, content)
- Unexpected frontmatter keys

If validation fails, fix the reported issues and run again.

### Step 6: Iterate

After testing, you may detect that the skill needs improvement.

1. Use the skill on real tasks
1. Notice struggles or inefficiencies
1. Identify how SKILL.md or bundled resources should be updated
1. Implement changes and test again
1. Forward-test by using it yourself on realistic tasks

## Decision Tree: Choosing Skill Structure

```
Is it a sequence of steps?
  ├── Yes → Workflow-Based (e.g., deployment pipeline)
  └── No → ↓

Does it offer multiple independent operations?
  ├── Yes → Task-Based (e.g., PDF tool: merge, split, extract)
  └── No → ↓

Is it enforcing standards or conventions?
  ├── Yes → Reference/Guidelines (e.g., coding standards, brand guide)
  └── No → ↓

Is it a system with interrelated features?
  └── Yes → Capabilities-Based (e.g., project management hub)
```
