import { Elysia, t } from "elysia";
import { getTenantId } from "../../plugins/tenant";
import {
  listPharmaceuticals,
  createPharmaceutical,
  getPharmaceutical,
  updatePharmaceutical,
  togglePharmaceutical,
  deletePharmaceutical,
  listPharmaceuticalStock,
  listPharmaceuticalBatches,
  createPharmaceuticalBatch,
  updatePharmaceuticalBatch,
  deletePharmaceuticalBatch,
  recordPharmaceuticalUsage,
} from "./pharmaceuticals.service";
import {
  PharmaceuticalNotFoundError,
  DuplicatePharmaceuticalCodeError,
  PharmaceuticalInUseError,
  BatchNotFoundError,
  InsufficientStockError,
} from "./errors";

const CATEGORIES = ["vitamin", "medicine"] as const;

export const pharmaceuticalsController = (app: Elysia) =>
  app
    .derive(async (ctx: any) => ({ currentTenantId: getTenantId(ctx) }))
    .get(
      "/vitamins-medicines",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        const filters: { category?: string; isActive?: boolean } = {};

        if (ctx.query.category) {
          filters.category = ctx.query.category as string;
        }

        if (ctx.query.isActive !== undefined) {
          filters.isActive = ctx.query.isActive === "true";
        }

        const items = await listPharmaceuticals(currentTenantId, filters);
        return { items };
      },
      {
        query: t.Object({
          category: t.Optional(t.String()),
          isActive: t.Optional(t.String()),
        }),
      },
    )
    .post(
      "/vitamins-medicines",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        if (!ctx.user) {
          throw new Error("MISSING_USER_ID");
        }
        const userId = ctx.user.id;

        return createPharmaceutical(
          ctx.body,
          currentTenantId,
          userId,
        );
      },
      {
        body: t.Object({
          code: t.String({ minLength: 1, maxLength: 20 }),
          name: t.String({ minLength: 1, maxLength: 100 }),
          category: t.Union(CATEGORIES.map((c) => t.Literal(c))),
          unitOfMeasure: t.String({ minLength: 1, maxLength: 50 }),
          manufacturer: t.Optional(t.String({ maxLength: 100 })),
          strength: t.Optional(t.String({ maxLength: 50 })),
          phone: t.Optional(t.String({ maxLength: 20 })),
          supplierId: t.Optional(t.Number()),
        }),
      },
    )
    .put(
      "/vitamins-medicines/:id",
      async (ctx) => {
        const { currentTenantId } = ctx;
        const id = parseInt(ctx.params.id);

        if (isNaN(id)) {
          throw new Error("INVALID_PHARMACEUTICAL_ID");
        }

        return updatePharmaceutical(id, ctx.body, currentTenantId, ctx.user?.id);
      },
      {
        body: t.Object({
          code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
          name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
          category: t.Optional(t.Union(CATEGORIES.map((c) => t.Literal(c)))),
          unitOfMeasure: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
          manufacturer: t.Optional(t.String({ maxLength: 100 })),
          strength: t.Optional(t.String({ maxLength: 50 })),
          phone: t.Optional(t.String({ maxLength: 20 })),
          supplierId: t.Optional(t.Number()),
        }),
      },
    )
    .put("/vitamins-medicines/:id/toggle", async (ctx) => {
      const { currentTenantId } = ctx;
      const id = parseInt(ctx.params.id);

      if (isNaN(id)) {
        throw new Error("INVALID_PHARMACEUTICAL_ID");
      }

      return togglePharmaceutical(id, currentTenantId, ctx.user?.id);
    })
    .delete("/vitamins-medicines/:id", async (ctx) => {
      const { currentTenantId } = ctx;
      const id = parseInt(ctx.params.id);

      if (isNaN(id)) {
        throw new Error("INVALID_PHARMACEUTICAL_ID");
      }

      return deletePharmaceutical(id, currentTenantId, ctx.user?.id);
    })
    .get(
      "/pharmaceutical-stock",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        const filters: { plasmaId?: number; itemId?: number; category?: string } = {};

        if (ctx.query.plasmaId) {
          filters.plasmaId = parseInt(ctx.query.plasmaId);
        }
        if (ctx.query.itemId) {
          filters.itemId = parseInt(ctx.query.itemId);
        }
        if (ctx.query.category) {
          filters.category = ctx.query.category as string;
        }

        const stocks = await listPharmaceuticalStock(currentTenantId, filters);
        return { stocks };
      },
      {
        query: t.Object({
          plasmaId: t.Optional(t.String()),
          itemId: t.Optional(t.String()),
          category: t.Optional(t.String()),
        }),
      },
    )
    .get(
      "/pharmaceutical-batches",
      async (ctx: any) => {
        const itemId = parseInt(ctx.query.itemId);

        if (isNaN(itemId)) {
          throw new Error("INVALID_ITEM_ID");
        }

        const batches = await listPharmaceuticalBatches(itemId);
        return { batches };
      },
      {
        query: t.Object({
          itemId: t.String(),
        }),
      },
    )
    .post(
      "/pharmaceutical-batches",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        if (!ctx.user) {
          throw new Error("MISSING_USER_ID");
        }
        const userId = ctx.user.id;

        return createPharmaceuticalBatch(
          ctx.body,
          currentTenantId,
          userId,
        );
      },
      {
        body: t.Object({
          itemId: t.Number(),
          batchNumber: t.String({ minLength: 1, maxLength: 50 }),
          expiryDate: t.String({ format: "date" }),
          receivedQty: t.String(),
        }),
      },
    )
    .put(
      "/pharmaceutical-batches/:id",
      async (ctx) => {
        const { currentTenantId } = ctx;
        const id = parseInt(ctx.params.id);

        if (isNaN(id)) {
          throw new Error("INVALID_BATCH_ID");
        }

        return updatePharmaceuticalBatch(id, ctx.body, currentTenantId, ctx.user?.id);
      },
      {
        body: t.Object({
          batchNumber: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
          expiryDate: t.Optional(t.String({ format: "date" })),
          remainingQty: t.Optional(t.String()),
        }),
      },
    )
    .delete("/pharmaceutical-batches/:id", async (ctx) => {
      const { currentTenantId } = ctx;
      const id = parseInt(ctx.params.id);

      if (isNaN(id)) {
        throw new Error("INVALID_BATCH_ID");
      }

      return deletePharmaceuticalBatch(id, currentTenantId, ctx.user?.id);
    })
    .post(
      "/pharmaceutical-usage",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        if (!ctx.user) {
          throw new Error("MISSING_USER_ID");
        }
        const userId = ctx.user.id;

        return recordPharmaceuticalUsage(
          ctx.body,
          currentTenantId,
          userId,
        );
      },
      {
        body: t.Object({
          plasmaId: t.Number(),
          itemId: t.Number(),
          batchQuantities: t.Array(t.Object({
            batchId: t.Number(),
            quantity: t.String(),
          })),
          date: t.String({ format: "date" }),
          note: t.Optional(t.String()),
        }),
      },
    )
    .onError(({ error, set }) => {
      if (error instanceof PharmaceuticalNotFoundError) {
        set.status = 404;
        return { error: error.message, code: "PHARMACEUTICAL_NOT_FOUND" };
      }
      if (error instanceof PharmaceuticalInUseError) {
        set.status = 409;
        return { error: error.message, code: "PHARMACEUTICAL_IN_USE" };
      }
      if (error instanceof DuplicatePharmaceuticalCodeError) {
        set.status = 409;
        return { error: error.message, code: "DUPLICATE_PHARMACEUTICAL_CODE" };
      }
      if (error instanceof BatchNotFoundError) {
        set.status = 404;
        return { error: error.message, code: "BATCH_NOT_FOUND" };
      }
      if (error instanceof InsufficientStockError) {
        set.status = 400;
        return { error: error.message, code: "INSUFFICIENT_STOCK" };
      }
    });