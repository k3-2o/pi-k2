---
name: docs-skill
description: "Write excellent documentation for any project — READMEs, API references, architecture docs, tutorials, how-to guides, contribution guides, and changelogs. Covers audience-first writing, the Diátaxis framework (tutorials, how-to, reference, explanation), documentation ethics, style principles, and docs-as-code workflows. Trigger words: write docs, documentation, document this, how to document, README, docstring, API docs, changelog, contributing guide, user guide, tutorial, explanation, architecture decision record, ADR, technical writing."
compatibility: "Works with any language or framework. No external tools required."
---

# Docs Skill — Writing Documentation That Serves

## Core Philosophy

Documentation is an **ethical responsibility** to your users and your future self. Code without documentation is a puzzle — the reasoning, constraints, and design decisions that shaped it are invisible. Good documentation makes software **usable, maintainable, and trustworthy**.

### Why Documentation Matters

| Audience | What they need | What happens without it |
|---|---|---|
| **New users** | Know what the project does and why they should care | They leave |
| **Onboarding devs** | Install, configure, and make a first successful call | They waste hours, file issues, or give up |
| **Existing users** | Solve a specific problem with a specific feature | They search Stack Overflow, file bugs, or fork |
| **Contributors** | Understand architecture, conventions, and how to submit changes | They send wrong PRs or don't bother |
| **Future you (6 months from now)** | Remember why decisions were made | You treat your own code as foreign |

### Documentation Ethics (The ACM Guide)

1. **Be honest.** Don't oversell features, hide limitations, or document what doesn't exist. Wrong docs are worse than no docs.
2. **Be inclusive.** Use plain language, avoid jargon where possible, and provide accessible examples. Documentation is for everyone who needs it, not just domain insiders.
3. **Be accountable.** When you deprecate something, document the migration path. When you break API contracts, document the change and its rationale.
4. **Be current.** Stale documentation is misleading. Treat docs as first-class citizens alongside code — update them in the same PR.
5. **Respect your reader's time.** Structure for skimming. Lead with the answer. Don't bury the lede in prose.

---

## Decision Tree: What Kind of Doc to Write

Start here. Match the user's need to the documentation type.

```
What is the reader trying to do?
│
├── "I'm new, teach me the basics"
│   → TUTORIAL (learning-oriented, step-by-step)
│
├── "I need to solve a specific problem"
│   → HOW-TO GUIDE (task-oriented, practical steps)
│
├── "I need to look something up"
│   → REFERENCE (information-oriented, precise, complete)
│
└── "I need to understand why it works this way"
    → EXPLANATION (understanding-oriented, context, reasoning)
```

Each type has a specific purpose, audience, and tone. Never mix types in a single document — it confuses readers and dilutes the value of each.

---

## The Four Documentation Types (Diátaxis Framework)

### 1. Tutorials — Learning-Oriented

**Goal:** Guide a newcomer to a successful first outcome. Build confidence.

**How to write:**
- Start from absolute zero. Assume nothing.
- One clear path from A to B. No branches, no alternatives, no "advanced" tangents.
- Every step must succeed — test the tutorial yourself on a clean machine.
- Show the expected output at each step so the reader can verify.
- Keep it short. A tutorial that takes longer than 30 minutes to complete will be abandoned.

**Tone:** Encouraging, patient, explicit. "Now you'll create a file called..."

**Avoid:** Theory, explanations of alternatives, architecture discussions, edge cases.

**Checklist:**
- [ ] Reader can complete it in one sitting (<30 min)
- [ ] No unexplained prerequisites
- [ ] Every command/code block is tested
- [ ] Expected output is shown
- [ ] No branching paths or "for experts" sections

### 2. How-to Guides — Task-Oriented

**Goal:** Solve a real problem a user has right now.

**How to write:**
- Start with the problem statement in the title or first sentence: "How to reset a user's password"
- Assume the reader has basic competence but not deep domain knowledge.
- Give steps in the order they should be performed.
- Include the reasoning only when necessary for safety (e.g., "Delete this file first to avoid a conflict").
- One guide = one problem. Don't solve three problems in one document.

**Tone:** Direct, practical, authoritative. "To reset the password, run:"

