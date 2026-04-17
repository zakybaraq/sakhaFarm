import { Elysia, t } from 'elysia'
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
  resetPassword,
  searchUsers,
  importUsersFromCSV,
} from './users.service'
import {
  DuplicateEmailError,
  InvalidRoleError,
  UserNotFoundError,
  CsvImportError,
  WeakPasswordError,
  InvalidTenantError,
} from './users.errors'
import { requirePermission } from '../../plugins/rbac'

function handleUserError(error: unknown) {
  if (error instanceof DuplicateEmailError) {
    return { error: error.message, code: 'DUPLICATE_EMAIL' }
  }
  if (error instanceof InvalidRoleError) {
    return { error: error.message, code: 'INVALID_ROLE' }
  }
  if (error instanceof UserNotFoundError) {
    return { error: error.message, code: 'USER_NOT_FOUND' }
  }
  if (error instanceof CsvImportError) {
    return { error: error.message, code: 'CSV_IMPORT_ERROR' }
  }
  if (error instanceof WeakPasswordError) {
    return { error: error.message, code: 'WEAK_PASSWORD' }
  }
  if (error instanceof InvalidTenantError) {
    return { error: error.message, code: 'INVALID_TENANT' }
  }
  if (error instanceof Error) {
    return { error: error.message }
  }
  return { error: 'Internal server error' }
}

export const usersController = new Elysia({ prefix: '/api/users' })
  .post(
    '/',
    async ({ body }) => {
      try {
        const result = await createUser(body)
        return { success: true, user: result }
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.create'),
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        name: t.String({ minLength: 2, maxLength: 100 }),
        roleId: t.Number(),
        tenantId: t.Number(),
      }),
    },
  )
  .get(
    '/',
    async ({ query }) => {
      const filters = {
        name: query.name,
        email: query.email,
        roleId: query.roleId ? parseInt(query.roleId, 10) : undefined,
        tenantId: query.tenantId ? parseInt(query.tenantId, 10) : undefined,
        status: query.status as 'active' | 'inactive' | undefined,
      }
      const result = await listUsers(filters)
      return { users: result }
    },
    {
      beforeHandle: requirePermission('users.read'),
      query: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        roleId: t.Optional(t.String()),
        tenantId: t.Optional(t.String()),
        status: t.Optional(t.Enum({ active: 'active', inactive: 'inactive' })),
      }),
    },
  )
  .get(
    '/search',
    async ({ query }) => {
      const q = query.q
      if (!q) {
        return { error: 'Search query parameter "q" is required', code: 'MISSING_QUERY' }
      }
      const filters = {
        roleId: query.roleId ? parseInt(query.roleId, 10) : undefined,
        tenantId: query.tenantId ? parseInt(query.tenantId, 10) : undefined,
        status: query.status as 'active' | 'inactive' | undefined,
      }
      const result = await searchUsers(q, filters)
      return { users: result }
    },
    {
      beforeHandle: requirePermission('users.read'),
      query: t.Object({
        q: t.String(),
        roleId: t.Optional(t.String()),
        tenantId: t.Optional(t.String()),
        status: t.Optional(t.Enum({ active: 'active', inactive: 'inactive' })),
      }),
    },
  )
  .get(
    '/:id',
    async ({ params }) => {
      try {
        const result = await getUser(params.id)
        return { user: result }
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.read'),
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .put(
    '/:id',
    async ({ params, body }) => {
      try {
        const result = await updateUser(params.id, body)
        return result
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.update'),
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        email: t.Optional(t.String({ format: 'email' })),
        roleId: t.Optional(t.Number()),
      }),
    },
  )
  .patch(
    '/:id/deactivate',
    async ({ params }) => {
      try {
        const result = await deactivateUser(params.id)
        return result
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.update'),
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .patch(
    '/:id/activate',
    async ({ params }) => {
      try {
        const result = await activateUser(params.id)
        return result
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.update'),
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    '/:id/reset-password',
    async ({ params }) => {
      try {
        const tempPassword = await resetPassword(params.id)
        return { success: true, tempPassword }
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.reset-password'),
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    '/import',
    async ({ body }) => {
      try {
        const result = await importUsersFromCSV(body.csvContent, body.defaultTenantId)
        return { success: true, ...result }
      } catch (error) {
        return handleUserError(error)
      }
    },
    {
      beforeHandle: requirePermission('users.create'),
      body: t.Object({
        csvContent: t.String(),
        defaultTenantId: t.Number(),
      }),
    },
  )
