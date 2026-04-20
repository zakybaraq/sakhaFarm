import { Elysia } from "elysia";
import { suppliersController } from "./suppliers.controller";

export const suppliersRoutes = new Elysia({ prefix: "/api" }).use(
  suppliersController,
);
