import type { Lucia } from "lucia";

declare global {
  namespace Elysia {
    interface GlobalContext {
      user: {
        id: string;
        email: string;
        name: string;
        roleId: number;
        tenantId: number;
      } | null;
      session: unknown;
      tenantId: number | null;
      tenantError?: string;
    }
  }
}
