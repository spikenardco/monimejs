# Contributing to monimejs

Thank you for your interest in contributing to monimejs! This guide outlines the process for setting up your development environment, making changes, and submitting contributions.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/monimejs.git
   cd monimejs
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/atisans/monimejs.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
# Full build (JS + Types)
npm run build

# Clean build (removes dist/ first)
npm run build:clean

# Build only JavaScript
npm run build:js

# Build only Type Declarations
npm run build:types
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run format` | Format code with Biome |
| `npm run format:check` | Check formatting without changes |
| `npm run typecheck` | Type-check JavaScript and JSDoc |
| `npm run typecheck:contracts` | Type-check the built package API |
| `npm run build:clean` | Clean build (recommended before commits) |

---

## Code Standards

### TypeScript & Strict Mode

- All main source code is **JavaScript with JSDoc** for type safety
- Type checking is done via `tsc --noEmit` in CI
- use snake_case for internal code (any code that the consumer does not use)
- Use explicit types; avoid `any`
- Follow the `tsconfig.json` configuration
- Use `const` and `let`; avoid `var`

### Formatting

We use **Biome** for formatting and linting _(Configuration is in `[biome.json](./biome.json)`)_. Before committing:

```bash
npm run format
```

### Code Style Guidelines

1. **File Structure**:
   - Core client logic: `client.js`
   - HTTP handling: `http-client.js`
    - Public type definitions: `src/index.d.ts`
    - Internal type definitions: JavaScript modules with JSDoc
   - Error classes: `errors.js`
   - Feature modules: `payment.js`, `payout.js`, etc.

2. **Naming Conventions**:
   - Classes: `PascalCase` (e.g., `MonimeClient`)
   - Functions/methods: `camelCase` (e.g., `createPayment`) internal functions/methods, variables should be snake_case
   - Constants: `UPPER_SNAKE_CASE` (for constants)
   - Types/Interfaces: `PascalCase` (e.g., `PaymentResponse`)

3. **Error Handling**:
   - Throw typed error classes from `errors.js`
   - Use specific error types: `MonimeApiError`, `MonimeValidationError`, `MonimeTimeoutError`, `MonimeNetworkError`
   - Include descriptive messages and context

4. **Request validation**:
   - Do not duplicate Monime request rules in the SDK
   - Forward request values unchanged and let Monime return authoritative API errors
   - Validate only SDK execution and security invariants, such as client options and webhook signatures

5. **Documentation**:
   - Add JSDoc comments to public methods
   - Include parameter types and return types
   - Document complex logic with inline comments or make the logic self-explanatory

---

## Making Changes

### Branch Naming

Use descriptive branch names:
```bash
git checkout -b feature/add-checkout-session
git checkout -b fix/timeout-handling
git checkout -b docs/update-readme
```

### Commit Messages

Write clear, concise commit messages:
```
feature: add webhook retry mechanism
fix: handle network timeout gracefully
docs: add AbortController example
```

Use conventional commit format when possible.

### Testing Your Changes

1. **Build locally**:
   ```bash
   npm run build:clean
   ```

2. **Check formatting**:
   ```bash
   npm run format:check
   ```

3. **Fix formatting issues**:
   ```bash
   npm run format
   ```

4. **Verify no TypeScript errors**:
   ```bash
   npm run build
   ```

---

## Submitting Changes

### Push and Create a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub:
   - Reference any related issues
   - Describe your changes clearly
   - Link to any relevant documentation or examples

3. Ensure all checks pass:
   - GitHub Actions CI workflow runs successfully
   - All formatting is correct
   - TypeScript compiles without errors

### Pull Request Guidelines

- **Keep PRs focused**: One feature or fix per PR
- **Update documentation**: If your change affects public APIs, update `README.md` or `docs/FEATURE_REFERENCE.md`
- **Include examples**: For new features, provide usage examples
- **Be responsive**: Address feedback and review comments promptly

---

## Release Process

### GitHub Workflow + npm OIDC

Releases publish automatically from GitHub Actions when a version tag is pushed.

1. Bump the package version:
   - `npm version <patch|minor|major>`
2. Push commit and tag:
   - `git push && git push --tags`
3. GitHub Actions `Release` workflow runs and:
   - validates formatting
   - builds the package
   - publishes to npm with `--provenance` using OIDC Trusted Publishing
   - creates a GitHub Release

One-time npm setup:
- In npm package settings, enable Trusted Publishing for this GitHub repository/workflow.
- No `NPM_TOKEN` secret is required for the publish step.

### Version Numbers

We follow **Semantic Versioning** (optional):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **MAJOR**: Breaking API changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes

---

## Questions or Issues?

- Open a GitHub issue for bugs or feature requests
- Check existing issues before opening a new one
- Use clear, descriptive titles and include reproduction steps

Thank you for contributing to monimejs.
