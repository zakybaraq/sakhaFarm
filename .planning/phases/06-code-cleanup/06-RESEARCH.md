# Phase 6: code-cleanup - Research

**Researched:** 2026-04-18
**Domain:** React code quality, JSDoc documentation, linting
**Confidence:** HIGH

## Summary

Phase 6 focuses on cleaning up messy code and adding documentation to achieve professional code quality standards. The codebase already has good examples (client.ts, useKpiData.ts) with JSDoc and TypeScript typing. Research identifies ESLint with typescript-eslint + eslint-plugin-react-hooks as the standard linting stack, clarifies JSDoc usage (API functions + complex logic), and identifies common refactoring patterns: split large components by responsibility, extract custom hooks for duplicate logic, and add documentation only where it adds value (API functions, calculation logic).

**Primary recommendation:** Use eslint-plugin-react-hooks for code quality enforcement, add JSDoc only to API functions and calculation logic per project standards, and refactor large components (>100 lines) into smaller focused pieces.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** API functions and complex logic (calculations, data transformations) require JSDoc documentation
- **D-02:** Simple CRUD operations and basic components do not need full documentation
- **D-03:** Focus on explaining WHY, not WHAT — junior developers should understand without asking
- **D-04:** MUI only for charts and statistics (@mui/x-charts)
- **D-05:** All other components (buttons, forms, dialogs, cards) should use custom components
- **D-06:** Existing MUI DataGrid can remain, but new reusable UI should be custom

### the agent's Discretion
- Specific file-by-file cleanup decisions — delegate to planner/researcher based on code analysis
- Which existing files need JSDoc vs which are already clean
- Whether specific components warrant custom replacements vs keeping MUI

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CR-01 | Clean up messy code | ESLint rules detect code quality issues; refactoring patterns for large components |
| CR-02 | Add documentation where needed | JSDoc patterns for API functions and calculation logic |
| CR-03 | Use MUI only for statistics | @mui/x-charts for charts; custom components for UI elements |
| CR-04 | Modern frontend approach | Custom hooks, proper TypeScript usage, clean component structure |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Code quality enforcement | Browser / Client | — | ESLint runs at build/dev time, not runtime |
| JSDoc documentation | Browser / Client | — | Developer documentation, consumed by IDEs |
| Component refactoring | Browser / Client | — | UI code lives in React client |
| Linting configuration | Browser / Client | — | ESLint config in client package.json |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | ^9.x | JavaScript/TypeScript linting | Industry standard for code quality |
| typescript-eslint | ^8.x | TypeScript ESLint support | Enables TypeScript-aware linting |
| eslint-plugin-react-hooks | ^5.x | React Hooks rules | Catches missing deps, dependency order |
| eslint-plugin-react-refresh | ^0.4.x | Vite HMR compatibility | Ensures components are refresh-safe |
| prettier | ^3.x | Code formatting | Consistent style, integrates with ESLint |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @eslint-react/eslint-plugin | ^1.x | Enhanced React rules | For stricter React-specific linting |

### Installation
```bash
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier eslint-plugin-prettier
```

## Architecture Patterns

### Project Structure
```
client/src/
├── api/                 # API functions (JSDoc required - complex logic)
├── components/
│   ├── layout/          # Layout components
│   ├── ui/              # Reusable UI primitives (custom components)
│   └── dashboard/      # Dashboard-specific components
├── contexts/           # React contexts
├── hooks/              # Custom hooks (JSDoc for complex logic)
├── pages/              # Page components (refactor if >100 lines)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions (JSDoc for calculations)
```

