import { db } from "../../config/database";
import { feedTypes } from "../../db/schema";
import { sql, eq, and } from "drizzle-orm";

interface PhaseRow {
  tenant_id: number;
  phase: string;
}

async function migratePhaseToType() {
  console.log("🌱 Starting phase → feed_types migration...");

  // Step 1: read distinct (tenant_id, phase) pairs directly from MySQL.
  // We use raw SQL because the Drizzle schema no longer knows about `phase`.
  const distinctRows = await db.execute(
    sql`SELECT DISTINCT tenant_id, phase FROM feed_products WHERE phase IS NOT NULL AND phase <> ''`,
  );

  // drizzle-orm mysql2 returns [rows, fields]; normalize to array-of-objects.
  const rows = (Array.isArray(distinctRows)
    ? distinctRows[0]
    : distinctRows) as unknown as PhaseRow[];

  if (!rows || rows.length === 0) {
    console.log("  ⏭️  No phase values found — nothing to migrate.");
    return;
  }

  console.log(`  Found ${rows.length} distinct (tenant, phase) pair(s).`);

  // Step 2: insert feed_types rows (one per distinct pair), skipping existing.
  for (const row of rows) {
    const code = row.phase.toUpperCase().slice(0, 20);
    const name = row.phase.slice(0, 100);

    const existing = await db
      .select()
      .from(feedTypes)
      .where(
        and(eq(feedTypes.tenantId, row.tenant_id), eq(feedTypes.code, code)),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(
        `  ⏭️  feed_type exists: tenant=${row.tenant_id} code=${code}`,
      );
      continue;
    }

    await db.insert(feedTypes).values({ tenantId: row.tenant_id, code, name });
    console.log(
      `  ✅ feed_type created: tenant=${row.tenant_id} code=${code} name=${name}`,
    );
  }

  // Step 3: back-fill feed_products.type_id from the newly seeded feed_types.
  // Use raw SQL because `phase` is no longer in the Drizzle schema.
  const backfill = await db.execute(
    sql`
      UPDATE feed_products fp
      JOIN feed_types ft
        ON fp.tenant_id = ft.tenant_id
       AND UPPER(fp.phase) = ft.code
      SET fp.type_id = ft.id
      WHERE fp.type_id IS NULL AND fp.phase IS NOT NULL
    `,
  );

  console.log("  ✅ type_id back-fill completed.");
  console.log("🌱 Migration complete.");
  console.log("");
  console.log(
    "NEXT STEP: run \`bun run --cwd server db:push\` to drop the phase column and add FK constraints.",
  );
}

migratePhaseToType().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
