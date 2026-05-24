# Engineering Standards for Skills

When authoring or refactoring `skill-creator`-style skills, apply these standards:

## Validation-First

Provide machine-checkable constraints, not just prose. If a rule can be checked by a script, write the script.

**Example:** Instead of "skill names should be lowercase", the validator checks `^[a-z0-9-]+$` and fails on violation.

## Testable Scripts

Include unit/regression tests for critical scripts. At minimum, smoke tests that exercise the happy path.

**Minimum test coverage:**
- Validator runs without error on a valid skill
- Packager produces an archive with expected contents

## Failure Transparency

Errors should be explicit and actionable. A user should know:
- What failed
- Why it failed
- What to do next

**Bad:** "Validation failed"
**Good:** "SKILL.md missing required frontmatter key: description. Add a description field between the --- markers."

## Idempotent Commands

Reruns should be safe when practical. If a script creates files, it should either:
- Skip if the file exists and is valid, or
- Overwrite safely with a warning

**Example:** `init_skill.py` fails if the target directory exists, preventing accidental overwrites.

## Minimal Trusted Surface

Avoid broad file inclusion rules. Explicitly list what to package. Reject:
- Symlinks that escape the skill root
- Files matching `.env`, `*.pem`, `credentials.*`
- Build artifacts (`node_modules/`, `__pycache__/`, `.git/`)
