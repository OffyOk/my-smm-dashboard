import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { transactions, users } from "../db/schema";

export const usersRoutes = new Hono();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(20),
  search: z.string().optional(),
  all: z.coerce.boolean().optional(),
});

usersRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { page, pageSize, search, all } = c.req.valid("query");

  const filters = [];
  if (search) {
    const numeric = Number(search);
    if (!Number.isNaN(numeric)) {
      filters.push(
        or(
          eq(users.id, numeric),
          ilike(users.username, `%${search}%`),
          ilike(users.platformUserId, `%${search}%`)
        )!
      );
    } else {
      filters.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.platformUserId, `%${search}%`)
        )!
      );
    }
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(whereClause);

  const total = Number(count ?? 0);
  const limit = all ? total || 1 : pageSize;
  const offset = all ? 0 : (page - 1) * pageSize;

  const data = await db
    .select({
      id: users.id,
      platform_user_id: users.platformUserId,
      username: users.username,
      balance: users.balance,
      total_spent: users.totalSpent,
      created_at: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data: data.map((row) => ({
      ...row,
      balance: Number(row.balance ?? 0),
      total_spent: Number(row.total_spent ?? 0),
    })),
    page: all ? 1 : page,
    pageSize: all ? total : pageSize,
    total,
  });
});

const topupSchema = z.object({
  amount: z.coerce.number().positive(),
  remark: z.string().optional(),
  slip_url: z.string().optional(),
});

usersRoutes.post("/:id/topup", zValidator("json", topupSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const payload = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({
        id: users.id,
        balance: users.balance,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      return null;
    }

    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${payload.amount}` })
      .where(eq(users.id, id));

    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId: id,
        type: "TOPUP",
        amount: String(payload.amount),
        remark: payload.remark,
        slipUrl: payload.slip_url,
      })
      .returning({ id: transactions.id });

    const [updated] = await tx
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, id));

    return {
      transaction_id: transaction?.id ?? null,
      balance: Number(updated?.balance ?? 0),
    };
  });

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ success: true, ...result });
});
