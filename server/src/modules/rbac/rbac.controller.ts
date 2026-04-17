import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import {
  createRole,
  listRoles,
  getRole,
  updateRole,
  deleteRole,
  createPermission,
  listPermissions,
  getPermission,
  updatePermission,
  assignPermission,
  removePermission,
  getRolePermissions,
} from './rbac.service'
import { RoleHasUsersError, DefaultRoleError, PermissionAssignmentError } from './rbac.errors'

export const rbacController = new Elysia({ prefix: '/api/rbac' })
  .onError(({ code, error, set }) => {
    if (error instanceof RoleHasUsersError) {
      set.status = 409
      return { error: error.message, type: 'RoleHasUsersError' }
    }
    if (error instanceof DefaultRoleError) {
      set.status = 403
      return { error: error.message, type: 'DefaultRoleError' }
    }
    if (error instanceof PermissionAssignmentError) {
      set.status = 409
      return { error: error.message, type: 'PermissionAssignmentError' }
    }
    if (error instanceof Error && error.message.startsWith('Permission denied:')) {
      set.status = 403
      return { error: error.message, code: 'FORBIDDEN' }
    }
  })
  .post(
    '/roles',
    async ({ body }) => {
      const role = await createRole(body.name, body.description, body.tenantId ?? null)
      return { success: true, role }
    },
    {
      beforeHandle: requirePermission('rbac.create'),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        description: t.String(),
        tenantId: t.Optional(t.Union([t.Number(), t.Null()])),
      }),
    },
  )
  .get('/roles', async ({ query, set }) => {
    const tenantId = query.tenantId ? parseInt(query.tenantId, 10) : null
    if (tenantId === null || isNaN(tenantId)) {
      set.status = 400
      return { error: 'tenantId query parameter is required', code: 'MISSING_TENANT_ID' }
    }
    const result = await listRoles(tenantId)
    return { roles: result }
  }, {
    beforeHandle: requirePermission('rbac.read'),
    query: t.Object({
      tenantId: t.String({ format: 'integer' }),
    }),
  })
  .get('/roles/:id', async ({ params, set }) => {
    const role = await getRole(parseInt(params.id, 10))
    if (!role) {
      set.status = 404
      return { error: 'Role not found' }
    }
    return { role }
  }, {
    beforeHandle: requirePermission('rbac.read'),
    params: t.Object({
      id: t.String({ format: 'integer' }),
    }),
  })
  .put(
    '/roles/:id',
    async ({ params, body }) => {
      const role = await updateRole(parseInt(params.id, 10), body.name, body.description)
      return { success: true, role }
    },
    {
      beforeHandle: requirePermission('rbac.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        description: t.String(),
      }),
    },
  )
  .delete('/roles/:id', async ({ params }) => {
    const result = await deleteRole(parseInt(params.id, 10))
    return { success: true, ...result }
  }, {
    beforeHandle: requirePermission('rbac.delete'),
    params: t.Object({
      id: t.String({ format: 'integer' }),
    }),
  })
  .post(
    '/permissions',
    async ({ body }) => {
      const permission = await createPermission(body.name, body.description, body.category)
      return { success: true, permission }
    },
    {
      beforeHandle: requirePermission('rbac.create'),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        description: t.String(),
        category: t.String({ minLength: 1, maxLength: 50 }),
      }),
    },
  )
  .get('/permissions', async ({ query }) => {
    const result = await listPermissions(query.category)
    return { permissions: result }
  }, {
    beforeHandle: requirePermission('rbac.read'),
    query: t.Object({
      category: t.Optional(t.String()),
    }),
  })
  .get('/permissions/:id', async ({ params }) => {
    const permission = await getPermission(parseInt(params.id, 10))
    if (!permission) {
      return { error: 'Permission not found' }
    }
    return { permission }
  }, {
    beforeHandle: requirePermission('rbac.read'),
    params: t.Object({
      id: t.String({ format: 'integer' }),
    }),
  })
  .put(
    '/permissions/:id',
    async ({ params, body }) => {
      const permission = await updatePermission(parseInt(params.id, 10), body.name, body.description)
      return { success: true, permission }
    },
    {
      beforeHandle: requirePermission('rbac.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        description: t.String(),
      }),
    },
  )
  .post(
    '/roles/:id/permissions',
    async ({ params, body }) => {
      const result = await assignPermission(
        parseInt(params.id, 10),
        body.permissionId,
        body.action,
      )
      return { success: true, ...result }
    },
    {
      beforeHandle: requirePermission('rbac.assign'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        permissionId: t.Number(),
        action: t.String({ minLength: 1, maxLength: 10 }),
      }),
    },
  )
  .delete('/roles/:id/permissions/:permissionId', async ({ params }) => {
    const result = await removePermission(
      parseInt(params.id, 10),
      parseInt(params.permissionId, 10),
    )
    return { success: true, ...result }
  }, {
    beforeHandle: requirePermission('rbac.delete'),
    params: t.Object({
      id: t.String({ format: 'integer' }),
      permissionId: t.String({ format: 'integer' }),
    }),
  })
  .get('/roles/:id/permissions', async ({ params }) => {
    const result = await getRolePermissions(parseInt(params.id, 10))
    return { permissions: result }
  }, {
    beforeHandle: requirePermission('rbac.read'),
    params: t.Object({
      id: t.String({ format: 'integer' }),
    }),
  })
