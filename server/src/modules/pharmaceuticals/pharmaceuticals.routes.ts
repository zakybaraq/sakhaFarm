import { Elysia } from "elysia";
import { pharmaceuticalsController } from "./pharmaceuticals.controller";

export const pharmaceuticalsRoutes = new Elysia({ prefix: "/api" }).use(
  pharmaceuticalsController,
);