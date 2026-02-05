import { Hono } from "hono";
import { cors } from "hono/cors";
import { ordersRoutes } from "./routes/orders";
import { statsRoutes } from "./routes/stats";
import { servicesRoutes } from "./routes/services";
import { providersRoutes } from "./routes/providers";
import { usersRoutes } from "./routes/users";

const app = new Hono();

const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;

app.use("/api/*", cors({ origin: "*" }));

if (adminUser && adminPass) {
  app.use("/api/*", async (c, next) => {
    const auth = c.req.header("Authorization");
    if (!auth || !auth.startsWith("Basic ")) {
      return c.text("Unauthorized", 401, {
        "WWW-Authenticate": "Basic realm=\"Admin\"",
      });
    }
    const decoded = Buffer.from(auth.replace("Basic ", ""), "base64").toString();
    const [user, pass] = decoded.split(":");
    if (user !== adminUser || pass !== adminPass) {
      return c.text("Unauthorized", 401, {
        "WWW-Authenticate": "Basic realm=\"Admin\"",
      });
    }
    await next();
  });
}

app.get("/", (c) => c.json({ ok: true }));

app.route("/api/orders", ordersRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/services", servicesRoutes);
app.route("/api/providers", providersRoutes);
app.route("/api/users", usersRoutes);

export default app;

// Bun entrypoint
if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3001);
  console.log(`Server running on http://localhost:${port}`);
  Bun.serve({ fetch: app.fetch, port });
}
