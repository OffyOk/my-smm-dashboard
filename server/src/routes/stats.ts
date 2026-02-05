import { Hono } from "hono";
import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, services } from "../db/schema";

export const statsRoutes = new Hono();

statsRoutes.get("/summary", async (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalToday] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(gt(orders.created_at, today));

  const [pendingQueue] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "PENDING"));

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [refillRequests] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(isNotNull(orders.parent_order_id), gt(orders.created_at, yesterday)));

  return c.json({
    totalToday: Number(totalToday?.count ?? 0),
    pendingQueue: Number(pendingQueue?.count ?? 0),
    refillRequests: Number(refillRequests?.count ?? 0),
  });
});

statsRoutes.get("/quality", async (c) => {
  const data = await db
    .select({
      id: services.id,
      name: services.name,
      totalOrders: sql<number>`count(*)`,
      refillCount: sql<number>`sum(case when ${orders.parent_order_id} is null then 0 else 1 end)`,
      providerCode: services.provider_code,
    })
    .from(orders)
    .leftJoin(services, eq(orders.service_id, services.id))
    .groupBy(services.id, services.name, services.provider_code)
    .having(gt(sql<number>`count(*)`, 5))
    .orderBy(sql`sum(case when ${orders.parent_order_id} is null then 0 else 1 end) desc`)
    .limit(6);

  const mapped = data
    .map((row) => ({
      id: row.id ?? 0,
      name: row.name ?? "Unknown",
      totalOrders: Number(row.totalOrders ?? 0),
      refillRate:
        row.totalOrders ? Number(row.refillCount ?? 0) / Number(row.totalOrders ?? 1) : 0,
      providerCode: row.providerCode ?? null,
    }))
    .filter((row) => row.refillRate > 0.05);

  return c.json(mapped);
});
