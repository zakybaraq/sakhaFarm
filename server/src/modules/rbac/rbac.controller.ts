import { Elysia, t } from 'elysia'
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
  .onError(({ code, error }) => {
    if (error instanceof RoleHasUsersError) {
      return { error: error.message, type: 'RoleHasUsersError' }
    }
    if (error instanceof DefaultRoleError) {
      return { error: error.message, type: 'DefaultRoleError' }
    }
    if (error instanceof PermissionAssignmentError) {
      return { error: error.message, type: 'PermissionAssignmentError' }
    }
  })
  .post(
    '/roles',
    async ({ body }) => {
      const role = await createRole(body.name, body.description, body.tenantId ?? null)
      return { success: true, role }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        description: t.String(),
        tenantId: t.Optional(t.Union([t.Number(), t.Null()])),
      }),
    },
  )
  .get('/roles', async ({ query }) => {
    const tenantId = query.tenantId ? parseInt(query.tenantId, 10) : null
    const result = await listRoles(tenantId ?? null)
    return { roles: result }
  }, {
    query: t.Object({
      tenantId: t.Optional(t.String({ format: 'integer' })),
    }),
  })
  .get('/roles/:id', async ({ params }) => {
    const role = await getRole(parseInt(params.id, 10))
    if (!role) {
      return { error: 'Role not found' }
    }
    return { role }
  }, {
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
    '/roles/:roleId/permissions',
    async ({ params, body }) => {
      const result = await assignPermission(
        parseInt(params.roleId, 10),
        body.permissionId,
        body.action,
      )
      return { success: true, ...result }
    },
    {
      params: t.Object({
        roleId: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        permissionId: t.Number(),
        action: t.String({ minLength: 1, maxLength: 10 }),
      }),
    },
  )
  .delete('/roles/:roleId/permissions/:permissionId', async ({ params }) => {
    const result = await removePermission(
      parseInt(params.roleId, 10),
      parseInt(params.permissionId, 10),
    )
    return { success: true, ...result }
  }, {
    params: t.Object({
      roleId: t.String({ format: 'integer' }),
      permissionId: t.String({ format: 'integer' }),
    }),
  })
  .get('/roles/:roleId/permissions', async ({ params }) => {
    const result = await getRolePermissions(parseInt(params.roleId, 10))
    return { permissions: result }
  }, {
    params: t.Object({
      roleId: t.String({ format: 'integer' }),
    }),
  })
