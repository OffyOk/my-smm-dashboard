import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import type { OverviewStats, QualityService } from "../lib/types";

type BalanceItem = {
  code: string;
  balance: number | null;
  balance_status: "ok" | "error";
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function Dashboard() {
  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () => apiFetch<OverviewStats>("/api/stats/overview"),
  });

  const qualityQuery = useQuery({
    queryKey: ["quality"],
    queryFn: () => apiFetch<QualityService[]>("/api/stats/quality"),
  });

  const balancesQuery = useQuery({
    queryKey: ["providers", "balances"],
    queryFn: () => apiFetch<BalanceItem[]>("/api/providers/balances"),
  });

  const overview = overviewQuery.data ?? {
    today: {
      revenue: 0,
      expense: 0,
      net: 0,
      newUsers: 0,
      refillCount: 0,
      topRefillServices: [],
    },
    week: {
      revenue: 0,
      expense: 0,
      net: 0,
      newUsers: 0,
      refillCount: 0,
      topRefillServices: [],
    },
    month: {
      revenue: 0,
      expense: 0,
      net: 0,
      newUsers: 0,
      refillCount: 0,
      topRefillServices: [],
    },
  };

  const lowBalances =
    balancesQuery.data?.filter(
      (item) => item.balance_status === "ok" && item.balance !== null && item.balance < 2
    ) ?? [];

  const periods = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        {periods.map((period) => {
          const data = overview[period.key];
          return (
            <Card key={period.key}>
              <CardHeader>
                <CardTitle>{period.label}</CardTitle>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Asia/Bangkok
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatRow
                  label="Revenue"
                  value={currencyFormatter.format(data.revenue)}
                />
                <StatRow
                  label="Expense"
                  value={currencyFormatter.format(data.expense)}
                />
                <StatRow
                  label="Net Profit"
                  value={currencyFormatter.format(data.net)}
                  tone={data.net >= 0 ? "success" : "danger"}
                />
                <StatRow
                  label="New Users"
                  value={data.newUsers.toLocaleString()}
                />
                <StatRow
                  label="Refill Count"
                  value={data.refillCount.toLocaleString()}
                />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {periods.map((period) => {
          const data = overview[period.key];
          return (
            <Card key={`${period.key}-refill`}>
              <CardHeader>
                <CardTitle>Top Refill Services</CardTitle>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {period.label}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topRefillServices.length ? (
                  data.topRefillServices.map((service) => (
                    <div
                      key={service.service_id}
                      className="flex items-center justify-between rounded-md border border-slate-800/60 px-3 py-2 text-sm light:border-slate-200"
                    >
                      <span className="font-medium">{service.service_name}</span>
                      <span className="font-mono">{service.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No refill activity.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Low Provider Balance</CardTitle>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Below $2
            </p>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold">
              {lowBalances.length}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {lowBalances.length
                ? lowBalances.map((item) => item.code).join(", ")
                : "All providers healthy"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Problematic Services</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            Services with elevated refill rates in the last 7 days.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Refill Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(qualityQuery.data ?? []).map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-mono">{service.id}</TableCell>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.providerCode ?? "-"}</TableCell>
                <TableCell className="font-mono">{service.totalOrders}</TableCell>
                <TableCell className="font-mono text-amber-300">
                  {(service.refillRate * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
            {!qualityQuery.data?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400">
                  No problematic services detected.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-300"
      : tone === "danger"
        ? "text-rose-300"
        : "text-slate-200";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400 light:text-slate-600">{label}</span>
      <span className={`font-mono ${toneClass} light:text-slate-800`}>{value}</span>
    </div>
  );
}