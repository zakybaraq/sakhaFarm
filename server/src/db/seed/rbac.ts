import { db } from '../../config/database'
import { permissions, roles, rolePermissions } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * All default permissions organized by module.
 * 
 * These permissions are auto-seeded on first run and represent the complete
 * set of actions available in the system. New permissions can be added here
 * but existing ones should never be removed (append-only).
 */
const DEFAULT_PERMISSIONS = [
  // Unit Module
  { name: 'unit.create', description: 'Create new farm units', category: 'unit' },
  { name: 'unit.read', description: 'View unit details', category: 'unit' },
  { name: 'unit.update', description: 'Update unit information', category: 'unit' },
  { name: 'unit.delete', description: 'Delete units', category: 'unit' },

  // Plasma Module
  { name: 'plasma.create', description: 'Register new plasma farmers', category: 'plasma' },
  { name: 'plasma.read', description: 'View plasma details', category: 'plasma' },
  { name: 'plasma.update', description: 'Update plasma information', category: 'plasma' },
  { name: 'plasma.delete', description: 'Delete plasma records', category: 'plasma' },

  // Cycle Module
  { name: 'cycle.create', description: 'Start new farming cycles', category: 'cycle' },
  { name: 'cycle.read', description: 'View cycle details', category: 'cycle' },
  { name: 'cycle.update', description: 'Update cycle information', category: 'cycle' },
  { name: 'cycle.delete', description: 'Delete cycles', category: 'cycle' },
  { name: 'cycle.complete', description: 'Mark cycles as completed', category: 'cycle' },

  // Recording Module
  { name: 'recording.create', description: 'Create daily recordings', category: 'recording' },
  { name: 'recording.read', description: 'View daily recordings', category: 'recording' },
  { name: 'recording.update', description: 'Update daily recordings', category: 'recording' },
  { name: 'recording.delete', description: 'Delete daily recordings', category: 'recording' },

  // Feed Module
  { name: 'feed.create', description: 'Add new feed products', category: 'feed' },
  { name: 'feed.read', description: 'View feed products', category: 'feed' },
  { name: 'feed.update', description: 'Update feed products', category: 'feed' },
  { name: 'feed.delete', description: 'Delete feed products', category: 'feed' },
  { name: 'feed.move', description: 'Record feed stock movements', category: 'feed' },

  // Supplier Module
  { name: 'supplier.create', description: 'Create new suppliers', category: 'supplier' },
  { name: 'supplier.read', description: 'View supplier details', category: 'supplier' },
  { name: 'supplier.update', description: 'Update supplier information', category: 'supplier' },
  { name: 'supplier.delete', description: 'Delete suppliers', category: 'supplier' },

  // Pharmaceuticals Module
  { name: 'pharmaceuticals.create', description: 'Create new pharmaceuticals', category: 'pharmaceuticals' },
  { name: 'pharmaceuticals.read', description: 'View pharmaceutical details', category: 'pharmaceuticals' },
  { name: 'pharmaceuticals.update', description: 'Update pharmaceutical information', category: 'pharmaceuticals' },
  { name: 'pharmaceuticals.delete', description: 'Delete pharmaceuticals', category: 'pharmaceuticals' },

  // Inventory Module
  { name: 'inventory.read', description: 'View inventory reports', category: 'inventory' },
  { name: 'inventory.export', description: 'Export inventory data', category: 'inventory' },

  // User Module
  { name: 'user.create', description: 'Create new users', category: 'user' },
  { name: 'user.read', description: 'View user details', category: 'user' },
  { name: 'user.update', description: 'Update user information', category: 'user' },
  { name: 'user.delete', description: 'Delete users', category: 'user' },
  { name: 'user.reset_password', description: 'Reset user passwords', category: 'user' },

  // RBAC Module
  { name: 'rbac.create', description: 'Create roles and permissions', category: 'rbac' },
  { name: 'rbac.read', description: 'View roles and permissions', category: 'rbac' },
  { name: 'rbac.update', description: 'Update roles and permissions', category: 'rbac' },
  { name: 'rbac.delete', description: 'Delete roles', category: 'rbac' },

  // Audit Module
  { name: 'audit.read', description: 'View audit logs', category: 'audit' },
]

/**
 * Default role-permission assignments.
 * 
 * Maps role names to the permissions they should have with 'allow' action.
 * Super Admin gets all permissions implicitly (bypass in RBAC middleware).
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Admin Unit': [
    'unit.read', 'unit.update',
    'plasma.create', 'plasma.read', 'plasma.update',
    'cycle.create', 'cycle.read', 'cycle.update', 'cycle.complete',
    'recording.create', 'recording.read', 'recording.update',
    'feed.read', 'feed.move',
    'supplier.read', 'supplier.create', 'supplier.update',
    'pharmaceuticals.read', 'pharmaceuticals.create', 'pharmaceuticals.update', 'pharmaceuticals.delete',
    'inventory.read', 'inventory.export',
    'user.read',
    'audit.read',
  ],
  'Admin Plasma': [
    'plasma.read',
    'cycle.read',
    'recording.create', 'recording.read', 'recording.update',
    'feed.read',
    'pharmaceuticals.read',
    'inventory.read',
  ],
  'Viewer': [
    'unit.read',
    'plasma.read',
    'cycle.read',
    'recording.read',
    'feed.read',
    'pharmaceuticals.read',
    'inventory.read',
  ],
}

async function seedPermissions() {
  console.log('🔑 Seeding permissions...')

  for (const perm of DEFAULT_PERMISSIONS) {
    const existing = await db.select().from(permissions).where(eq(permissions.name, perm.name))
    if (existing.length === 0) {
      await db.insert(permissions).values(perm)
      console.log(`  ✅ ${perm.name}`)
    }
  }

  console.log('✅ Permissions seeded.')
}

async function seedRolePermissions() {
  console.log('🔗 Assigning permissions to roles...')

  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1)
    if (role.length === 0) {
      console.log(`  ⏭️  Role "${roleName}" not found, skipping`)
      continue
    }

    const roleId = role[0].id

    for (const permName of permNames) {
      const perm = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1)
      if (perm.length === 0) continue

      const existing = await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId) && eq(rolePermissions.permissionId, perm[0].id))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(rolePermissions).values({
          roleId,
          permissionId: perm[0].id,
          action: 'allow',
        })
      }
    }

    console.log(`  ✅ ${roleName}: ${permNames.length} permissions`)
  }

  console.log('✅ Role permissions assigned.')
}

async function seed() {
  console.log('🌱 Starting RBAC seed...')
  await seedPermissions()
  await seedRolePermissions()
  console.log('🌱 RBAC seed complete.')
}

seed().catch((error) => {
  console.error('❌ RBAC seed failed:', error)
  process.exit(1)
})
