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
const sessionTokens = new Set<string>();

app.use("/api/*", cors({ origin: "*" }));

app.post("/api/auth/login", async (c) => {
  if (!adminUser || !adminPass) {
    return c.json({ error: "Admin credentials not configured." }, 500);
  }
  const { username, password } = (await c.req.json()) as {
    username?: string;
    password?: string;
  };
  if (username !== adminUser || password !== adminPass) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = crypto.randomUUID();
  sessionTokens.add(token);
  return c.json({ token });
});

app.post("/api/auth/logout", async (c) => {
  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Bearer ")) {
    sessionTokens.delete(auth.replace("Bearer ", ""));
  }
  return c.json({ success: true });
});

app.use("/api/*", async (c, next) => {
  if (c.req.path.startsWith("/api/auth/")) {
    await next();
    return;
  }
  const auth = c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return c.text("Unauthorized", 401);
  }
  const token = auth.replace("Bearer ", "");
  if (!sessionTokens.has(token)) {
    return c.text("Unauthorized", 401);
  }
  await next();
});

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
