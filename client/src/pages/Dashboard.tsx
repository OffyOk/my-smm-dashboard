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
import type { QualityService, SummaryStats } from "../lib/types";

export function Dashboard() {
  const summaryQuery = useQuery({
    queryKey: ["summary"],
    queryFn: () => apiFetch<SummaryStats>("/api/stats/summary"),
  });

  const qualityQuery = useQuery({
    queryKey: ["quality"],
    queryFn: () => apiFetch<QualityService[]>("/api/stats/quality"),
  });

  const summary = summaryQuery.data ?? {
    totalToday: 0,
    pendingQueue: 0,
    refillRequests: 0,
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders Today</CardTitle>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Live feed
            </p>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold">
              {summary.totalToday.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Queue</CardTitle>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Worker backlog
            </p>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold">
              {summary.pendingQueue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Refill Requests</CardTitle>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Last 24 hours
            </p>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold">
              {summary.refillRequests.toLocaleString()}
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
                <TableCell className="font-mono">
                  {service.totalOrders}
                </TableCell>
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
