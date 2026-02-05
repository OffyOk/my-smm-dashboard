import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { services } from "../db/schema";

export const servicesRoutes = new Hono();

servicesRoutes.get("/", async (c) => {
  const data = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      is_active: services.is_active,
      provider_code: services.provider_code,
      provider_service_id: services.provider_service_id,
      backup_service_id: services.backup_service_id,
      min_qty: services.min_qty,
      max_qty: services.max_qty,
      cost_price: services.cost_price,
      price_tiers: services.price_tiers,
    })
    .from(services)
    .orderBy(services.id);

  return c.json(
    data.map((row) => ({
      ...row,
      price: Number(row.price),
      cost_price: row.cost_price ? Number(row.cost_price) : null,
    }))
  );
});

const createSchema = z.object({
  id: z.number(),
  name: z.string(),
  provider_code: z.string().nullable().optional(),
  provider_service_id: z.number().nullable().optional(),
  cost_price: z.number().nullable().optional(),
  price: z.number(),
  price_tiers: z.any().optional(),
  min_qty: z.number().nullable().optional(),
  max_qty: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  backup_service_id: z.number().nullable().optional(),
});

servicesRoutes.post("/", zValidator("json", createSchema), async (c) => {
  const payload = c.req.valid("json");

  await db.insert(services).values({
    id: payload.id,
    name: payload.name,
    provider_code: payload.provider_code ?? null,
    provider_service_id: payload.provider_service_id ?? 0,
    cost_price: payload.cost_price?.toFixed(4) ?? "0",
    price: payload.price.toFixed(2),
    price_tiers: payload.price_tiers ?? [],
    min_qty: payload.min_qty ?? 100,
    max_qty: payload.max_qty ?? 10000,
    is_active: payload.is_active ?? true,
    backup_service_id: payload.backup_service_id ?? null,
  });

  return c.json({ success: true });
});

const patchSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  is_active: z.boolean().optional(),
  provider_code: z.string().nullable().optional(),
  provider_service_id: z.number().nullable().optional(),
  cost_price: z.number().nullable().optional(),
  price_tiers: z.any().optional(),
  min_qty: z.number().nullable().optional(),
  max_qty: z.number().nullable().optional(),
  backup_service_id: z.number().nullable().optional(),
});

servicesRoutes.patch("/:id", zValidator("json", patchSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const payload = c.req.valid("json");

  await db
    .update(services)
    .set({
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.price !== undefined ? { price: payload.price.toFixed(2) } : {}),
      ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
      ...(payload.provider_code !== undefined ? { provider_code: payload.provider_code } : {}),
      ...(payload.provider_service_id !== undefined
        ? { provider_service_id: payload.provider_service_id ?? 0 }
        : {}),
      ...(payload.cost_price !== undefined
        ? { cost_price: payload.cost_price?.toFixed(4) ?? "0" }
        : {}),
      ...(payload.price_tiers !== undefined ? { price_tiers: payload.price_tiers } : {}),
      ...(payload.min_qty !== undefined ? { min_qty: payload.min_qty ?? 100 } : {}),
      ...(payload.max_qty !== undefined ? { max_qty: payload.max_qty ?? 10000 } : {}),
      ...(payload.backup_service_id !== undefined
        ? { backup_service_id: payload.backup_service_id }
        : {}),
    })
    .where(eq(services.id, id));

  return c.json({ success: true });
});
