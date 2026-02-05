import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";

export const usersRoutes = new Hono();

usersRoutes.get("/", async (c) => {
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
    .orderBy(users.createdAt);

  return c.json(
    data.map((row) => ({
      ...row,
      balance: Number(row.balance ?? 0),
      total_spent: Number(row.total_spent ?? 0),
    }))
  );
});
