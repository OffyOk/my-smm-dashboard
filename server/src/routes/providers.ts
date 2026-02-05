import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { providers } from "../db/schema";

export const providersRoutes = new Hono();

providersRoutes.get("/", async (c) => {
  const data = await db
    .select({
      code: providers.code,
      name: providers.name,
      api_url: providers.apiUrl,
      api_key: providers.apiKey,
    })
    .from(providers)
    .orderBy(providers.code);

  return c.json(data);
});

providersRoutes.get("/balances", async (c) => {
  const data = await db
    .select({
      code: providers.code,
      api_url: providers.apiUrl,
      api_key: providers.apiKey,
    })
    .from(providers)
    .orderBy(providers.code);

  const results = await Promise.all(
    data.map(async (provider) => {
      try {
        const url = new URL(provider.api_url);
        url.searchParams.set("key", provider.api_key);
        url.searchParams.set("action", "balance");

        const response = await fetch(url.toString(), { method: "GET" });
        if (!response.ok) {
          return {
            code: provider.code,
            balance: null,
            balance_status: "error",
            balance_message: `HTTP ${response.status}`,
          };
        }
        const body = await response.json();
        const balanceValue =
          body?.balance ??
          body?.data?.balance ??
          body?.user?.balance ??
          body?.result?.balance ??
          null;
        const balance = balanceValue !== null ? Number(balanceValue) : null;

        return {
          code: provider.code,
          balance,
          balance_status: "ok",
          balance_message: body?.message ?? null,
        };
      } catch (error) {
        return {
          code: provider.code,
          balance: null,
          balance_status: "error",
          balance_message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return c.json(results);
});

const patchSchema = z.object({
  name: z.string().nullable().optional(),
  api_url: z.string().optional(),
  api_key: z.string().optional(),
});

providersRoutes.patch("/:code", zValidator("json", patchSchema), async (c) => {
  const code = c.req.param("code");
  const payload = c.req.valid("json");

  await db
    .update(providers)
    .set({
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.api_url !== undefined ? { apiUrl: payload.api_url } : {}),
      ...(payload.api_key !== undefined ? { apiKey: payload.api_key } : {}),
    })
    .where(eq(providers.code, code));

  return c.json({ success: true });
});
