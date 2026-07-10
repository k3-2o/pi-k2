# Justfile Templates

Starter templates by language. Adapt to the project's specific toolchain — these are starting points, not prescriptions.

## Python (uv)

```makefile
fmt:
    uv run ruff format src/ tests/

lint:
    uv run ruff check src/ tests/

types:
    uv run mypy src/

security:
    uv run bandit -r src/ -x tests/

audit:
    uv audit

check: fmt lint types security audit

test:
    uv run pytest

ci: check test
```

## TypeScript (npm)

```makefile
fmt:
    npx prettier --write src/

lint:
    npx eslint src/

types:
    npx tsc --noEmit

security:
    npm audit

audit:
    npm audit

check: fmt lint types security audit

test:
    npx vitest run

ci: check test
```

## Rust (cargo)

```makefile
fmt:
    cargo fmt

lint:
    cargo clippy -- -D warnings

audit:
    cargo audit

check: fmt lint audit

test:
    cargo test

ci: check test
```

## Go

```makefile
fmt:
    gofmt -w .

lint:
    golangci-lint run

audit:
    go vuln check ./...

check: fmt lint audit

test:
    go test ./...

ci: check test
```
