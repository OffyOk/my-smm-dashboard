import {
  getMockOrders,
  getMockProviders,
  getMockQuality,
  getMockServices,
  getMockSummary,
  getMockOverview,
  getMockUsers,
} from "./mock";
import { clearAuthToken, getAuthToken } from "./auth";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const mockMode = import.meta.env.VITE_MOCK_MODE === "true";

type FetchOptions = RequestInit & {
  query?: Record<string, string | number | undefined>;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}) {
  if (mockMode) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (path.startsWith("/api/stats/summary")) {
      return getMockSummary() as T;
    }
    if (path.startsWith("/api/stats/overview")) {
      return getMockOverview() as T;
    }
    if (path.startsWith("/api/stats/quality")) {
      return getMockQuality() as T;
    }
    if (path.startsWith("/api/auth/login")) {
      return { token: "mock-token" } as T;
    }
    if (path.startsWith("/api/orders/bulk")) {
      const count = Array.isArray(options.body)
        ? options.body.length
        : (() => {
            try {
              const parsed = JSON.parse(String(options.body ?? "{}"));
              return Array.isArray(parsed.orders) ? parsed.orders.length : 1;
            } catch {
              return 1;
            }
          })();
      return {
        message: "OK",
        created_ids: Array.from({ length: count }).map((_, i) => 2000 + i),
      } as T;
    }
    if (path.startsWith("/api/orders/refill-bulk")) {
      return { message: "OK" } as T;
    }
    if (path.includes("/api/orders/") && path.endsWith("/refill")) {
      return { message: "OK" } as T;
    }
    if (path.startsWith("/api/orders")) {
      return getMockOrders({
        page: Number(options.query?.page ?? 1),
        pageSize: Number(options.query?.pageSize ?? 15),
        search: options.query?.search?.toString(),
        status: options.query?.status as never,
      }) as T;
    }
    if (path.startsWith("/api/services")) {
      return getMockServices() as T;
    }
    if (path.startsWith("/api/providers/balances")) {
      return [
        { code: "SMM-KING", balance: 12.5, balance_status: "ok" },
        { code: "BOOSTHUB", balance: 1.4, balance_status: "ok" },
        { code: "VIRALPRO", balance: 4.2, balance_status: "ok" },
      ] as T;
    }
    if (path.startsWith("/api/providers")) {
      return getMockProviders() as T;
    }
    if (path.startsWith("/api/users")) {
      return getMockUsers() as T;
    }
    return { success: true } as T;
  }

  const url = new URL(path, baseUrl);
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
    }
    const message = await res.text();
    throw new Error(message || "Request failed");
  }

  return (await res.json()) as T;
}