# Behavior Evaluation Loop

For new or heavily modified skills, run an evaluation loop to validate behavior before release.

## Preparation

1. **Prepare 3-10 realistic eval prompts** that represent actual user requests the skill should handle
2. **Define success criteria** for each prompt (what output/artifact is expected)
3. **Identify baseline** (no-skill run, or previous skill version) for comparison

## Execution

Run each eval prompt:
- With the skill loaded
- Without the skill (baseline comparison)
- With previous version (if updating)

## Scoring Dimensions

Evaluate each run against:

| Dimension | Objective Check |
|-----------|-----------------|
| Triggered correctly | Skill loaded when it should have |
| Correct phase | Agent entered the right workflow phase |
| Output quality | Produced expected artifact(s) |
| Script success | Scripts ran without error |
| Completion | Agent reached Definition of Done |

For subjective dimensions (clarity, helpfulness), collect qualitative notes.

## Example Eval Prompts

For skill-creator specifically:

1. **Basic creation:** "Create a skill that extracts text from images using OCR"
   - Expected: Phases 1-4 executed, SKILL.md + _meta.json created, validation passes

2. **With scripts:** "Create a skill for validating JSON schemas, include a script for checking schema compliance"
   - Expected: scripts/ created with validator, tests added

3. **Refactor:** "The pdf-tools skill is too long, refactor it to be more concise"
   - Expected: Content moved to references/, SKILL.md trimmed, validation still passes

4. **Packaging:** "Package my new skill for distribution"
   - Expected: Phase 6 runs, .skill artifact produced

## Avoid Overfitting

- Keep a held-out mini set (1-2 prompts) for final confirmation
- Prefer improvements that generalize across multiple prompts
- If a fix only helps one prompt, it may be overfitting

## Iterate

1. Score all prompts
2. Identify patterns in failures
3. Revise skill content
4. Re-run failed prompts
5. Repeat until all prompts pass or gaps are documented
