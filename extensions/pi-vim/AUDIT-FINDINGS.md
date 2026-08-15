# Audit Findings — pi-vim

**Baseline**: `d153ac9` — tests: none (no test suite)
**Status**: all findings fixed → verified

---

### 🔴 Blocker

#### [A-05] Cursor rendered inside ANSI escape code during visual mode selection
- **Source**: Leg 1 (adversarial)
- **File**: `src/editor.ts:489-491`
- **What**: When cursor is INSIDE the visual selection (not after it), `cursorPos` was over-adjusted by 9 bytes (REV_OVERHEAD = REV_ON + REV_OFF) but only 5 bytes (REV_ON) were added before the cursor. The 4-byte over-shift landed cursor rendering inside the `\x1b[0m` (REV_OFF) ANSI escape sequence, potentially corrupting terminal state.
- **Also**: During the fix, a closing brace was incorrectly removed, leaving the outer `if (ll.hasCursor...)` unclosed. This caused a TS1005 syntax error on the next tsc run. Fixed in the same pass.
- **Status**: `fixed → verified` — commit `c4f8f35` (pending), diff re-scan clean

### 🟡 Concerning

#### [A-06] Motions array recreated on every visual mode keypress
- **Source**: Leg 1 (adversarial)
- **File**: `src/editor.ts:395`
- **What**: `const motions = [...]` array allocated on every keypress in visual mode
- **Status**: `fixed → verified` — moved to module-level `VISUAL_MOTIONS` constant

---

### ✅ Previously Fixed

#### [A-01] Module-level state leaking across sessions — `fixed → verified` (commit `1f6446f`)
#### [A-02] `ctx` typed as `any` — `fixed → verified` (commit `1f6446f`)
#### [A-03] Visual type toggle not updating status — `fixed → verified` (commit `1f6446f`)
#### [A-04] Yank buffer paste direction (x/X/s/S) — `fixed → verified` (commit `9147c33`)
