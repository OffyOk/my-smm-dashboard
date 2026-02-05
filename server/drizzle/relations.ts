import { relations } from "drizzle-orm/relations";
import { users, transactions, orders, providers, services } from "./schema";

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	order: one(orders, {
		fields: [transactions.orderId],
		references: [orders.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	transactions: many(transactions),
	orders: many(orders),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	transactions: many(transactions),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	service: one(services, {
		fields: [orders.serviceId],
		references: [services.id]
	}),
	order_dependencyOrderId: one(orders, {
		fields: [orders.dependencyOrderId],
		references: [orders.id],
		relationName: "orders_dependencyOrderId_orders_id"
	}),
	orders_dependencyOrderId: many(orders, {
		relationName: "orders_dependencyOrderId_orders_id"
	}),
	order_parentOrderId: one(orders, {
		fields: [orders.parentOrderId],
		references: [orders.id],
		relationName: "orders_parentOrderId_orders_id"
	}),
	orders_parentOrderId: many(orders, {
		relationName: "orders_parentOrderId_orders_id"
	}),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	provider: one(providers, {
		fields: [services.providerCode],
		references: [providers.code]
	}),
	service: one(services, {
		fields: [services.backupServiceId],
		references: [services.id],
		relationName: "services_backupServiceId_services_id"
	}),
	services: many(services, {
		relationName: "services_backupServiceId_services_id"
	}),
	orders: many(orders),
}));

export const providersRelations = relations(providers, ({many}) => ({
	services: many(services),
}));