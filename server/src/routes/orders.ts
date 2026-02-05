import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, providers, services } from "../db/schema";

export const ordersRoutes = new Hono();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(15),
  search: z.string().optional(),
  status: z.string().optional(),
});

ordersRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { page, pageSize, search, status } = c.req.valid("query");

  const filters = [];
  if (status) {
    filters.push(eq(orders.status, status));
  }
  if (search) {
    const numeric = Number(search);
    if (!Number.isNaN(numeric)) {
      filters.push(or(eq(orders.id, numeric), ilike(orders.link, `%${search}%`))!);
    } else {
      filters.push(ilike(orders.link, `%${search}%`));
    }
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(whereClause);

  const data = await db
    .select({
      id: orders.id,
      created_at: orders.createdAt,
      link: orders.link,
      quantity: orders.quantity,
      status: orders.status,
      provider_order_id: orders.providerOrderId,
      start_count: orders.startCount,
      service_name: services.name,
      provider_code: providers.code,
    })
    .from(orders)
    .leftJoin(services, eq(orders.serviceId, services.id))
    .leftJoin(providers, eq(services.providerCode, providers.code))
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json({
    data,
    page,
    pageSize,
    total: Number(count ?? 0),
  });
});

ordersRoutes.post("/:id/refill", async (c) => {
  const orderId = Number(c.req.param("id"));
  const [order] = await db
    .select({
      id: orders.id,
      link: orders.link,
      quantity: orders.quantity,
      service_id: orders.serviceId,
      provider_order_id: orders.providerOrderId,
      start_count: orders.startCount,
    })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  const webhookUrl = process.env.N8N_REFILL_WEBHOOK_URL;
  if (!webhookUrl) {
    return c.json({ error: "N8N_REFILL_WEBHOOK_URL not set" }, 500);
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: order.id,
      service_id: order.service_id,
      link: order.link,
      quantity: order.quantity,
      provider_order_id: order.provider_order_id,
      start_count: order.start_count,
    }),
  });

  await db
    .update(orders)
    .set({ status: "PROCESSING" })
    .where(eq(orders.id, orderId));

  return c.json({ success: true });
});

const resubmitSchema = z.object({
  old_order_id: z.number(),
  new_service_id: z.number(),
  link: z.string().url(),
  qty: z.number().min(1),
});

ordersRoutes.post("/resubmit", zValidator("json", resubmitSchema), async (c) => {
  const payload = c.req.valid("json");
  const webhookUrl = process.env.N8N_RESUBMIT_WEBHOOK_URL;
  if (!webhookUrl) {
    return c.json({ error: "N8N_RESUBMIT_WEBHOOK_URL not set" }, 500);
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await db
    .update(orders)
    .set({ status: "PROCESSING" })
    .where(eq(orders.id, payload.old_order_id));

  return c.json({ success: true });
});
