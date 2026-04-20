import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { lucia } from "../../auth/lucia";
import { db } from "../../config/database";
import { users, roles } from "../../db/schema";
import { tenants } from "../../db/schema/tenants";
import { eq, and, or, like, desc, ne, SQL, sql } from "drizzle-orm";
import {
  generateTempPassword,
  validatePasswordStrength,
} from "../../lib/password";
import {
  DuplicateEmailError,
  InvalidRoleError,
  UserNotFoundError,
  CsvImportError,
  WeakPasswordError,
  InvalidTenantError,
} from "./users.errors";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  roleId: number;
  tenantId: number;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  roleId?: number;
}

export interface ListUsersFilters {
  name?: string;
  email?: string;
  roleId?: number;
  tenantId?: number;
  status?: "active" | "inactive";
}

export interface UserWithRelations {
  id: string;
  email: string;
  name: string;
  roleId: number;
  tenantId: number;
  isActive: number | null;
  isLocked: number | null;
  forcePasswordChange: number | null;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  roleName: string | null;
  tenantName: string | null;
}

export interface CsvUserRow {
  email: string;
  name: string;
  roleId: number;
}

/**
 * Creates a new user with Lucia Auth.
 */
export async function createUser(input: CreateUserInput) {
  const normalizedEmail = input.email.toLowerCase();

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));
  if (existingUser.length > 0) {
    throw new DuplicateEmailError(normalizedEmail);
  }

  const roleCheck = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.id, input.roleId), ne(roles.isDefault, -1)))
    .limit(1);
  if (roleCheck.length === 0) {
    throw new InvalidRoleError(input.roleId);
  }

  const tenantCheck = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);
  if (tenantCheck.length === 0) {
    throw new InvalidTenantError(input.tenantId);
  }

  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) {
    throw new WeakPasswordError(passwordError);
  }

  const userId = generateIdFromEntropySize(10);
  const passwordHash = await hash(input.password, ARGON2_OPTIONS);

  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    passwordHash,
    name: input.name,
    roleId: input.roleId,
    tenantId: input.tenantId,
    isActive: 1,
    isLocked: 0,
    forcePasswordChange: 0,
  });

  return { userId, email: normalizedEmail, name: input.name };
}

/**
 * Lists users with optional filters.
 */
export async function listUsers(
  filters?: ListUsersFilters,
): Promise<UserWithRelations[]> {
  const conditions: SQL<unknown>[] = [];

  if (filters) {
    if (filters.name) {
      const nameCondition = or(
        like(users.name, `%${filters.name}%`),
        like(users.email, `%${filters.name}%`),
      );
      if (nameCondition) conditions.push(nameCondition);
    }
    if (filters.email) {
      conditions.push(like(users.email, `%${filters.email}%`));
    }
    if (filters.roleId !== undefined) {
      conditions.push(eq(users.roleId, filters.roleId));
    }
    if (filters.tenantId !== undefined) {
      conditions.push(eq(users.tenantId, filters.tenantId));
    }
    if (filters.status === "active") {
      conditions.push(eq(users.isActive, 1));
    } else if (filters.status === "inactive") {
      conditions.push(eq(users.isActive, 0));
    }
  }

  const query = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      roleId: users.roleId,
      tenantId: users.tenantId,
      status: sql<string>`case when ${users.isActive} = 1 then 'active' else 'inactive' end`,
      isActive: users.isActive,
      isLocked: users.isLocked,
      forcePasswordChange: users.forcePasswordChange,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id));

  if (conditions.length === 1) {
    const result = await query
      .where(conditions[0])
      .orderBy(desc(users.createdAt));
    return result;
  }

  if (conditions.length > 1) {
    const combined = and(...conditions);
    if (combined) {
      const result = await query.where(combined).orderBy(desc(users.createdAt));
      return result;
    }
  }

  const result = await query.orderBy(desc(users.createdAt));
  return result;
}

/**
 * Gets a single user by ID with role and tenant info.
 */
export async function getUser(id: string): Promise<UserWithRelations> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      roleId: users.roleId,
      tenantId: users.tenantId,
      isActive: users.isActive,
      isLocked: users.isLocked,
      forcePasswordChange: users.forcePasswordChange,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, id))
    .limit(1);

  if (result.length === 0) {
    throw new UserNotFoundError(id);
  }

  return result[0];
}

/**
 * Updates a user's name, email, or role.
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (existingUser.length === 0) {
    throw new UserNotFoundError(id);
  }

  if (input.email) {
    const normalizedEmail = input.email.toLowerCase();
    const duplicateCheck = await db
      .select()
      .from(users)
      .where(and(eq(users.email, normalizedEmail), ne(users.id, id)));

    if (duplicateCheck.length > 0) {
      throw new DuplicateEmailError(normalizedEmail);
    }
  }

  if (input.roleId !== undefined) {
    const roleCheck = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.id, input.roleId), ne(roles.isDefault, -1)))
      .limit(1);
    if (roleCheck.length === 0) {
      throw new InvalidRoleError(input.roleId);
    }
  }

  const updateData: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email.toLowerCase();
  if (input.roleId !== undefined) updateData.roleId = input.roleId;

  await db.update(users).set(updateData).where(eq(users.id, id));

  return { success: true };
}

/**
 * Deactivates a user by setting isActive to 0.
 */
