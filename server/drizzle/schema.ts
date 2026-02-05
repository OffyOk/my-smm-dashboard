import { pgTable, varchar, text, timestamp, index, unique, serial, numeric, foreignKey, integer, jsonb, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const providers = pgTable("providers", {
	code: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }),
	apiUrl: text("api_url").notNull(),
	apiKey: text("api_key").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	platformUserId: varchar("platform_user_id", { length: 100 }).notNull(),
	username: varchar({ length: 100 }),
	balance: numeric({ precision: 15, scale:  2 }).default('0.00'),
	totalSpent: numeric("total_spent", { precision: 15, scale:  2 }).default('0.00'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_users_platform_id").using("btree", table.platformUserId.asc().nullsLast().op("text_ops")),
	unique("users_platform_user_id_key").on(table.platformUserId),
]);

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	type: varchar({ length: 20 }).notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	orderId: integer("order_id"),
	slipUrl: text("slip_url"),
	remark: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transactions_user_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "transactions_order_id_fkey"
		}),
]);

export const services = pgTable("services", {
	id: integer().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	providerCode: varchar("provider_code", { length: 50 }),
	providerServiceId: integer("provider_service_id").notNull(),
	costPrice: numeric("cost_price", { precision: 10, scale:  4 }).default('0'),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	priceTiers: jsonb("price_tiers").default([]),
	minQty: integer("min_qty").default(100),
	maxQty: integer("max_qty").default(10000),
	isActive: boolean("is_active").default(true),
	backupServiceId: integer("backup_service_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	refillServiceId: integer("refill_service_id"),
}, (table) => [
	foreignKey({
			columns: [table.providerCode],
			foreignColumns: [providers.code],
			name: "services_provider_code_fkey"
		}),
	foreignKey({
			columns: [table.backupServiceId],
			foreignColumns: [table.id],
			name: "services_backup_service_id_fkey"
		}),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	serviceId: integer("service_id"),
	link: text().notNull(),
	quantity: integer().notNull(),
	status: varchar({ length: 50 }).default('PENDING'),
	providerOrderId: integer("provider_order_id"),
	startCount: integer("start_count").default(0),
	costAmount: numeric("cost_amount", { precision: 10, scale:  2 }).default('0'),
	saleAmount: numeric("sale_amount", { precision: 10, scale:  2 }).default('0'),
	dependencyOrderId: integer("dependency_order_id"),
	isInternalExpense: boolean("is_internal_expense").default(false),
	parentOrderId: integer("parent_order_id"),
	remark: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	remains: integer(),
}, (table) => [
	index("idx_orders_dependency").using("btree", table.dependencyOrderId.asc().nullsLast().op("int4_ops")),
	index("idx_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_orders_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_fkey"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "orders_service_id_fkey"
		}),
	foreignKey({
			columns: [table.dependencyOrderId],
			foreignColumns: [table.id],
			name: "orders_dependency_order_id_fkey"
		}),
	foreignKey({
			columns: [table.parentOrderId],
			foreignColumns: [table.id],
			name: "orders_parent_order_id_fkey"
		}),
]);

export const chatBuffer = pgTable("chat_buffer", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	messageText: text("message_text").notNull(),
	status: varchar({ length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});
