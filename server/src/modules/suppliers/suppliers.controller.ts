import { Elysia, t } from "elysia";
import { getTenantId } from "../../plugins/tenant";
import * as supplierService from "./suppliers.service";

const CATEGORIES = ["feed", "vitamin", "medicine", "other"] as const;

/**
 * Suppliers controller — CRUD endpoints for supplier management.
 */
export const suppliersController = (app: Elysia) =>
  app
    .derive(async (ctx: any) => ({ currentTenantId: getTenantId(ctx) }))
    .get(
      "/suppliers",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        const filters: { category?: string; isActive?: boolean } = {};

        if (ctx.query.category) {
          filters.category = ctx.query.category as string;
        }

        if (ctx.query.isActive !== undefined) {
          filters.isActive = ctx.query.isActive === "true";
        }

        const suppliers = await supplierService.listSuppliers(currentTenantId, filters);
        return { suppliers };
      },
      {
        query: t.Object({
          category: t.Optional(t.String()),
          isActive: t.Optional(t.String()),
        }),
      },
    )
    .post(
      "/suppliers",
      async (ctx: any) => {
        const { currentTenantId } = ctx;
        if (!ctx.user) {
          throw new Error("MISSING_USER_ID");
        }
        const userId = ctx.user.id;

        return supplierService.createSupplier(
          ctx.body,
          currentTenantId,
          userId,
        );
      },
      {
        beforeHandle: (ctx: any) => {
          if (!ctx.user) {
            throw new Error("MISSING_USER_ID");
          }
        },
        body: t.Object({
          code: t.String({ minLength: 1, maxLength: 20 }),
          name: t.String({ minLength: 1, maxLength: 100 }),
          contactPerson: t.Optional(t.String({ maxLength: 100 })),
          phone: t.String({ minLength: 1, maxLength: 20 }),
          address: t.Optional(t.String()),
          category: t.Union(CATEGORIES.map((c) => t.Literal(c))),
        }),
      },
    )
    .put(
      "/suppliers/:id",
      async (ctx) => {
        const { currentTenantId } = ctx;
        const id = parseInt(ctx.params.id);

        if (isNaN(id)) {
          throw new Error("INVALID_SUPPLIER_ID");
        }

        return supplierService.updateSupplier(id, ctx.body, currentTenantId);
      },
      {
        body: t.Object({
          code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
          name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
          contactPerson: t.Optional(t.String({ maxLength: 100 })),
          phone: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
          address: t.Optional(t.String()),
          category: t.Optional(t.Union(CATEGORIES.map((c) => t.Literal(c)))),
        }),
      },
    )
    .put("/suppliers/:id/toggle", async (ctx) => {
      const { currentTenantId } = ctx;
      const id = parseInt(ctx.params.id);

      if (isNaN(id)) {
        throw new Error("INVALID_SUPPLIER_ID");
      }

      return supplierService.toggleSupplier(id, currentTenantId);
    })
    .delete("/suppliers/:id", async (ctx) => {
      const { currentTenantId } = ctx;
      const id = parseInt(ctx.params.id);

      if (isNaN(id)) {
        throw new Error("INVALID_SUPPLIER_ID");
      }

      return supplierService.deleteSupplier(id, currentTenantId);
    });