export async function deactivateUser(id: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (existingUser.length === 0) {
    throw new UserNotFoundError(id);
  }

  await db.update(users).set({ isActive: 0 }).where(eq(users.id, id));
  await lucia.invalidateUserSessions(id);

  return { success: true };
}

/**
 * Activates a user by setting isActive to 1.
 */
export async function activateUser(id: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (existingUser.length === 0) {
    throw new UserNotFoundError(id);
  }

  await db.update(users).set({ isActive: 1 }).where(eq(users.id, id));

  return { success: true };
}

/**
 * Permanently deletes a user.
 */
export async function deleteUser(id: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (existingUser.length === 0) {
    throw new UserNotFoundError(id);
  }

  await db.delete(users).where(eq(users.id, id));

  return { success: true };
}

/**
 * Admin-only password reset. Generates a temporary password and invalidates sessions.
 */
export async function resetPassword(userId: string) {
  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (targetUser.length === 0) {
    throw new UserNotFoundError(userId);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hash(tempPassword, ARGON2_OPTIONS);

  await db
    .update(users)
    .set({
      passwordHash,
      forcePasswordChange: 1,
      failedLoginAttempts: 0,
      isLocked: 0,
    })
    .where(eq(users.id, userId));

  await lucia.invalidateUserSessions(userId);

  return tempPassword;
}

/**
 * Searches users by name or email with optional filters.
 */
export async function searchUsers(
  query: string,
  filters?: ListUsersFilters,
): Promise<UserWithRelations[]> {
  const searchPattern = `%${query}%`;
  const conditions: SQL<unknown>[] = [];

  const searchCondition = or(
    like(users.name, searchPattern),
    like(users.email, searchPattern),
  );
  if (searchCondition) conditions.push(searchCondition);

  if (filters?.roleId !== undefined) {
    conditions.push(eq(users.roleId, filters.roleId));
  }
  if (filters?.tenantId !== undefined) {
    conditions.push(eq(users.tenantId, filters.tenantId));
  }
  if (filters?.status === "active") {
    conditions.push(eq(users.isActive, 1));
  } else if (filters?.status === "inactive") {
    conditions.push(eq(users.isActive, 0));
  }

  const baseQuery = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      roleId: users.roleId,
      tenantId: users.tenantId,
      isActive: users.isActive,
      isLocked: users.isLocked,
      forcePasswordChange: users.forcePasswordChange,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id));

  if (conditions.length === 1) {
    const result = await baseQuery
      .where(conditions[0])
      .orderBy(desc(users.name));
    return result;
  }

  if (conditions.length > 1) {
    const combined = and(...conditions);
    if (combined) {
      const result = await baseQuery.where(combined).orderBy(desc(users.name));
      return result;
    }
  }

  const result = await baseQuery.orderBy(desc(users.name));
  return result;
}

/**
 * Parses CSV content and creates users.
 * Expected CSV format: email,name,role_id (header row required).
 */
export async function importUsersFromCSV(
  csvContent: string,
  defaultTenantId: number,
) {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new CsvImportError(
      1,
      "CSV must contain a header row and at least one data row",
    );
  }

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  const emailIdx = header.indexOf("email");
  const nameIdx = header.indexOf("name");
  const roleIdIdx = header.indexOf("role_id");

  if (emailIdx === -1 || nameIdx === -1 || roleIdIdx === -1) {
    throw new CsvImportError(
      1,
      "CSV must contain email, name, and role_id columns",
    );
  }

  const created: string[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const values = lines[i].split(",").map((v) => v.trim());

    const email = values[emailIdx]?.toLowerCase();
    const name = values[nameIdx];
    const roleIdStr = values[roleIdIdx];

    if (!email || !name || !roleIdStr) {
      errors.push(`Row ${rowNumber}: missing required fields`);
      continue;
    }

    const roleId = parseInt(roleIdStr, 10);
    if (isNaN(roleId)) {
      errors.push(`Row ${rowNumber}: invalid role_id "${roleIdStr}"`);
      continue;
    }

    try {
      const tempPassword = generateTempPassword();
      await createUser({
        email,
        password: tempPassword,
        name,
        roleId,
        tenantId: defaultTenantId,
      });
      created.push(email);
    } catch (err) {
      if (err instanceof DuplicateEmailError) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      } else if (err instanceof InvalidRoleError) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      } else if (err instanceof Error) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      } else {
        errors.push(`Row ${rowNumber}: unknown error`);
      }
    }
  }

  return { created, errors, totalRows: lines.length - 1 };
}
