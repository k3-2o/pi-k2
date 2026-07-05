# Leg 2: Codebase Intelligence

## Overview

Leg 2 is about measuring what's healthy and what's rotten across the full spectrum — dead code, complexity, architecture, dependencies, security, types, duplication, churn. You use real tools to do it.

**Golden Rule**: Ask the user before installing anything.

**If you don't know a tool** — run `curl` or write a quick Python script to check the tool's docs, README, or `--help` output. Don't guess flags. Research it until you understand what it does and how to run it correctly.

### Judge by the weight of the codebase

Not every project needs everything in this reference. Judge what's proportionate:

- **A 200-line script** needs nothing. Read it.
- **A small CLI tool** (500-2000 lines) maybe needs a type checker + one linter. That's it.
- **A mid-size app** (5K-50K lines) benefits from dead code detection, complexity analysis, a security scan.
- **A large codebase** (50K+ lines) justifies the full spectrum — architecture, churn, duplication, deps.
- **A library/package** needs semver checking, type coverage, dead exports. Maybe skip architecture.
- **A prototype/fork** — just the fast checks. Don't deep-dive something that'll be rewritten.

**Always tell the user what you're running and why.** Before you install or run anything, say:

> "This project is ~15K lines of TypeScript. I'll run knip for dead code, tsc --strict for types, and semgrep for security. Should take ~30 seconds. The heavier tools (architecture graph, churn analysis) don't seem warranted here unless you disagree."

If the user says skip it, skip it. If they want the full treatment, run the full treatment. Your judgment sets the default; their call sets the scope.

---

## How to Use This

1. Detect the project language(s)
2. Find the matching section below
3. For each tool: **check if it exists first** — `which <tool>`, `tool --version`, or lookup the install path. If it's missing, install it (ask the user first).
4. Run the tools — start with the multi-signal ones, then drill into specific domains
5. Collect and categorize findings
6. Merge with Leg 1 findings

---

## TypeScript / JavaScript

### Multi-signal (run first — cover the most ground)

| Tool | What it catches | Run |
|------|----------------|-----|
| **Fallow** | Dead code, duplication, circular deps, complexity hotspots, architecture boundaries, design-system drift. Rust-native, sub-second, zero-config. | `npx fallow` or `npx @fallow-rs/cli` |
| **Sickbay** | Health check: 34 integrated checks across dependency health, security, code quality, performance, git health. Framework-aware (React, Next, etc.) | `npx sickbay` |

### Dead code

| Tool | What it catches | Run |
|------|----------------|-----|
| **knip** | Dead files, unused exports, unused dependencies | `knip --include-libs` |
| **Codescythe** | Dead-code analyzer + remover. Entry/project graph analysis, unused source exports/files. Smaller/faster alternative to knip | `npx codescythe` |
| **ts-prune** | Unused TypeScript exports | `npx ts-prune` |

### Architecture & structure

| Tool | What it catches | Run |
|------|----------------|-----|
| **Boundary Atlas** | Import graphs, cycles, deep imports, boundary drift. Local-first, uses ts-morph | `npx boundary-atlas` |
| **OpenCortex** | Code intelligence engine: symbols, call chains, community detection, blast-radius analysis. Parses into structural knowledge graphs | `npx opencortex` |
| **dependency-cruiser** | Dependency graph, cyclic deps, module layering violations | `npx depcruise --init` |

### Types

| Tool | What it catches | Run |
|------|----------------|-----|
| **TypeScript strict** | Strict type checking gaps | `npx tsc --noEmit --strict` |
| **ts-expect-error count** | Number of suppressed type errors | `rg '@ts-expect-error' --type ts \| wc -l` |

### Linting & quality

| Tool | What it catches | Run |
|------|----------------|-----|
| **ESLint** | Linting, code quality rules | Use project config or `npx eslint .` |
| **Inkode** | Cross-file structural and security signal that ESLint doesn't cover. Complexity outliers, vulnerable packages, dead exports, empty catch blocks, semantic duplicates | `npx ik run` |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **depcheck** | Unused dependencies | `npx depcheck` |
| **npm audit** | Known vuln deps | `npm audit` |
| **snyk** (if available) | Deep dependency scanning | `snyk test` |

---

## Python

### Multi-signal (run first)

| Tool | What it catches | Run |
|------|----------------|-----|
| **ruff** | 700+ rules, Rust-native. Replaces flake8 + isort + pydocstyle + pyupgrade + more. Covers linting, complexity, bug patterns | `ruff check .` |

