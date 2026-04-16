import { db } from '../../config/database'
import { roles, tenants, users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { hash } from '@node-rs/argon2'
import { generateIdFromEntropySize } from 'lucia'

async function seed() {
  console.log('🌱 Starting minimal seed...')

  const defaultRoles = [
    { name: 'Super Admin', description: 'Full system access, can manage roles and users', isDefault: 1 },
    { name: 'Admin Unit', description: 'Manages units and plasmas within assigned unit', isDefault: 1 },
    { name: 'Admin Plasma', description: 'Manages daily recordings for assigned plasma', isDefault: 1 },
    { name: 'Viewer', description: 'Read-only access to reports and dashboards', isDefault: 1 },
  ]

  for (const role of defaultRoles) {
    const existing = await db.select().from(roles).where(eq(roles.name, role.name))
    if (existing.length === 0) {
      await db.insert(roles).values(role)
      console.log(`  ✅ Role created: ${role.name}`)
    } else {
      console.log(`  ⏭️  Role exists: ${role.name}`)
    }
  }

  const existingTenant = await db.select().from(tenants).where(eq(tenants.slug, 'sakha-farm'))
  if (existingTenant.length === 0) {
    await db.insert(tenants).values({
      name: 'Sakha Farm',
      slug: 'sakha-farm',
      isActive: 1,
    })
    console.log('  ✅ Tenant created: Sakha Farm')
  } else {
    console.log('  ⏭️  Tenant exists: Sakha Farm')
  }

  const tenant = await db.select().from(tenants).where(eq(tenants.slug, 'sakha-farm')).limit(1)
  const tenantId = tenant[0]?.id

  const superAdminRole = await db.select().from(roles).where(eq(roles.name, 'Super Admin')).limit(1)
  const superAdminRoleId = superAdminRole[0]?.id

  const existingUser = await db.select().from(users).where(eq(users.email, 'admin@sakhafarm.local'))
  if (existingUser.length === 0) {
    const userId = generateIdFromEntropySize(10)
    const passwordHash = await hash('changeme123', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })
    await db.insert(users).values({
      id: userId,
      email: 'admin@sakhafarm.local',
      passwordHash,
      name: 'Administrator',
      roleId: superAdminRoleId!,
      tenantId: tenantId!,
      isActive: 1,
      isLocked: 0,
      forcePasswordChange: 1,
    })
    console.log('  ✅ User created: admin@sakhafarm.local')
  } else {
    console.log('  ⏭️  User exists: admin@sakhafarm.local')
  }

  console.log('🌱 Minimal seed complete.')
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})
