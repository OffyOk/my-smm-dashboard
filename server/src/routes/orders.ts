import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, providers, services } from "../db/schema";

export const ordersRoutes = new Hono();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(15),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  remark: z.string().optional(),
});

ordersRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { page, pageSize, search, status, startDate, endDate, remark } =
    c.req.valid("query");

  const filters = [];
  if (status) {
    filters.push(eq(orders.status, status));
  }
  if (remark) {
    filters.push(ilike(orders.remark, `%${remark}%`));
  }
  if (startDate) {
    filters.push(gte(orders.createdAt, `${startDate}T00:00:00`));
  }
  if (endDate) {
    filters.push(lte(orders.createdAt, `${endDate}T23:59:59.999`));
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
      remark: orders.remark,
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

const refillSchema = z
  .object({
    current_count: z.number().optional(),
  })
  .optional();

ordersRoutes.post("/:id/refill", zValidator("json", refillSchema), async (c) => {
  const orderId = Number(c.req.param("id"));
  const payload = c.req.valid("json") ?? {};
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

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: order.id,
      current_count: payload.current_count ?? order.start_count,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return c.json({ success: false, message: message || "Refill webhook failed" }, 500);
  }

  let resultMessage = "Refill sent";
  try {
    const body = await response.json();
    resultMessage = body?.message ?? resultMessage;
  } catch {
    const text = await response.text();
    if (text) resultMessage = text;
  }

  return c.json({ success: true, message: resultMessage });
});

const resubmitSchema = z.object({
  old_order_id: z.number(),
  new_service_id: z.number(),
  link: z.string().url(),
  qty: z.number().min(1),
});

ordersRoutes.post("/resubmit", zValidator("json", resubmitSchema), async (c) => {
  const payload = c.req.valid("json");
  const webhookUrl = process.env.N8N_BULK_WEBHOOK_URL;
  if (!webhookUrl) {
    return c.json({ error: "N8N_BULK_WEBHOOK_URL not set" }, 500);
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orders: [
        {
          service_id: payload.new_service_id,
          link: payload.link,
          quantity: payload.qty,
          remark: `Resubmit from order #${payload.old_order_id}`,
        },
      ],
    }),
  });

  await db
    .update(orders)
    .set({ status: "PROCESSING" })
    .where(eq(orders.id, payload.old_order_id));

  return c.json({ success: true });
});

const patchSchema = z.object({
  status: z.string().optional(),
  remark: z.string().nullable().optional(),
});

ordersRoutes.patch("/:id", zValidator("json", patchSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const payload = c.req.valid("json");

  await db
    .update(orders)
    .set({
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.remark !== undefined ? { remark: payload.remark } : {}),
    })
    .where(eq(orders.id, id));

  return c.json({ success: true });
});

const bulkSchema = z.object({
  orders: z.array(
    z.object({
      service_id: z.number(),
      link: z.string(),
      quantity: z.number(),
      start_count: z.number().optional(),
      custom_price: z.number().nullable().optional(),
      wait_for_prev: z.boolean().optional(),
      remark: z.string().optional(),
    })
  ),
});

ordersRoutes.post("/bulk", zValidator("json", bulkSchema), async (c) => {
  const payload = c.req.valid("json");
  const webhookUrl = process.env.N8N_BULK_WEBHOOK_URL;
  if (!webhookUrl) {
    return c.json({ error: "N8N_BULK_WEBHOOK_URL not set" }, 500);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    return c.json({ error: message || "n8n bulk webhook failed" }, 500);
  }

  const result = await response.json();
  return c.json(result);
});

const refillBulkSchema = z.object({
  refills: z.array(
    z.object({
      order_id: z.number(),
      current_count: z.number(),
    })
  ),
});

ordersRoutes.post("/refill-bulk", zValidator("json", refillBulkSchema), async (c) => {
  const payload = c.req.valid("json");
  const webhookUrl = process.env.N8N_REFILL_WEBHOOK_URL;
  if (!webhookUrl) {
    return c.json({ error: "N8N_REFILL_WEBHOOK_URL not set" }, 500);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    return c.json({ error: message || "n8n refill webhook failed" }, 500);
  }

  const result = await response.json();
  return c.json(result);
});
