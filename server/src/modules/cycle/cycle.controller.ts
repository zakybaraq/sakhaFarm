import { Elysia, t } from "elysia";
import { requirePermission } from "../../plugins/rbac";
import { getTenantId } from "../../plugins/tenant";
import {
  createCycle,
  listCycles,
  getCycle,
  updateCycle,
  softDeleteCycle,
  completeCycle,
  failCycle,
} from "./cycle.service";
import { getCycleSummary } from "../recordings/recordings.summary";
import {
  CycleNotFoundError,
  CycleCapacityExceededError,
  InvalidCycleStatusTransitionError,
  CycleNotInTenantPlasmaError,
  CycleHasRecordingsError,
  InvalidDocTypeError,
} from "./cycle.errors";

export const cycleController = new Elysia({ prefix: "/api/cycles" })
  .onError(({ error, set }) => {
    if (error instanceof CycleNotFoundError) {
      set.status = 404;
      return { error: error.message, code: "CYCLE_NOT_FOUND" };
    }
    if (error instanceof CycleCapacityExceededError) {
      set.status = 409;
      return { error: error.message, code: "CYCLE_CAPACITY_EXCEEDED" };
    }
    if (error instanceof InvalidCycleStatusTransitionError) {
      set.status = 409;
      return { error: error.message, code: "INVALID_STATUS_TRANSITION" };
    }
    if (error instanceof CycleNotInTenantPlasmaError) {
      set.status = 409;
      return { error: error.message, code: "CYCLE_NOT_IN_TENANT_PLASMA" };
    }
    if (error instanceof CycleHasRecordingsError) {
      set.status = 409;
      return { error: error.message, code: "CYCLE_HAS_RECORDINGS" };
    }
    if (error instanceof InvalidDocTypeError) {
      set.status = 400;
      return { error: error.message, code: "INVALID_DOC_TYPE" };
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
    "/",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      const cycle = await createCycle(ctx.body, currentTenantId, userId);
      return { success: true, cycle };
    },
    {
      beforeHandle: requirePermission("cycle.create"),
      body: t.Object({
        plasmaId: t.Number(),
        docType: t.String({ minLength: 1, maxLength: 50 }),
        chickInDate: t.String(),
        initialPopulation: t.Number({ minimum: 1 }),
      }),
    },
  )
  .get(
    "/",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      const plasmaId = ctx.query.plasmaId
        ? parseInt(ctx.query.plasmaId as string, 10)
        : undefined;
      const status = ctx.query.status as string | undefined;

      const result = await listCycles(currentTenantId, plasmaId, status);
      return { cycles: result };
    },
    {
      beforeHandle: requirePermission("cycle.read"),
      query: t.Object({
        plasmaId: t.Optional(t.String({ format: "integer" })),
        status: t.Optional(
          t.Enum({
            active: "active",
            completed: "completed",
            failed: "failed",
          }),
        ),
      }),
    },
  )
  .get(
    "/:id",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      const cycle = await getCycle(
        parseInt(ctx.params.id, 10),
        currentTenantId,
      );
      return { cycle };
    },
    {
      beforeHandle: requirePermission("cycle.read"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
    },
  )
  .put(
    "/:id",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      await updateCycle(
        parseInt(ctx.params.id, 10),
        ctx.body,
        currentTenantId,
        userId,
      );
      return { success: true };
    },
    {
      beforeHandle: requirePermission("cycle.update"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
      body: t.Object({
        docType: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        chickInDate: t.Optional(t.String()),
        initialPopulation: t.Optional(t.Number({ minimum: 1 })),
        status: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    "/:id",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      await softDeleteCycle(
        parseInt(ctx.params.id, 10),
        currentTenantId,
        userId,
      );
      return { success: true };
    },
    {
      beforeHandle: requirePermission("cycle.delete"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
    },
  )
  .post(
    "/:id/complete",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      await completeCycle(
        parseInt(ctx.params.id, 10),
        ctx.body,
        currentTenantId,
        userId,
      );
      return { success: true };
    },
    {
      beforeHandle: requirePermission("cycle.complete"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
      body: t.Object({
        harvestDate: t.String(),
        finalPopulation: t.Number({ minimum: 0 }),
      }),
    },
  )
  .post(
    "/:id/fail",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      if (!ctx.user) {
        throw new Error("MISSING_USER_ID");
      }
      const userId = ctx.user.id;

      await failCycle(
        parseInt(ctx.params.id, 10),
        ctx.body,
        currentTenantId,
        userId,
      );
      return { success: true };
    },
    {
      beforeHandle: requirePermission("cycle.fail"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
      body: t.Object({
        harvestDate: t.String(),
        notes: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/:id/summary",
    async (ctx: any) => {
      const currentTenantId = getTenantId(ctx);
      const summary = await getCycleSummary(
        parseInt(ctx.params.id, 10),
        currentTenantId,
      );
      return { summary };
    },
    {
      beforeHandle: requirePermission("cycle.read"),
      params: t.Object({
        id: t.String({ format: "integer" }),
      }),
    },
  );
