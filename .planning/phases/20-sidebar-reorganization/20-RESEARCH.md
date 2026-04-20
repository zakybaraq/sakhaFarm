# Phase 20: Sidebar Reorganization - Research

**Researched:** 2026-04-21
**Domain:** MUI Sidebar with collapsible sections
**Confidence:** HIGH

## Summary

This phase requires restructuring the sidebar from a flat list into grouped sections with expand/collapse functionality. The existing codebase already has a solid foundation with the `isSectionHeader` flag pattern and RBAC filtering. The implementation should use MUI's List-based approach (not the deprecated Accordion component) with controlled expand/collapse state managed locally via React useState.

**Primary recommendation:** Implement a section-based menu grouping with local useState for expand/collapse tracking. Use MUI Collapse for smooth animations. Default states: Master Data/Operations expanded, Reports/Settings collapsed.

---

## Architectural Responsibility Map

| Capability            | Primary Tier   | Secondary Tier | Rationale                          |
| --------------------- | -------------- | -------------- | ---------------------------------- |
| Menu grouping         | Browser/Client | —              | UI state only, no backend needed   |
| Expand/collapse state | Browser/Client | —              | Local React state                  |
| RBAC filtering        | Browser/Client | API            | Already implemented in Sidebar.tsx |
| Navigation            | Browser/Client | —              | Uses react-router-dom              |

---

## Standard Stack

### Core

| Library             | Version       | Purpose                          | Why Standard           |
| ------------------- | ------------- | -------------------------------- | ---------------------- |
| @mui/material       | latest (v5.x) | List, ListItem, Collapse, Drawer | Already in use, stable |
| @mui/icons-material | latest        | ExpandMore, ExpandLess           | Section toggle icons   |
| react               | 18.x          | useState, useMemo                | Already in use         |
| react-router-dom    | 6.x           | useLocation, useNavigate         | Already in use         |

### Supporting

| Library                | Version | Purpose                          | When to Use                 |
| ---------------------- | ------- | -------------------------------- | --------------------------- |
| @mui/material/Collapse | ^5.x    | Smooth expand/collapse animation | Section content transitions |

### Alternatives Considered

| Instead of           | Could Use                     | Tradeoff                                                            |
| -------------------- | ----------------------------- | ------------------------------------------------------------------- |
| MUI Accordion        | List + manually managed state | Accordion is deprecated in Material Design, List gives more control |
| Redux/Zustand        | Local useState                | Overkill for 4-section state, local state is sufficient             |
| Custom CSS animation | MUI Collapse                  | More work, MUI Collapse already handles it                          |

**Installation:**

```bash
cd client && npm install @mui/material @mui/icons-material
```

(no new dependencies - all already in package.json)

---

## Architecture Patterns

### System Architecture Diagram

```
[Sidebar Component]
       │
       ▼
┌──────────────────┐
│  menuItems Array  │  (restructured with category field)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Section Groups   │  (Master Data │ Operations │ Reports │ Settings)
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Header │ │ Items  │
│ Click │ │ List   │
└────────┘ └────────┘
    │
    ▼
┌──────────────────┐
│ useState:        │
│ expanded: {      │
│   master: true,   │
│   operations:true│
│   reports: false, │
│   settings:false  │
│ }               │
└──────────────────┘
```

### Recommended Project Structure

```
client/src/components/layout/
└── Sidebar.tsx        # Modified: add section grouping + expand/collapse
```

### Pattern 1: Controlled Expand/Collapse with Sections

**What:** Menu items grouped by category with independent expand/collapse control per section

**When to use:** When you need hybrid default states (some expanded, some collapsed)

**Example:**

```typescript
// Source: MUI documentation + best practices

// 1. Define section structure
interface MenuSection {
  id: string;
  title: string;
  defaultExpanded: boolean;
  items: MenuItem[];
}

// 2. State management
const [expanded, setExpanded] = useState<Record<string, boolean>>({
  master: true, // Master Data - expanded by default
  operations: true, // Operations - expanded by default
  reports: false, // Reports - collapsed by default
  settings: false, // Settings - collapsed by default
});

// 3. Toggle handler
const handleToggle = (sectionId: string) => {
  setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
};
```

### Pattern 2: Section Header with Toggle Icon

**What:** Clickable section header that toggles expansion state

**When to use:** For section headers that should be interactive

**Example:**

