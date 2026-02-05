import type { Order, OrdersResponse, QualityService, SummaryStats, Service, Provider, OrderStatus } from "./types";

type OrdersQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrderStatus;
};

const mockOrders: Order[] = Array.from({ length: 64 }).map((_, index) => {
  const statusPool: OrderStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "CANCELED"];
  const status = statusPool[index % statusPool.length];
  return {
    id: 4200 + index,
    created_at: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    service_name: [
      "Instagram Followers - HQ",
      "TikTok Views - Turbo",
      "YouTube Likes - Drip",
      "Facebook Page Likes",
    ][index % 4],
    link: `https://social.example.com/post/${4200 + index}`,
    quantity: 500 + (index % 6) * 250,
    status,
    provider_order_id: 88000 + index,
    provider_code: ["SMM-KING", "BOOSTHUB", "VIRALPRO"][index % 3],
    start_count: 1200 + index * 3,
  };
});

const mockSummary: SummaryStats = {
  totalToday: 1326,
  pendingQueue: 248,
  refillRequests: 19,
};

const mockQuality: QualityService[] = [
  {
    id: 101,
    name: "Instagram Followers - HQ",
    providerCode: "SMM-KING",
    refillRate: 0.12,
    totalOrders: 482,
  },
  {
    id: 208,
    name: "TikTok Views - Turbo",
    providerCode: "BOOSTHUB",
    refillRate: 0.09,
    totalOrders: 391,
  },
  {
    id: 322,
    name: "YouTube Likes - Drip",
    providerCode: "VIRALPRO",
    refillRate: 0.08,
    totalOrders: 215,
  },
];

const mockServices: Service[] = [
  { id: 101, name: "Instagram Followers - HQ", price: 4.5, is_active: true, provider_code: "SMM-KING" },
  { id: 208, name: "TikTok Views - Turbo", price: 2.2, is_active: true, provider_code: "BOOSTHUB" },
  { id: 322, name: "YouTube Likes - Drip", price: 1.1, is_active: false, provider_code: "VIRALPRO" },
];

const mockProviders: Provider[] = [
  { code: "SMM-KING", name: "SMM King", api_url: "https://api.smmking.example", api_key: "••••••" },
  { code: "BOOSTHUB", name: "Boost Hub", api_url: "https://api.boosthub.example", api_key: "••••••" },
  { code: "VIRALPRO", name: "Viral Pro", api_url: "https://api.viralpro.example", api_key: "••••••" },
];

export function getMockSummary(): SummaryStats {
  return mockSummary;
}

export function getMockQuality(): QualityService[] {
  return mockQuality;
}

export function getMockOrders(query: OrdersQuery): OrdersResponse {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 15;
  const search = query.search?.toLowerCase() ?? "";
  const status = query.status;

  const filtered = mockOrders.filter((order) => {
    const matchesSearch =
      !search ||
      order.id.toString().includes(search) ||
      order.link.toLowerCase().includes(search);
    const matchesStatus = !status || order.status === status;
    return matchesSearch && matchesStatus;
  });

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: filtered.slice(start, end),
    page,
    pageSize,
    total: filtered.length,
  };
}

export function getMockServices(): Service[] {
  return mockServices;
}

export function getMockProviders(): Provider[] {
  return mockProviders;
}