### Pattern 1: JSDoc on Exported Functions
**What:** Add JSDoc to API functions and calculation logic
**When to use:** Every exported function in api/ and utils/ folders
**Example:**
```typescript
/**
 * Typed fetch wrapper that handles auth errors and response parsing.
 *
 * @param endpoint - API path relative to API_BASE (e.g., '/auth/me')
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response typed as T
 * @throws ApiError on non-2xx responses
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  // ...
}
```
Source: [client/src/api/client.ts](file:///Users/zakybaraq/Apps/sakhaFarmLatest/client/src/api/client.ts) — existing good example

### Pattern 2: Custom Hooks for Reusable Logic
**What:** Extract duplicate state/effects into custom hooks
**When to use:** When same useState + useEffect pattern appears in 2+ components
**Example:**
```typescript
// Source: client/src/hooks/useKpiData.ts — existing good example
export function useKpiData(): KpiData {
  // Multiple queries composed together
  // Returns typed KpiData object with loading/error handling
}
```

### Pattern 3: Component Size Refactoring
**What:** Split components >100 lines into smaller focused pieces
**When to use:** When a component handles multiple responsibilities
**Why:** Easier to test, reuse, and maintain
**How:**
- Identify JSX sections that could be separate components
- Extract related state + effects together
- Pass data via props, not shared state

### Pattern 4: Type Safety Enforcement
**What:** No `as any`, no `@ts-ignore`, proper TypeScript types
**When to use:** Everywhere in the codebase
**Why:** Catches bugs at compile time, improves IDE support

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error handling wrapper | Custom ErrorBoundary from scratch | Extend existing ErrorBoundary pattern | React ErrorBoundary API is straightforward but boilerplate-heavy |
| Linting setup | Write custom lint rules | eslint-plugin-react-hooks + typescript-eslint | Community-maintained, catches common issues |
| Type definitions | JSDoc @typedef for complex types | TypeScript interfaces/types | TypeScript provides better IDE support and type safety |
| Loading states | Build custom loading spinner | MUI CircularProgress or custom component | Simple, reusable pattern |

## Common Pitfalls

### Pitfall 1: Large Components (Bloated State)
**What goes wrong:** Components with >10 useState calls, handling multiple responsibilities
**Why it happens:** Feature creep, copy-paste during development
**How to avoid:** Refactor components >100 lines into smaller pieces. Identify "seams" by examining JSX structure
**Warning signs:** Component file >200 lines, many unrelated useState, component does data fetching + validation + rendering

### Pitfall 2: Storing Derived State
**What goes wrong:** Using useState + useEffect to compute values that could be derived during render
**Why it happens:** Not understanding React's render model, copying patterns from class components
**How to avoid:** Compute derived values during render, only use state for "source of truth" data
**Example:**
```typescript
// BAD: Derived state in useEffect
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(`${user.firstName} ${user.lastName}`)
}, [user])

// GOOD: Compute during render
const fullName = `${user.firstName} ${user.lastName}`
```

### Pitfall 3: Missing useEffect Dependencies
**What goes wrong:** ESLint exhaustive-deps warnings, stale closures, infinite loops
**Why it happens:** Not understanding dependency array, adding deps to silence warnings without understanding
**How to avoid:** Use eslint-plugin-react-hooks with exhaustive-deps rule, understand when to use useCallback
**Warning signs:** Multiple useEffect hooks, complex dependency arrays

### Pitfall 4: Prop Drilling
**What goes wrong:** Passing props through many levels of components
**Why it happens:** Not using context or lifting state appropriately
**How to avoid:** Use React context for global state (auth, theme), extract intermediate components

### Pitfall 5: Magic Numbers
**What goes wrong:** Hardcoded values without explanation
**Why it happens:** "It works, why explain?" mentality
**How to avoid:** Create named constants for business values, explain in comments WHY the value is what it is

## Code Examples

### Good JSDoc (from existing codebase)
```typescript
// Source: client/src/api/client.ts
/**
 * Typed fetch wrapper for SakhaFarm API calls.
 *
 * All requests include credentials: 'include' for cookie-based auth.
 * CSRF protection uses the double-submit cookie pattern:
 * a csrf_token cookie is read and sent as X-CSRF-Token header
 * on all mutating requests (POST, PUT, PATCH, DELETE).
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  // Implementation
}
```

### Good Custom Hook (from existing codebase)
```typescript
// Source: client/src/hooks/useKpiData.ts
export function useKpiData(): KpiData {
  // Uses TanStack Query for data fetching
  // Composes multiple queries into single KPI object
  // Returns loading/error states
}
```

### ESLint Configuration (2025 flat config)
```javascript
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-plugin-prettier'

export default tseslint.config([
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettierConfig,
    ],
    rules: {
      'prettier/prettier': ['error', { singleQuote: true, printWidth: 100 }],
    },
  },
])
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class components | Functional components + hooks | React 16.8 (2019) | Simpler code, easier to test |
| propTypes runtime | TypeScript compile-time | Industry shift (2020+) | Better IDE support, catch errors earlier |
| CRA | Vite | 2020+ | Faster builds, modern defaults |
| Legacy ESLint config | Flat config (eslint.config.js) | ESLint 9.x (2024) | Simpler configuration |

**Deprecated/outdated:**
- `create-react-app` — Vite is the standard now
- `react-addons-perf` — Use React DevTools Profiler instead

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MUI x-charts is available and functional | Standard Stack | LOW — @mui/x-charts is standard MUI package |
| A2 | No existing ESLint configuration in client | Architecture Patterns | LOW — can add to existing setup if present |

## Open Questions

1. **How extensive is the "messy code"?**
   - What we know: 40+ React files exist, some have inconsistent patterns
   - What's unclear: Which specific files need the most cleanup
   - Recommendation: Start with linting to identify issues, then prioritize

2. **Should new custom UI components be created proactively?**
   - What we know: CONTEXT says MUI only for charts, custom for UI
   - What's unclear: How much duplication exists that warrants new components
   - Recommendation: Only create when duplication is proven (2+ usages)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ESLint | Linting | ✓ (via Vite) | ^9.x | — |
| TypeScript | Type checking | ✓ | ^5.x | — |
| Prettier | Code formatting | ✓ | ^3.x | — |

**Missing dependencies with no fallback:**
- None — all required tooling available

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | client/vitest.config.ts |
| Quick run command | `vitest run --dir client/src` |
| Full suite command | `vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CR-01 | Clean up messy code | Manual review | Lint: `eslint src/` | ✅ No lint config yet |
| CR-02 | Add documentation | Manual review | — | ✅ N/A |
| CR-03 | MUI only for charts | Manual review | — | ✅ N/A |
| CR-04 | Modern approach | Manual review | — | ✅ N/A |

### Sampling Rate
- **Per task commit:** Lint check
- **Per wave merge:** Full lint + type check
- **Phase gate:** Manual code review

### Wave 0 Gaps
- [ ] `client/eslint.config.js` — ESLint flat config for React/TypeScript
- [ ] Add lint script to package.json: `"lint": "eslint src/"`

## Security Domain

> This phase is code-quality focused, not security-focused. Security concerns handled in other phases.

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | — |
| V6 Cryptography | No | — |

**Note:** Code cleanup should NOT introduce security vulnerabilities. Specifically:
- Don't disable TypeScript strict mode to "fix" type errors
- Don't add `@ts-ignore` to silence type warnings
- Don't use `any` type to bypass type checking

## Sources

### Primary (HIGH confidence)
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) — Official React hooks linting
- [typescript-eslint](https://typescript-eslint.io/) — Official TypeScript ESLint
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) — Community best practices

### Secondary (MEDIUM confidence)
- [Clean React + TypeScript Code](https://cleancodeguy.com/blog/clean-code-principles) — 2025 patterns
- [React Code Quality Patterns](https://allahabadi.dev/blogs/frontend/react-code-quality-patterns-every-developer-should-follow/) — 2026 patterns

### Tertiary (LOW confidence)
- [WebSearch: React code cleanup best practices] — General community knowledge

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — ESLint + TypeScript is industry standard for React
- Architecture: HIGH — Existing codebase follows good patterns
- Pitfalls: HIGH — Common issues well-documented in community

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (30 days — code quality standards are stable)