### Dead code

| Tool | What it catches | Run |
|------|----------------|-----|
| **vulture** | Dead code | `vulture . --min-confidence 80` |

### Types

| Tool | What it catches | Run |
|------|----------------|-----|
| **mypy** | Type errors | `mypy . --strict` |
| **pyright** | Microsoft's type checker, faster than mypy, deeper inference | `npx pyright` |
| **pyre** | Facebook's type checker, incremental checking | `pyre check` |

### Quality & complexity

| Tool | What it catches | Run |
|------|----------------|-----|
| **pylint** | Comprehensive linting, semantic analysis, naming, complexity | `pylint **/*.py` |
| **xenon** | Complexity monitoring (wraps radon) — enforces cyclomatic complexity thresholds | `xenon . --max-absolute B --max-modules A --max-average A` |
| **radon** | Raw metrics: cyclomatic complexity, maintainability index, SLOC | `radon cc . -s` |

### Security

| Tool | What it catches | Run |
|------|----------------|-----|
| **bandit** | Security issues (47 AST checks) | `bandit -r .` |
| **semgrep** | Custom security + quality patterns across 30+ languages | `semgrep --config=auto` |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **pip-audit** | Known vuln deps | `pip-audit` |
| **safety** | Vulnerable package scanning | `safety check` |

---

## Go

### Multi-signal

| Tool | What it catches | Run |
|------|----------------|-----|
| **golangci-lint** | Aggregates 60+ linters in one runner. Covers dead code, style, bugs, performance, complexity, security | `golangci-lint run ./...` |
| **staticcheck** | Bugs, performance, simplicity. Used standalone or inside golangci-lint | `staticcheck ./...` |

### Dead code

| Tool | What it catches | Run |
|------|----------------|-----|
| **deadcode** | Finds unreachable functions (official golang.org/x/tools) | `go install golang.org/x/tools/cmd/deadcode@latest` |
| **unused** | Unused functions, types, variables (included in golangci-lint) | `golangci-lint run --enable unused` |

### Security

| Tool | What it catches | Run |
|------|----------------|-----|
| **gosec** | 30+ security checks, purpose-built for Go | `gosec ./...` |
| **semgrep** | Custom security patterns | `semgrep --config=auto` |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **govulncheck** | Go team's vulnerability scanner. Reports only reachable vulns | `govulncheck ./...` |
| **go mod verify** | Dependency integrity check | `go mod verify` |

### Specific domains

| Tool | What it catches | Run |
|------|----------------|-----|
| **nilaway** | Nil panic detection (Uber) | `nilaway ./...` |
| **goleak** | Goroutine leak detection | `go test -v -run TestLeak` |
| **fieldalignment** | Struct size optimization | `go vet -lostcancel ./...` (combined) |

---

## Rust

### Multi-signal

| Tool | What it catches | Run |
|------|----------------|-----|
| **clippy** | 700+ lints, built into rustup. Covers style, correctness, complexity, performance | `cargo clippy --all-targets --all-features -- -D warnings` |
| **rust-doctor** | Unified health tool: 700+ clippy lints + 19 custom AST rules for error handling, performance, security, async, architecture. Produces 0-100 health score | `cargo doctor` |
| **rustqual** | 7 quality dimensions: IOSP, Complexity, DRY, SRP, Coupling, Test Quality, Architecture. Scores each file 0-100 | `cargo rustqual` |

### Dead code

| Tool | What it catches | Run |
|------|----------------|-----|
| **clippy** | `dead_code` lint (project-wide, can be noisy on large codebases) | Part of clippy |
| **wire-check** | Detects code that compiles but isn't connected to anything — modules not integrated into the call graph. CI-gateable | `cargo wire-check` |

### Architecture & correctness

| Tool | What it catches | Run |
|------|----------------|-----|
| **pedant** | Style enforcement + capability detection + security rules. Combines what clippy doesn't cover | `cargo pedant` |
| **cargo-semver-checks** | API semver violation detection. Catches breaking changes before release | `cargo semver-checks` |
| **cargo-kimi** | Contract quality scoring: Hoare triples (pre/post conditions on pub fns), panic safety (no unwrap/expect outside tests), type discipline | `cargo kimi` |

### Security

