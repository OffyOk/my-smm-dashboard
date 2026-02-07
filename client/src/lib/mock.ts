import type {
  Order,
  OrdersResponse,
  QualityService,
  SummaryStats,
  Service,
  Provider,
  OrderStatus,
  OverviewStats,
  User,
  UsersResponse,
} from "./types";

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
    user_id: 300 + (index % 10),
    user_name: ["somchai", "suda", "narin", "may", "beam"][index % 5],
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
    remark: "Original order",
  };
});

const mockSummary: SummaryStats = {
  totalToday: 1326,
  pendingQueue: 248,
  refillRequests: 19,
};

const mockOverview: OverviewStats = {
  today: {
    revenue: 12500,
    expense: 7200,
    net: 5300,
    newUsers: 12,
    refillCount: 4,
    topRefillServices: [
      { service_id: 101, service_name: "Instagram Followers - HQ", count: 3 },
      { service_id: 208, service_name: "TikTok Views - Turbo", count: 1 },
    ],
  },
  week: {
    revenue: 85400,
    expense: 49300,
    net: 36100,
    newUsers: 61,
    refillCount: 22,
    topRefillServices: [
      { service_id: 101, service_name: "Instagram Followers - HQ", count: 11 },
      { service_id: 322, service_name: "YouTube Likes - Drip", count: 7 },
      { service_id: 208, service_name: "TikTok Views - Turbo", count: 4 },
    ],
  },
  month: {
    revenue: 321000,
    expense: 182500,
    net: 138500,
    newUsers: 240,
    refillCount: 88,
    topRefillServices: [
      { service_id: 101, service_name: "Instagram Followers - HQ", count: 40 },
      { service_id: 208, service_name: "TikTok Views - Turbo", count: 28 },
      { service_id: 322, service_name: "YouTube Likes - Drip", count: 20 },
    ],
  },
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
  {
    id: 101,
    name: "Instagram Followers - HQ",
    price: 4.5,
    is_active: true,
    provider_code: "SMM-KING",
    provider_service_id: 9901,
    backup_service_id: 208,
    refill_service_id: 999,
    min_qty: 100,
    max_qty: 10000,
    cost_price: 2.1,
    price_tiers: [{ min: 1000, price: 4.2 }],
  },
  {
    id: 208,
    name: "TikTok Views - Turbo",
    price: 2.2,
    is_active: true,
    provider_code: "BOOSTHUB",
    provider_service_id: 8812,
    backup_service_id: 322,
    refill_service_id: 888,
    min_qty: 500,
    max_qty: 200000,
    cost_price: 0.9,
    price_tiers: [{ min: 5000, price: 2.0 }],
  },
  {
    id: 322,
    name: "YouTube Likes - Drip",
    price: 1.1,
    is_active: false,
    provider_code: "VIRALPRO",
    provider_service_id: 7711,
    backup_service_id: null,
    refill_service_id: null,
    min_qty: 50,
    max_qty: 50000,
    cost_price: 0.4,
    price_tiers: [],
  },
];

const mockProviders: Provider[] = [
  { code: "SMM-KING", name: "SMM King", api_url: "https://api.smmking.example", api_key: "••••••" },
  { code: "BOOSTHUB", name: "Boost Hub", api_url: "https://api.boosthub.example", api_key: "••••••" },
  { code: "VIRALPRO", name: "Viral Pro", api_url: "https://api.viralpro.example", api_key: "••••••" },
];

export function getMockSummary(): SummaryStats {
  return mockSummary;
}

export function getMockOverview(): OverviewStats {
  return mockOverview;
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

export function getMockUsers() {
  return [
    {
      id: 1,
      platform_user_id: "line_001",
      username: "somchai",
      balance: 120.5,
      total_spent: 980.75,
    },
    {
      id: 2,
      platform_user_id: "fb_002",
      username: "suda",
      balance: 40.0,
      total_spent: 250.0,
    },
    {
      id: 3,
      platform_user_id: "ig_003",
      username: "narin",
      balance: 12.25,
      total_spent: 110.0,
    },
    {
      id: 4,
      platform_user_id: "tt_004",
      username: "may",
      balance: 300.0,
      total_spent: 1480.5,
    },
    {
      id: 5,
      platform_user_id: "fb_005",
      username: "beam",
      balance: 0,
      total_spent: 55.25,
    },
  ];
}

type UsersQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  all?: boolean;
};

export function getMockUsersResponse(query: UsersQuery): UsersResponse {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const search = query.search?.toLowerCase() ?? "";
  const all = query.all ?? false;

  const data = getMockUsers() as User[];
  const filtered = data.filter((user) => {
    if (!search) return true;
    return (
      user.id.toString().includes(search) ||
      user.platform_user_id.toLowerCase().includes(search) ||
      (user.username ?? "").toLowerCase().includes(search)
    );
  });

  const total = filtered.length;
  if (all) {
    return { data: filtered, page: 1, pageSize: total, total };
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    data: filtered.slice(start, end),
    page,
    pageSize,
    total,
  };
}
