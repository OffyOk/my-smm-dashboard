import { Hono } from "hono";
import { cors } from "hono/cors";
import { ordersRoutes } from "./routes/orders";
import { statsRoutes } from "./routes/stats";
import { servicesRoutes } from "./routes/services";
import { providersRoutes } from "./routes/providers";

const app = new Hono();

app.use("/api/*", cors({ origin: "*" }));

app.get("/", (c) => c.json({ ok: true }));

app.route("/api/orders", ordersRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/services", servicesRoutes);
app.route("/api/providers", providersRoutes);

export default app;

// Bun entrypoint
if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3001);
  console.log(`Server running on http://localhost:${port}`);
  Bun.serve({ fetch: app.fetch, port });
}