**Avoid:** Teaching fundamentals (that's a tutorial), long explanations (that's an explanation), listing every API option (that's reference).

**Checklist:**
- [ ] Title clearly states the problem being solved
- [ ] Prerequisites are listed upfront
- [ ] Steps are in execution order
- [ ] Warnings and pitfalls are called out
- [ ] Each step has a verifiable outcome

### 3. Reference — Information-Oriented

**Goal:** Provide accurate, complete, authoritative descriptions of the system's components.

**How to write:**
- Be exhaustive. Every parameter, every option, every return value.
- Be precise. No ambiguity, no opinions, no design rationale.
- Be consistent. Use the same terminology and format throughout.
- Be addressable. Every entry should be linkable (permalink-friendly).
- Auto-generate where possible. Reference docs should be extracted from code/OpenAPI/schema when feasible.

**Tone:** Neutral, factual, concise. "The `--timeout` flag sets the maximum wait time in seconds."

**Avoid:** Tutorial content, problem-solving, teaching concepts, opinions.

**Checklist:**
- [ ] Every public API surface is covered
- [ ] Parameters and return values are documented with types
- [ ] Examples show realistic usage
- [ ] Error conditions are documented
- [ ] Auto-generated where possible (keeps it honest)

### 4. Explanation — Understanding-Oriented

**Goal:** Provide context, background, and reasoning. Answer "why" questions.

**How to write:**
- Start with the higher-level concept or design principle.
- Use analogies, diagrams, and comparisons liberally.
- This is where you document design decisions, trade-offs, and historical context.
- Reference external sources (papers, specs, blog posts) to deepen understanding.
- Never include executable instructions — those belong in tutorials and how-tos.

**Tone:** Reflective, thorough, discursive. It's the only type where prose is welcome.

**Avoid:** Step-by-step instructions, API listings, setup procedures.

**Checklist:**
- [ ] Explains the reasoning behind design choices
- [ ] Discusses trade-offs and why decisions were made
- [ ] Includes diagrams or visual aids if the concept is complex
- [ ] Links to related tutorials, how-tos, and reference docs
- [ ] Does not contain setup instructions or commands to run

---

## Anatomy of Common Documents

### README

The README is the **front door** of your project. It's the most-read document. It must answer three questions in the first paragraph:

1. **What is this?** — One-sentence description of the project.
2. **Why should I care?** — What problem it solves, who it's for.
3. **How do I get started?** — The shortest possible path to a success experience.

**Structure:**

```markdown
# Project Name

> One-line description. Clear, benefit-driven.

## Features

Bullet list of 3-5 key capabilities. Why someone would choose this.

## Quick Start

The absolute shortest path from zero to working. Copy-paste friendly.

```bash
pip install my-thing
my-thing --do-stuff
```

## Usage

Short examples of common use cases. Show the most important 2-3 patterns.

## Documentation

Link to the full docs site or key documents.

## Contributing

Brief note on how to contribute. Link to CONTRIBUTING.md.

## License

MIT — see LICENSE.
```

### API Reference

- One entry per endpoint/function/class
- Signature with types
- Description of what it does (not how)
- Parameters table (name, type, required, description, default)
- Return value with type
- Error conditions
- One realistic example
- Keep it auto-generated and versioned alongside the code

### Changelog

- **Semantic versioning:** `MAJOR.MINOR.PATCH` with clear boundaries
- **Sections per release:** `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
- **Keep a Changelog** format (see [keepachangelog.com](https://keepachangelog.com))
- Each entry is one line, past tense, imperative mood
- Link to issues/PRs where helpful
- Never editorialize or explain rationale — that's for the commit message or ADR

```
## [2.0.0] — 2025-06-15

### Added
- Rate limiting with configurable thresholds (#142)
- Webhook signature verification (#138)

### Changed
- Authentication now requires API key in header (was query param)
- Dropped support for Python 3.8

### Removed
- Legacy v1 API endpoints (deprecated since 1.5.0)
```

### Architecture Decision Record (ADR)

Use ADRs to document significant architectural choices. Each ADR covers one decision.

- **Title:** `ADR-001: Use PostgreSQL for primary storage`
- **Context:** What forced this decision? What options were considered?
- **Decision:** What was chosen? Explicitly state the decision.
- **Consequences:** What trade-offs were accepted? What does this enable or constrain?

ADRs are **immutable** once written. If the decision is revisited, write a new ADR that supersedes it.

### Contribution Guide (CONTRIBUTING.md)

- Development setup (clone, install dependencies, run)
- Coding conventions (linter, formatter, commit message format)
- PR workflow (branch naming, review process, merge strategy)
- Testing expectations (what tests to write, how to run them)
- Communication channels (where to ask questions)

---

## Style Principles

### Lead with the Answer

When a reader lands on a page, the first thing they see should tell them whether this page is what they need. Use **inverted pyramid** structure:

1. **Title** — what this page is about
2. **First paragraph** — what the reader will learn or accomplish
3. **Body** — the details, in order of importance

### Write for Skimming

- Use descriptive headings (not "Overview" — use "How Authentication Works")
- Use numbered lists for sequential steps
- Use bullet lists for non-sequential items
- Use bold for key terms and UI elements
- Use code blocks for commands, code, and file contents
- Put one idea per paragraph

### Prefer Active Voice

| Avoid | Prefer |
|---|---|
| The configuration file can be edited by the user | Edit the configuration file |
| It is recommended that backups are created | Create a backup |
| The API key must be set | Set the API key |

### Be Concise

- Cut every word that doesn't add meaning
- "In order to" → "To"
- "A number of" → "Several" or the actual count
- "Utilize" → "Use"
- "For the purpose of" → delete it

### Use Realistic Examples

- Example values should look real: `user@example.com`, not `foo@bar`
- Example names should be culturally inclusive: Use `alex`, `jordan`, `sam` across genders
- Example code should compile/run — test it
- Show the output alongside the code

### Don't Say "Simply" or "Just"

These words insult the reader when something is not simple to them. Delete them from your vocabulary.

---

## Documentation Process

### Docs-as-Code

Treat documentation like code:
- **Version control:** Docs live in the same repo as the code
- **Review process:** Docs changes go through the same PR review as code
- **CI/CD:** Test docs builds, check for dead links, validate code examples
- **Blame:** `git blame` works on docs too — every line is attributable

### Writing Workflow

1. **Audience:** Who is reading this? What do they need?
2. **Purpose:** Which Diátaxis type does this belong to?
3. **Outline:** Headings before sentences. Get the structure right first.
4. **Draft:** Write without editing. Get the ideas down.
5. **Edit:** Cut ruthlessly. Verify every claim. Test every example.
6. **Review:** Get a fresh pair of eyes — ideally someone from the target audience.
7. **Ship:** Merge alongside the code change, never after.

### Keeping Docs Current

- **Same PR rule:** If a code change affects behavior, the docs change is in the same PR. Not later. Not "in a follow-up."
- **Deprecation notices:** When deprecating a feature, mark it in docs before removing it. Give users one release cycle of warning.
- **Stale doc detection:** Periodically review docs for accuracy. Treat stale docs as bugs — file them, prioritize them.
- **Link checking:** Use automated link checkers to catch 404s before they reach users.

### What NOT to Document

- Internal implementation details that have no user-facing impact
- Trivial or obvious steps (installing dependencies is implicit for most audiences)
- Things that change too frequently — let auto-generated reference cover them
- Vendored opinions that aren't project decisions ("we use tabs because tabs are better")

---

## Diagnostic Questions

When reviewing existing docs or planning new ones, run through these:

1. **Who is the audience?** Be specific. "Developers" is too broad. "Python backend developers new to async" is a real audience.
2. **What is the goal?** After reading, what should the reader be able to do or know?
3. **Is it discoverable?** Can someone find this doc from the README? From search? From the code itself?
4. **Is it addressable?** Can I link someone to the exact section that answers their question?
5. **Is it testable?** Can I verify that every command, code block, and claim is correct?
6. **Is it duplicative?** Does this information already exist elsewhere? If so, link don't repeat.
7. **Does it respect the reader's time?** Is this the shortest way to communicate this information?

---

## See Also

- [Diátaxis framework](https://diataxis.fr/) — The four-type documentation model
- [Write the Docs](https://www.writethedocs.org/guide/) — Community-curated documentation guide
- [Keep a Changelog](https://keepachangelog.com/) — Changelog format standard
- [Producing OSS](https://producingoss.com/) — Guide to running open source projects