```typescript
// Section header component
<ListItemButton
  onClick={() => handleToggle(sectionId)}
  sx={{
    minHeight: 48,
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
  }}
>
  <ListItemText
    primary={sectionTitle}
    primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 700 }}
  />
  <ListItemIcon sx={{ minWidth: 36 }}>
    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
  </ListItemIcon>
</ListItemButton>
```

### Pattern 3: Collapsible Content with Animation

**What:** Smooth collapse animation using MUI Collapse

**When to use:** For animating section content show/hide

**Example:**

```typescript
// Inside render loop
<Collapse in={expanded[sectionId]} timeout="auto" unmountOnExit>
  <List component="div" disablePadding>
    {section.items.map(item => (
      <ListItemButton key={item.text} /* ... */>
        {/* menu item content */}
      </ListItemButton>
    ))}
  </List>
</Collapse>
```

---

## Don't Hand-Roll

| Problem                   | Don't Build                  | Use Instead                              | Why                                                  |
| ------------------------- | ---------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Expand/collapse animation | Custom CSS transitions       | MUI Collapse                             | Already in MUI, handles unmountOnExit, accessibility |
| State management          | Redux/Zustand for 4 sections | React useState                           | Simple local state, no global state needed           |
| Section state structure   | Complexreducer               | useState object                          | Readable, simple toggle pattern                      |
| Icons for expand/collapse | Custom icons                 | mui/icons-material ExpandMore/ExpandLess | Consistent with existing codebase                    |

**Key insight:** The sidebar only needs local UI state for 4 sections. No external state management library is justified. The existing MUI components provide all needed functionality.

---

## Common Pitfalls

### Pitfall 1: Using MUI Accordion for Sidebar

**What goes wrong:** Accordion is deprecated in Material Design guidelines and provides unnecessary wrapper elements
**Why it happens:** Developers familiar with Accordion from other contexts default to it
**How to avoid:** Use List-based approach with manual expand/collapse toggle - gives more control over styling
**Warning signs:** Using AccordionSummary, AccordionDetails components

### Pitfall 2: Not Distinguishing Mobile vs Desktop Behavior

**What goes wrong:** Mobile drawer acts like desktop permanent drawer
**Why it happens:** Using same component for both variants
**How to avoid:** MUI already handles this - verify temporary drawer for { xs: 'block', md: 'none' } and permanent for { xs: 'none', md: 'block' }
**Warning signs:** Mobile navigation doesn't close after selection

### Pitfall 3: Performance with Many Menu Items

**What goes wrong:** All menu items render even when section is collapsed
**Why it happens:** Not using unmountOnExit in Collapse
**How to avoid:** Add `unmountOnExit` prop to Collapse for sections with many items
**Warning signs:** Large DOM tree in collapsed sections

### Pitfall 4: Breaking Existing RBAC Filtering

**What goes wrong:** New section structure breaks permission filtering
**Why it happens:** Changing data structure without preserving filter logic
**How to avoid:** Maintain the permission filter on menu items, not sections
**Warning signs:** Users see items they shouldn't have access to

---

## Code Examples

### Complete Section Restructuring

```typescript
// Source: Existing Sidebar.tsx + MUI best practices
// Location: client/src/components/layout/Sidebar.tsx

// Step 1: Define menu structure with categories
const menuStructure = [
  {
    id: 'master',
    title: 'MASTER DATA',
    defaultExpanded: true,
    items: [
      { text: 'Unit', icon: <BusinessIcon />, path: '/units', permission: 'unit.read' },
      { text: 'Plasma', icon: <AgricultureIcon />, path: '/plasmas', permission: 'plasma.read' },
      // ... other master data items
    ],
  },
  {
    id: 'operations',
    title: 'OPERATIONS',
    defaultExpanded: true,
    items: [
      { text: 'Cycle', icon: <AutorenewIcon />, path: '/cycles', permission: 'cycle.read' },
      // ... other operations items
    ],
  },
  // ... other sections
];

// Step 2: Initialize state with defaults
const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
  menuStructure.reduce((acc, section) => ({
    ...acc,
    [section.id]: section.defaultExpanded,
  }), {}),
);

// Step 3: Render sections
menuStructure.map((section) => {
  const isExpanded = expanded[section.id];
  const visibleItems = section.items.filter(
    item => !item.permission || userPermissions.includes(item.permission),
  );

  if (visibleItems.length === 0) return null;

  return (
    <Box key={section.id}>
      {/* Section header with toggle */}
      <ListItemButton onClick={() => setExpanded(prev => ({ ...prev, [section.id]: !prev[section.id] }))}>
        <ListItemText
          primary={section.title}
          primaryTypographyProps={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        />
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItemButton>

      {/* Collapsible content */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List disablePadding>
          {visibleItems.map(item => /* render menu item */)}
        </List>
      </Collapse>
    </Box>
  );
});
```