| Tool | What it catches | Run |
|------|----------------|-----|
| **semgrep** | Custom security patterns | `semgrep --config=auto` |
| **pedant** | Capability detection — what system resources does this crate access? | Part of pedant |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **cargo-audit** | Known vuln deps | `cargo audit` |
| **cargo-deny** | License + advisory + duplicate dep check | `cargo deny check` |
| **cargo-udeps** | Unused dependencies | `cargo udeps` |
| **cargo-pants** | Bloated dependency detection | `cargo pants` |

---

## Java / Kotlin

### Multi-signal

| Tool | What it catches | Run |
|------|----------------|-----|
| **PMD** | 400+ rules, 16 languages (Java alone: 294 rules). Includes CPD (Copy/Paste Detector) for duplication across 33+ languages | `pmd check -d . -R rulesets/java/quickstart.xml` |
| **SpotBugs** | Bug patterns (successor to FindBugs). 400+ detectors for Java, Kotlin via findsecbugs plugin | Via Gradle/Maven: `./gradlew spotbugsMain` |
| **detekt** | Static code analysis for Kotlin. Highly configurable rule sets, baseline support | `./gradlew detekt` or `detekt --config detekt.yml` |

### Architecture

| Tool | What it catches | Run |
|------|----------------|-----|
| **Shamash** | JVM architecture enforcement — enforces package/module boundaries | Via Gradle plugin |
| **Aalekh** | Gradle plugin: extracts, visualizes, and enforces architectural rules across multi-module projects (KMP, Android, JVM) | `./gradlew aalekh` |
| **ArchUnit** | Java architecture testing framework (layers, cycles, package dependencies) | Via test runner |

### Type & correctness

| Tool | What it catches | Run |
|------|----------------|-----|
| **Error Prone** | Common Java bugs at compile time (Google). 500+ bug patterns | Via Maven/Gradle plugin |
| **Checkstyle** | Style + conventions | `./gradlew checkstyleMain` |
| **NullAway** | Null pointer dereference prevention (Uber) | Via Error Prone plugin |

### Security

| Tool | What it catches | Run |
|------|----------------|-----|
| **semgrep** | Custom security patterns | `semgrep --config=auto` |
| **FindSecBugs** | Security-focused SpotBugs plugin (70+ security detectors) | Via SpotBugs + findsecbugs-plugin |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **OWASP Dependency Check** | Known vuln deps | `./gradlew dependencyCheckAnalyze` |
| **Renovate / Dependabot** | Outdated deps | CI config |

---

## Ruby

### Multi-signal

| Tool | What it catches | Run |
|------|----------------|-----|
| **rubocop** | Linting + formatting + style enforcement. Rails/RSpec extensions available | `rubocop --parallel` |
| **oxicop** | 2-30x faster drop-in RuboCop replacement in Rust. Same `.rubocop.yml` config | `oxicop` |

### Code smells

| Tool | What it catches | Run |
|------|----------------|-----|
| **reek** | Code smell detection: duplicated logic, long methods, large classes, feature envy, etc. | `reek .` |

### Dead code

| Tool | What it catches | Run |
|------|----------------|-----|
| **debride** | Dead code detection for Rails apps | `debride --rails` |

### Types

| Tool | What it catches | Run |
|------|----------------|-----|
| **sorbet** | Gradual type checking (Stripe). Inline type annotations + RBI files | `srb tc` |
| **rbs** | Ruby 3+ type signature checking | `rbs validate` |

### Security

| Tool | What it catches | Run |
|------|----------------|-----|
| **brakeman** | Static security analysis for Rails. Framework-aware | `brakeman -q` |
| **semgrep** | Custom security patterns | `semgrep --config=auto` |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **bundle-audit** | Gem vuln scanning | `bundle-audit check --update` |

---

## PHP

### Multi-signal

| Tool | What it catches | Run |
|------|----------------|-----|
| **PHPStan** | Type inference + bug detection. Max level detects almost all type-related runtime errors. Larastan extension for Laravel | `phpstan analyse --level max` |
| **Psalm** | Static analysis with taint analysis support. Can auto-fix some issues | `psalm --show-info=true` |

### Architecture

| Tool | What it catches | Run |
|------|----------------|-----|
| **Deptrac** | Enforces layering rules between directories/namespaces. Detects architectural drift | `deptrac` |
| **PHPMetrics** | Code metrics: complexity, coupling, cohesion, LOC, Halstead, maintainability index | `phpmetrics --report-html=report .` |

