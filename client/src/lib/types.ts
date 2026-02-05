export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELED" | "FAIL" | "QUEUED";

export type Order = {
  id: number;
  created_at: string;
  service_name: string;
  link: string;
  quantity: number;
  status: OrderStatus;
  provider_order_id: number | null;
  provider_code: string | null;
  start_count: number;
};

export type OrdersResponse = {
  data: Order[];
  page: number;
  pageSize: number;
  total: number;
};

export type SummaryStats = {
  totalToday: number;
  pendingQueue: number;
  refillRequests: number;
};

export type QualityService = {
  id: number;
  name: string;
  refillRate: number;
  totalOrders: number;
  providerCode: string | null;
};

export type Service = {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  provider_code: string | null;
};

export type Provider = {
  code: string;
  name: string | null;
  api_url: string;
  api_key: string;
};
