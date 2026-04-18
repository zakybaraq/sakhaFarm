slug: typescript-error-rbac-manager
status: resolved
trigger: TypeScript errors in RbacManager.tsx: Property 'role' does not exist on type 'User', Property 'tenant' does not exist on type 'User', Property 'isActive' does not exist on type 'User'
symptoms:
  expected: TypeScript should compile without errors
  actual: TypeScript errors in RbacManager.tsx
  error_messages:
    - Property 'role' does not exist on type 'User'
    - Property 'tenant' does not exist on type 'User'
    - Property 'isActive' does not exist on type 'User'
  timeline: Not sure when it started
  reproduction: Run type check or build
Current Focus:
  hypothesis: The local User interface in RbacManager.tsx does not match the API User shape (roleId, tenantId instead of role, tenant, isActive)
  test: Fix the mapping to use roleId and tenantId as strings and status as is
  expecting: TypeScript errors resolved
  next_action: Apply fix and verify
investigation:
  - timestamp: 2026-04-18T13:56:53+07:00
    action: Examined RbacManager.tsx and compared with api/users.ts
    result: Found mismatch: local User interface had role: string, tenant: string, status: 'active'|'inactive' while API User has roleId: number, tenantId: number, status: 'active'|'inactive'
  - timestamp: 2026-04-18T13:57:10+07:00
    action: Applied fix to map roleId and tenantId to strings
    result: TypeScript errors resolved
root_cause: Mismatch between local User interface and API User shape
fix: Changed mapping in useEffect to convert roleId and tenantId to strings and use status directly
verification: TypeScript compilation passes and build succeeds
files_changed:
  - client/src/pages/rbac/RbacManager.tsx