---

## State of the Art

| Old Approach                              | Current Approach                                        | When Changed | Impact                             |
| ----------------------------------------- | ------------------------------------------------------- | ------------ | ---------------------------------- |
| Flat menu list with single section header | Section-based grouping with per-section expand/collapse | 2026-04-21   | Better usability, logical grouping |
| isSectionHeader flag for static headers   | Interactive section headers                             | Current      | Requires toggle state              |

**Deprecated/outdated:**

- Single static "Reports" section header (replaced with 4 dynamic sections)
- Hardcoded menuItems array position (replaced with grouped structure)

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| #   | Claim                           | Section                 | Risk if Wrong                        |
| --- | ------------------------------- | ----------------------- | ------------------------------------ |
| A1  | No new npm packages required    | Standard Stack          | Low - verified existing package.json |
| A2  | Vitest infrastructure available | Validation Architecture | Low - verified test files exist      |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Should sections remember their expanded state?**
   - What we know: Current design uses default values on load
   - What's unclear: Should expanded state persist across sessions (localStorage)?
   - Recommendation: Keep simple for now (default on load), add persistence if requested

2. **Should we add keyboard shortcuts?**
   - What we know: No existing keyboard navigation for sidebar
   - What's unclear: Are there accessibility requirements beyond basic aria?
   - Recommendation: Follow existing pattern (aria-labels on buttons)

---

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency          | Required By   | Available | Version | Fallback |
| ------------------- | ------------- | --------- | ------- | -------- |
| @mui/material       | UI components | ✓         | ^5.x    | —        |
| @mui/icons-material | Icons         | ✓         | ^5.x    | —        |
| react-router-dom    | Navigation    | ✓         | ^6.x    | —        |

**Missing dependencies with no fallback:**

- None — all dependencies already in project

---

## Validation Architecture

### Test Framework

| Property           | Value                   |
| ------------------ | ----------------------- |
| Framework          | Vitest                  |
| Config file        | client/vitest.config.ts |
| Quick run command  | `npm test -- --run`     |
| Full suite command | `npm test`              |

### Phase Requirements → Test Map

| ReQ ID | Behavior                          | Test Type | Automated Command         | File Exists? |
| ------ | --------------------------------- | --------- | ------------------------- | ------------ |
| UI-01  | Menu grouped into 4 sections      | unit      | N/A - visual verification | ❌ Wave 0    |
| UI-02  | Expand/collapse works per section | unit      | N/A - visual verification | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** N/A (UI components)
- **Per wave merge:** N/A (visual verification)
- **Phase gate:** Manual UAT verification

### Wave 0 Gaps

- [ ] Test file for Sidebar component - visual/behavioral verification typically manual
- [ ] No automated tests needed for pure UI changes in this phase

---

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                            |
| --------------------- | ------- | ------------------------------------------- |
| V2 Authentication     | no      | N/A - UI only                               |
| V3 Session Management | no      | N/A - UI only                               |
| V4 Access Control     | yes     | Existing RBAC filtering already implemented |
| V5 Input Validation   | no      | N/A - UI only                               |
| V6 Cryptography       | no      | N/A - UI only                               |

### Known Threat Patterns for React/MUI

| Pattern                  | STRIDE    | Standard Mitigation                     |
| ------------------------ | --------- | --------------------------------------- |
| XSS via menu item text   | Tampering | React escapes by default                |
| Unauthorized menu access | Spoofing  | Existing RBAC filter (permission field) |

---

## Sources

### Primary (HIGH confidence)

- MUI official docs - Accordion (deprecated but pattern reference)
- MUI official docs - Collapse component
- Existing Sidebar.tsx - current implementation

### Secondary (MEDIUM confidence)

- WebSearch: MUI sidebar best practices 2025
- Stack Overflow: MUI controlled accordion patterns

### Tertiary (LOW confidence)

- WebSearch only - standard React state management patterns

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - using existing MUI and React patterns
- Architecture: HIGH - straightforward refactor of existing code
- Pitfalls: HIGH - well-documented MUI patterns

**Research date:** 2026-04-21
**Valid until:** 90 days (stable UI pattern)
