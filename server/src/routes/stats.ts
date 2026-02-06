import { Hono } from "hono";
import { and, eq, gt, ilike, inArray, lte, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, services, users } from "../db/schema";

export const statsRoutes = new Hono();

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function toBangkok(date: Date) {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS);
}

function fromBangkok(date: Date) {
  return new Date(date.getTime() - BANGKOK_OFFSET_MS);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getBangkokRanges() {
  const nowUtc = new Date();
  const nowBangkok = toBangkok(nowUtc);

  const todayStart = startOfDay(nowBangkok);

  const weekStart = startOfDay(nowBangkok);
  const day = weekStart.getDay();
  const diff = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diff);

  const monthStart = startOfDay(
    new Date(nowBangkok.getFullYear(), nowBangkok.getMonth(), 1)
  );

  return {
    nowUtc: nowUtc.toISOString(),
    todayStart: fromBangkok(todayStart).toISOString(),
    weekStart: fromBangkok(weekStart).toISOString(),
    monthStart: fromBangkok(monthStart).toISOString(),
  };
}

function extractOrderId(remark?: string | null) {
  if (!remark) return null;
  const match = remark.match(/#?(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

statsRoutes.get("/summary", async (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalToday] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);
  // .where(gt(orders.createdAt, today));

  const [pendingQueue] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "PENDING"));

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [refillRequests] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);
  // .where(and(isNotNull(orders.parentOrderId), gt(orders.createdAt, yesterday)));

  return c.json({
    totalToday: Number(totalToday?.count ?? 0),
    pendingQueue: Number(pendingQueue?.count ?? 0),
    refillRequests: Number(refillRequests?.count ?? 0),
  });
});

statsRoutes.get("/overview", async (c) => {
  const ranges = getBangkokRanges();
  const periods = [
    { key: "today", start: ranges.todayStart },
    { key: "week", start: ranges.weekStart },
    { key: "month", start: ranges.monthStart },
  ] as const;

  const result: Record<
    (typeof periods)[number]["key"],
    {
      revenue: number;
      expense: number;
      net: number;
      newUsers: number;
      refillCount: number;
      topRefillServices: { service_id: number; service_name: string; count: number }[];
    }
  > = {
    today: {
      revenue: 0,
      expense: 0,
      net: 0,
      newUsers: 0,
      refillCount: 0,
      topRefillServices: [],
    },
    week: {
      revenue: 0,
      expense: 0,
      net: 0,
      newUsers: 0,
      refillCount: 0,
      topRefillServices: [],
    },
    month: {
      revenue: 0,
      expense: 0,
      net: 0,
      newUsers: 0,
      refillCount: 0,
      topRefillServices: [],
    },
  };

  for (const period of periods) {
    const rangeFilter = and(
      gte(orders.createdAt, period.start),
      lte(orders.createdAt, ranges.nowUtc)
    );

    const [orderSums] = await db
      .select({
        revenue: sql<string>`coalesce(sum(${orders.saleAmount}), 0)`,
        expense: sql<string>`coalesce(sum(${orders.costAmount}), 0)`,
      })
      .from(orders)
      .where(rangeFilter);

    const revenue = Number(orderSums?.revenue ?? 0);
    const expense = Number(orderSums?.expense ?? 0);

    const [newUsersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          gte(users.createdAt, period.start),
          lte(users.createdAt, ranges.nowUtc)
        )
      );

    const [refillRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(rangeFilter, ilike(orders.remark, "%refill%")));

    const refillOrders = await db
      .select({
        id: orders.id,
        remark: orders.remark,
      })
      .from(orders)
      .where(and(rangeFilter, ilike(orders.remark, "%refill%")));

    const refIds = Array.from(
      new Set(
        refillOrders
          .map((row) => extractOrderId(row.remark))
          .filter((id): id is number => id !== null)
      )
    );

    let topRefillServices: { service_id: number; service_name: string; count: number }[] = [];

    if (refIds.length) {
      const originalOrders = await db
        .select({ id: orders.id, serviceId: orders.serviceId })
        .from(orders)
        .where(inArray(orders.id, refIds));

      const countByService = new Map<number, number>();
      originalOrders.forEach((row) => {
        if (!row.serviceId) return;
        countByService.set(
          row.serviceId,
          (countByService.get(row.serviceId) ?? 0) + 1
        );
      });

      const serviceIds = Array.from(countByService.keys());
      if (serviceIds.length) {
        const serviceRows = await db
          .select({ id: services.id, name: services.name })
          .from(services)
          .where(inArray(services.id, serviceIds));

        topRefillServices = serviceRows
          .map((row) => ({
            service_id: row.id,
            service_name: row.name,
            count: countByService.get(row.id) ?? 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }
    }

    result[period.key] = {
      revenue,
      expense,
      net: revenue - expense,
      newUsers: Number(newUsersRow?.count ?? 0),
      refillCount: Number(refillRow?.count ?? 0),
      topRefillServices,
    };
  }

  return c.json(result);
});

statsRoutes.get("/quality", async (c) => {
  const data = await db
    .select({
      id: services.id,
      name: services.name,
      totalOrders: sql<number>`count(*)`,
      refillCount: sql<number>`sum(case when ${orders.parentOrderId} is null then 0 else 1 end)`,
      providerCode: services.providerCode,
    })
    .from(orders)
    .leftJoin(services, eq(orders.serviceId, services.id))
    .groupBy(services.id, services.name, services.providerCode)
    .having(gt(sql<number>`count(*)`, 5))
    // .orderBy(sql`sum(case when ${orders.parent_order_id} is null then 0 else 1 end) desc`)
    .limit(6);

  const mapped = data
    .map((row) => ({
      id: row.id ?? 0,
      name: row.name ?? "Unknown",
      totalOrders: Number(row.totalOrders ?? 0),
      refillRate:
        row.totalOrders
          ? Number(row.refillCount ?? 0) / Number(row.totalOrders ?? 1)
          : 0,
      providerCode: row.providerCode ?? null,
    }))
    .filter((row) => row.refillRate > 0.05);

  return c.json(mapped);
});