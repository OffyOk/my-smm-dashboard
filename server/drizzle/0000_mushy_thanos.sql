-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "providers" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"api_url" text NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_user_id" varchar(100) NOT NULL,
	"username" varchar(100),
	"balance" numeric(15, 2) DEFAULT '0.00',
	"total_spent" numeric(15, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_platform_user_id_key" UNIQUE("platform_user_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" varchar(20) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"order_id" integer,
	"slip_url" text,
	"remark" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider_code" varchar(50),
	"provider_service_id" integer NOT NULL,
	"cost_price" numeric(10, 4) DEFAULT '0',
	"price" numeric(10, 2) NOT NULL,
	"price_tiers" jsonb DEFAULT '[]'::jsonb,
	"min_qty" integer DEFAULT 100,
	"max_qty" integer DEFAULT 10000,
	"is_active" boolean DEFAULT true,
	"backup_service_id" integer,
	"created_at" timestamp DEFAULT now(),
	"refill_service_id" integer
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"service_id" integer,
	"link" text NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING',
	"provider_order_id" integer,
	"start_count" integer DEFAULT 0,
	"cost_amount" numeric(10, 2) DEFAULT '0',
	"sale_amount" numeric(10, 2) DEFAULT '0',
	"dependency_order_id" integer,
	"is_internal_expense" boolean DEFAULT false,
	"parent_order_id" integer,
	"remark" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remains" integer
);
--> statement-breakpoint
CREATE TABLE "chat_buffer" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"message_text" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "public"."providers"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_backup_service_id_fkey" FOREIGN KEY ("backup_service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_dependency_order_id_fkey" FOREIGN KEY ("dependency_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_parent_order_id_fkey" FOREIGN KEY ("parent_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_platform_id" ON "users" USING btree ("platform_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_dependency" ON "orders" USING btree ("dependency_order_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id" int4_ops);
*/