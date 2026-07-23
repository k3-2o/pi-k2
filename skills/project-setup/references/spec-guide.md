# Spec Guide — The Alzheimer's Format

> Write every specification like you have Alzheimer's and this document is
> your only lifeline. Tomorrow you will remember nothing. This document must
> contain everything a competent engineer needs to rebuild the project from
> scratch, understand every decision, and avoid every pitfall you discovered
> today.

______________________________________________________________________

## The Mindset

You are an eloquent and highly intelligent senior engineer who knows that if
you don't write everything down, you will forget it by tomorrow and lose your
job. Writing this document is self-preservation tier emergency.

**This means:**

- No assumption is "too obvious" to write down
- No decision is "too small" to explain
- No risk is "too unlikely" to mention
- No trade-off is "too clear" to state explicitly
- No alternative is "too stupid" to record (the reasons it was rejected are valuable)

You are not writing for an audience that knows what you know. You are writing
for yourself tomorrow — who remembers nothing.

______________________________________________________________________

## Document Structure

### 1. Overview

One paragraph: What is this project? What problem does it solve? Who is it for?

### 2. Goals & Non-goals

**Goals** — what this project must achieve. Be specific. "Handle 10K requests/second" not "be fast."

**Non-goals** — what this project explicitly does NOT do. This prevents scope creep
and makes the boundary clear. If someone later asks "why doesn't it do X?", the
answer is in the spec.

### 3. Architecture Decisions

For every architectural choice:

| Question | Answer |
|----------|--------|
| What was chosen? | The actual decision |
| What were the alternatives? | Every serious option considered |
| Why was this chosen? | The reasoning, with specifics |
| What are the trade-offs? | What you gain and what you sacrifice |
| What would change this decision? | The conditions that would justify a different choice |

**Every decision gets this treatment.** No exceptions. The file structure, the
package manager, the test framework, the error handling strategy, the config
format — all of it.

### 4. File-by-File Breakdown

List every file in the project and explain:

```
src/main.py          — Entry point. Parses CLI args, dispatches to handlers.
                       Uses argparse because [reason]. Handles these exit codes: ...
src/config.py        — Config loader. Reads YAML from ~/.config/<tool>/config.yaml.
                       Falls back to defaults. Validates schema with pydantic.
tests/test_config.py — Tests for config loading: missing file, invalid YAML, etc.
```

For each file:

- **What it does** — the responsibility
- **Why it exists** — why this responsibility needed its own file
- **Key design decisions** — anything non-obvious in the implementation
- **Edge cases** — what happens at the boundaries

### 5. Dependencies

| Dependency | Version | Why | Risk |
|------------|---------|-----|------|
| pyyaml | >=6.0 | YAML config parsing | Stable, widely used, low risk |
| rich | >=13.0 | Terminal formatting | Heavy dependency, consider alternatives |
| ... | ... | ... | ... |

For each:

- Why this dependency over alternatives
- What version constraints apply and why
- Known risks (abandoned, breaking changes incoming, license issues)

### 6. Data Flow

How data moves through the system. For a CLI tool:

```
User input → CLI parser → validation → handler → (maybe API call) → output formatting → stdout/stderr
```

For a service:

```
Request → middleware → auth → rate limiter → handler → DB query → response → logging
```

Include:

- Entry points
- State mutations
- Error paths (what happens when each step fails)
- Exit codes / response codes

### 7. Configuration Surface

Every config option, its type, default, and what it controls:

```yaml
# ~/.config/<tool>/config.yaml
verbose: false       # Enable verbose logging
timeout: 30          # HTTP request timeout in seconds
output: json         # Output format: json, yaml, table
```

If the config is complex, include a full annotated example.

### 8. Testing Strategy

- **What is tested at each level** (unit, integration, e2e)
- **What is tricky to test** and how you handle it (mocking, fixtures, test doubles)
- **What is NOT tested** and why (acceptable risk)
- **How to run tests** — the exact commands
- **Coverage targets** and what's measured

### 9. Risks & Unknowns

Things you don't know yet. Things that could go wrong. Things that scare you.

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dependency X drops Python 3.12 support | Low | High | Pin version, monitor releases |
| Y feature might not scale past 10K users | Medium | Medium | Load test before launch |
| Z is a known footgun | Medium | High | Add CI check, document in code |

### 10. Future Work

Things explicitly deferred. Not forgotten — deferred. Each with a note on why
it wasn't done now and what would trigger doing it later.

______________________________________________________________________

## Writing Style

- **Be specific.** "Fast" is not a requirement. "\<100ms p99" is.
- **Be honest.** If you're unsure, say so. "We think X is true because Y, but
  we haven't verified Z."
- **Be complete.** If a thought crosses your mind while writing, capture it.
  Don't trust yourself to remember later.
- **Be structured.** Use headings, tables, lists. Make the document scannable.
  Tomorrow-you will be grateful.
- **Be ruthless about "why."** Every time you state something, ask yourself
  "why?" and write the answer. The what changes. The why survives.

______________________________________________________________________

## The Test

After writing, ask yourself:

> If I read this document tomorrow with no memory of the project, could I:
>
> 1. Understand what we're building and why?
> 1. Set up the dev environment from scratch?
> 1. Know which decisions were made and why alternatives were rejected?
> 1. Identify the riskiest parts of the system?
> 1. Write code that fits the architecture without contradicting existing decisions?

If the answer to any of these is "no," keep writing.
