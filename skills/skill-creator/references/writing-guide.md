# Writing Guidance for Skill Content

> SKILL.md is authored for the agent only—not humans. If a human would need something, ask them directly rather than embedding it in the skill.

## Prefer

- Imperative, task-oriented instructions
- Concrete examples with realistic prompts
- Decision points ("if X, do Y")
- Short, scannable sections
- Script references for deterministic operations

## Avoid

- Long theory blocks with no execution value
- Ambiguous "just do best effort" for fragile tasks
- Hidden assumptions about environment/tools
- Prose that explains *why* without saying *what to do*
- Redundant information that's already in references/

## Trigger Description Quality

The frontmatter `description` determines when the agent loads the skill. Be specific about trigger conditions.

**Good:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges PDFs. Use when working with PDF documents.
```

**Poor:**
```yaml
description: Helps with PDFs.
```

## Context Budget

Every line in SKILL.md costs context tokens. Before adding content, ask:

1. Does this help the agent execute?
2. Is this already covered in a reference file?
3. Can this be a script instead of prose?

If the answer to #2 or #3 is yes, don't put it in SKILL.md.
