import { Elysia, t } from "elysia";
import { requirePermission } from "../../plugins/rbac";
import { getTenantId } from "../../plugins/tenant";
import {
  createFeedProduct,
  listFeedProducts,
  getFeedProduct,
  updateFeedProduct,
  softDeleteFeedProduct,
  createSuratJalan,
  getStockForPlasmaFeed,
  getAllStock,
  recordFeedConsumption,
} from "./feed.service";
import {
  FeedProductNotFoundError,
  DuplicateFeedCodeError,
  InvalidSuratJalanError,
  FeedStockNotFoundError,
  NegativeStockError,
  PlasmaNotInTenantError,
} from "./feed.errors";

export const feedController = new Elysia({ prefix: "/api/feed" })
  .onError(({ error, set }) => {
    if (error instanceof FeedProductNotFoundError) {
      set.status = 404;
      return { error: error.message, code: "FEED_PRODUCT_NOT_FOUND" };
    }
    if (error instanceof DuplicateFeedCodeError) {
      set.status = 409;
      return { error: error.message, code: "DUPLICATE_FEED_CODE" };
    }
    if (error instanceof InvalidSuratJalanError) {
      set.status = 409;
      return { error: error.message, code: "INVALID_SURAT_JALAN" };
    }
    if (error instanceof FeedStockNotFoundError) {
      set.status = 404;
      return { error: error.message, code: "FEED_STOCK_NOT_FOUND" };
    }
    if (error instanceof NegativeStockError) {
      set.status = 400;
      return { error: error.message, code: "NEGATIVE_STOCK" };
    }
    if (error instanceof PlasmaNotInTenantError) {
      set.status = 403;
      return { error: error.message, code: "PLASMA_NOT_IN_TENANT" };
    }
    if (error instanceof Error && error.message === "MISSING_TENANT_ID") {
      set.status = 400;
      return { error: "Tenant ID is required", code: "MISSING_TENANT_ID" };
    }
    if (error instanceof Error && error.message === "MISSING_USER_ID") {
      set.status = 401;
      return { error: "Authentication required", code: "MISSING_USER_ID" };
    }
  })
  .post(
    "/products",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      const product = await createFeedProduct(
        ctx.body,
        currentTenantId,
        userId,
      );
      return { success: true, product };
    },
    {
      beforeHandle: requirePermission("feed.create"),
      body: t.Object({
        code: t.String({ minLength: 1, maxLength: 20 }),
        name: t.String({ minLength: 1, maxLength: 100 }),
        typeId: t.Optional(t.Number({ minimum: 1 })),
        brandId: t.Optional(t.Number({ minimum: 1 })),
        proteinPercent: t.Optional(t.Number({ minimum: 0 })),
        defaultUnit: t.Optional(t.String({ maxLength: 10 })),
        zakKgConversion: t.Optional(t.Number({ minimum: 0 })),
      }),
    },
  )
  .get(
    "/products",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      const products = await listFeedProducts(currentTenantId);
      return { products };
    },
    {
      beforeHandle: requirePermission("feed.read"),
    },
  )
  .get(
    "/products/:id",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      const product = await getFeedProduct(
        parseInt(ctx.params.id, 10),
        currentTenantId,
      );
      return { product };
    },
    {
      beforeHandle: requirePermission("feed.read"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
    },
  )
  .put(
    "/products/:id",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      await updateFeedProduct(
        parseInt(ctx.params.id, 10),
        ctx.body,
        currentTenantId,
        userId,
      );
      return { success: true };
    },
    {
      beforeHandle: requirePermission("feed.update"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        typeId: t.Optional(t.Number({ minimum: 1 })),
        brandId: t.Optional(t.Number({ minimum: 1 })),
        proteinPercent: t.Optional(t.Number({ minimum: 0 })),
        defaultUnit: t.Optional(t.String({ maxLength: 10 })),
        zakKgConversion: t.Optional(t.Number({ minimum: 0 })),
      }),
    },
  )
  .delete(
    "/products/:id",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      await softDeleteFeedProduct(
        parseInt(ctx.params.id, 10),
        currentTenantId,
        userId,
      );
      return { success: true };
    },
    {
      beforeHandle: requirePermission("feed.delete"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
    },
  )
  .post(
    "/surat-jalan",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      const result = await createSuratJalan(ctx.body, currentTenantId, userId);
      return result;
    },
    {
      beforeHandle: requirePermission("feed.create"),
      body: t.Object({
        plasmaId: t.Number({ minimum: 1 }),
        feedProductId: t.Number({ minimum: 1 }),
        suratJalanNumber: t.String({ minLength: 1, maxLength: 50 }),
        vendor: t.String({ minLength: 1, maxLength: 100 }),
        deliveryDate: t.String({ format: "date" }),
        vehicleNumber: t.Optional(t.String({ maxLength: 20 })),
        driverName: t.Optional(t.String({ maxLength: 100 })),
        totalZak: t.Number({ minimum: 0 }),
        totalKg: t.Number({ minimum: 0 }),
        notes: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/stock",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);

      if (ctx.query.plasmaId && ctx.query.feedProductId) {
        const stock = await getStockForPlasmaFeed(
          ctx.query.plasmaId,
          ctx.query.feedProductId,
          currentTenantId,
        );
        return { stock };
      }

      const stocks = await getAllStock(
        currentTenantId,
        ctx.query.plasmaId,
        ctx.query.feedProductId,
      );
      return { stocks };
    },
    {
      beforeHandle: requirePermission("feed.read"),
      query: t.Object({
        plasmaId: t.Optional(t.Number({ minimum: 1 })),
        feedProductId: t.Optional(t.Number({ minimum: 1 })),
      }),
    },
  )
  .post(
    "/consume",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      const result = await recordFeedConsumption(
        ctx.body,
        currentTenantId,
        userId,
      );
      return result;
    },
    {
      beforeHandle: requirePermission("feed.create"),
      body: t.Object({
        plasmaId: t.Number({ minimum: 1 }),
        feedProductId: t.Number({ minimum: 1 }),
        recordingId: t.Optional(t.Number({ minimum: 1 })),
        consumptionKg: t.Number({ minimum: 0, exclusiveMinimum: true }),
        consumptionZak: t.Optional(t.Number({ minimum: 0 })),
        notes: t.Optional(t.String()),
      }),
    },
  );
