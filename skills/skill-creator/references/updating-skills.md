# Updating Existing Skills Safely

When improving an existing skill:

## Preserve Identity

1. **Do not change the skill id** in `_meta.json` unless there's a compelling reason (e.g., merge with another skill).
2. **Keep the skill name stable** unless the user explicitly requests a rename. A name change requires updating the directory and frontmatter.
3. **Bump version** in `_meta.json` for any substantive change.

## Snapshot Before Major Edits

For significant refactors:
- Copy the skill directory to `<skill-name>-backup-<timestamp>`
- Or use git branching if in a repo

This enables rollback if the refactor breaks behavior.

## Compatibility Notes

When behavior changes in a user-visible way, document it:

```markdown
## Changelog

### 1.1.0
- Added `--strict` flag to validator
- Changed: empty `scripts/` directories now warn instead of fail
```

## Re-run Quality Gates

After any substantial revision:
1. Run `quick_validate.py`
2. Run test suite
3. Run `package_skill.py` dry-run
4. Confirm archive contents are correct

## Self-Referential Edge Case

When using skill-creator to modify **skill-creator itself**:

- **Do not overwrite** `skill-creator/scripts/` with generated scripts
- The meta-skill's scripts are its own tooling, not templates
- Update SKILL.md and references, but leave scripts intact unless intentionally changing tooling
- Run validation against `skill-creator/` as you would any other skill
