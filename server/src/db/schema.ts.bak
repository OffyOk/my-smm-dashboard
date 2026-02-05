import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const providers = pgTable("providers", {
  code: varchar("code", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }),
  api_url: text("api_url").notNull(),
  api_key: text("api_key").notNull(),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

export const services = pgTable("services", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  provider_code: varchar("provider_code", { length: 50 }).references(() => providers.code),
  provider_service_id: integer("provider_service_id").notNull(),
  cost_price: numeric("cost_price", { precision: 10, scale: 4 }).default("0"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  price_tiers: jsonb("price_tiers").default([]),
  min_qty: integer("min_qty").default(100),
  max_qty: integer("max_qty").default(10000),
  is_active: boolean("is_active").default(true),
  backup_service_id: integer("backup_service_id").references(() => services.id),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  platform_user_id: varchar("platform_user_id", { length: 100 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0.00"),
  total_spent: numeric("total_spent", { precision: 15, scale: 2 }).default("0.00"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => users.id),
    service_id: integer("service_id").references(() => services.id),
    link: text("link").notNull(),
    quantity: integer("quantity").notNull(),
    status: varchar("status", { length: 50 }).default("PENDING"),
    provider_order_id: integer("provider_order_id"),
    start_count: integer("start_count").default(0),
    cost_amount: numeric("cost_amount", { precision: 10, scale: 2 }).default("0.00"),
    sale_amount: numeric("sale_amount", { precision: 10, scale: 2 }).default("0.00"),
    dependency_order_id: integer("dependency_order_id").references(() => orders.id),
    is_internal_expense: boolean("is_internal_expense").default(false),
    parent_order_id: integer("parent_order_id").references(() => orders.id),
    remark: text("remark"),
    created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: false })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    statusIdx: index("idx_orders_status").on(table.status),
    userIdx: index("idx_orders_user_id").on(table.user_id),
    dependencyIdx: index("idx_orders_dependency").on(table.dependency_order_id),
  })
);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  order_id: integer("order_id").references(() => orders.id),
  slip_url: text("slip_url"),
  remark: text("remark"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

export const usersPlatformIdx = index("idx_users_platform_id").on(users.platform_user_id);