### Quality & duplication

| Tool | What it catches | Run |
|------|----------------|-----|
| **PHP_CodeSniffer** | Style enforcement + some bug detection | `phpcs --standard=PSR12 .` |
| **phpcpd** | Copy/paste detection | `phpcpd .` |
| **PHPMD** | Code smells: overly complex methods, too many parameters, coupling | `phpmd . text cleancode,design,controversial` |

---

## C / C++

### Multi-signal

| Tool | What it catches | Run |
|------|----------------|-----|
| **clang-tidy** | Clang-based C++ linter. Modular, extensible. Runs Clang Static Analyzer checks too | `clang-tidy --checks='*' file.cpp` (needs compile_commands.json) |
| **cppcheck** | Static analysis focused on undefined behavior and dangerous constructs. Very few false positives | `cppcheck --enable=all --suppress=missingIncludeSystem .` |

### Dead code & includes

| Tool | What it catches | Run |
|------|----------------|-----|
| **include-what-you-use** | Analyzes #include usage — finds unused includes, missing includes. Prevents header bloat | `include-what-you-use file.cpp` (needs compile_commands.json) |
| **cpplint** | Google-style C++ style checker | `cpplint --filter=-whitespace,-readability file.cpp` |

### Quality & complexity

| Tool | What it catches | Run |
|------|----------------|-----|
| **OCLint** | Static analysis for C, C++, Objective-C. High-level quality metrics | `oclint ...` |
| **flawfinder** | Security vulnerability scanner for C/C++ | `flawfinder .` |

### Dependencies

| Tool | What it catches | Run |
|------|----------------|-----|
| **semgrep** | Custom security patterns | `semgrep --config=auto` |

---

## Zig

| Tool | What it catches | Run |
|------|----------------|-----|
| **zwanzig** | Static analyzer + linter: fast AST/token rules + CFG-driven analysis built on ZIR output | `zwanzig src/` |
| **zbc** | Lifetime, ownership, and cleanup bug inference. 45 rules: flow analysis (use-after-free, double-free), structural analysis (missing deinit, unused fields) | `zbc src/` |
| **ziglint** | Linting: enforces best practices, style, consistency | `ziglint .` |
| **zlinter** | Extendable linter integrated into build.zig | Via build.zig |
| **ZLS** | Language server — diagnostics, unused variable detection, type checking | Built-in zls |

---

## Swift

| Tool | What it catches | Run |
|------|----------------|-----|
| **SwiftLint** | Style + conventions enforcement. 200+ rules, SwiftSyntax-based | `swiftlint lint` |
| **Periphery** | Unused code detection: unused functions, types, parameters. Index-based, cross-file | `periphery scan` |
| **Sourcery** | Meta-programming / code generation. Not an analyzer but reduces boilerplate | `sourcery --sources . --templates .` |

---

## Cross-language / Multi-signal

These tools cover many languages at once. Run them early.

| Tool | Languages | What it catches | Run |
|------|-----------|----------------|-----|
| **semgrep** | 30+ languages | Custom security + quality patterns, bug variants. `--config=auto` auto-selects rules | `semgrep --config=auto` |
| **SonarQube** | 30+ languages | Industry platform: bugs, vulnerabilities, code smells, complexity, duplication, security hotspots | Requires server setup (ask user first) |
| **Repowise** | 12+ languages | Code health scores, auto-generated docs, git analytics, dead code detection. MCP server for AI agents | Ask user — requires API key |
| **CodeQL** | 12+ languages | Deep semantic analysis, taint tracking. Best for security (CVE discovery) | Requires GitHub setup |

---

## Combining with Leg 1

| Finding type | Better caught by |
|--------------|-----------------|
| Logic errors, race conditions, auth bypass | Leg 1 (adversarial reasoning) |
| Dead code, unused exports, type errors | Leg 2 (tools) |
| Security vulnerabilities | Both |
| Dependency issues | Leg 2 |
| Architecture violations, cycles | Leg 2 |

**Tag findings**: `🔴 blocker` → `🟡 concerning` → `🟢 informational`

---

## Tool Safety

- **Never run tools with `--fix` or auto-apply.** You handle all code changes in Leg 3.
- **Ask the user before installing.**
- **Respect `.gitignore`.** Skip `node_modules/`, `target/`, `build/`, etc.
- **If a tool isn't available** for the project's language, skip it and note the gap.
