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
    })
    .from(services)
    .orderBy(services.id);

  return c.json(
    data.map((row) => ({
      ...row,
      price: Number(row.price),
    }))
  );
});

const patchSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  is_active: z.boolean().optional(),
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
    })
    .where(eq(services.id, id));

  return c.json({ success: true });
});
