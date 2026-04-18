# Contributing Guide

## Code Quality Standards

### Requirements
- JSDoc on every exported function/class
- Max 30 lines per function
- NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`
- Descriptive naming (no abbreviations)

### Error Handling
- Use custom error classes from `server/src/lib/errors.ts`
- Never swallow errors with empty catch blocks

### Naming Conventions
- Use descriptive names: `calculateFeedConsumption` not `calcFeed`
- booleans: `isCycleActive`, `hasPermission`

## Testing

### Server Tests
Location: `tests/unit/*.test.ts`

Pattern:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('module.service.ts', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('should do something', async () => {
    // test implementation
  })
})
```

### Running Tests
```bash
bun run test              # run all
bun run test --coverage # with coverage
```

## Git Workflow

1. Create feature branch:
```bash
git checkout -b feature/description
```

2. Make changes, add tests

3. Commit with descriptive message:
```bash
git commit -m "Add feature: description"
```

4. Push and create PR

## PR Checklist

- [ ] Code follows style guide
- [ ] Tests pass
- [ ] No ts-ignore or as any
- [ ] JSDoc on exports
- [ ] No console.log or debug code