import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import type { Order, OrdersResponse, OrderStatus } from "../../lib/types";
import { apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const statusOptions: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELED",
];

function statusVariant(status: OrderStatus) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "PROCESSING":
      return "info";
    case "CANCELED":
      return "danger";
    case "PENDING":
    default:
      return "warning";
  }
}

type OrdersQuery = {
  page: number;
  pageSize: number;
  search: string;
  status?: OrderStatus;
};

export function OrdersTable() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [query, setQuery] = useState<OrdersQuery>({
    page: 1,
    pageSize: 15,
    search: "",
  });
  const [refillTarget, setRefillTarget] = useState<Order | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<Order | null>(null);
  const [newServiceId, setNewServiceId] = useState("");
  const [refillCurrentCount, setRefillCurrentCount] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const ordersQuery = useQuery({
    queryKey: ["orders", query],
    queryFn: () =>
      apiFetch<OrdersResponse>("/api/orders", {
        query: {
          page: query.page,
          pageSize: query.pageSize,
          search: query.search,
          status: query.status,
        },
      }),
  });

  const refillMutation = useMutation({
    mutationFn: async (payload: { orderId: number; current_count?: number }) =>
      apiFetch(`/api/orders/${payload.orderId}/refill`, {
        method: "POST",
        body: JSON.stringify({ current_count: payload.current_count }),
      }),
    onSuccess: (data) => {
      const message = (data as { message?: string })?.message ?? "Refill sent.";
      push({ title: "Refill success", description: message, variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      push({
        title: "Refill failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (payload: {
      old_order_id: number;
      new_service_id: number;
      link: string;
      qty: number;
    }) =>
      apiFetch("/api/orders/resubmit", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        cell: ({ row }) => (
          <span className="font-mono text-xs">#{row.original.id}</span>
        ),
      },
      {
        header: "Date",
        accessorKey: "created_at",
        cell: ({ row }) => (
          <span className="text-xs text-slate-400 light:text-slate-600">
            {new Date(row.original.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Service",
        accessorKey: "service_name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.service_name}</span>
        ),
      },
      {
        header: "Link",
        accessorKey: "link",
        cell: ({ row }) => (
          <a
            href={row.original.link}
            target="_blank"
            rel="noreferrer"
            className="max-w-[220px] truncate text-sky-400 hover:text-sky-300"
          >
            {row.original.link}
          </a>
        ),
      },
      {
        header: "Qty",
        accessorKey: "quantity",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.quantity}</span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: "Provider",
        accessorKey: "provider_code",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-400 light:text-slate-600">
            {row.original.provider_code ?? "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setRefillTarget(row.original)}>
              Refill
            </Button>
            <Button size="sm" variant="outline" onClick={() => setResubmitTarget(row.original)}>
              Resubmit
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: ordersQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((ordersQuery.data?.total ?? 0) / query.pageSize),
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-slate-800/60 bg-panel-950/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 light:border-slate-200 light:bg-white/90">
        <div className="flex min-w-[240px] flex-1 items-center gap-2">
          <Input
            placeholder="Search order ID or link"
            value={query.search}
            onChange={(event) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                search: event.target.value,
              }))
            }
          />
        </div>
        <Select
          value={query.status ?? "ALL"}
          onValueChange={(value) =>
            setQuery((prev) => ({
              ...prev,
              page: 1,
              status: value === "ALL" ? undefined : (value as OrderStatus),
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => ordersQuery.refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3 sm:hidden">
        {ordersQuery.data?.data.map((order) => {
          const isExpanded = expandedIds.has(order.id);
          return (
          <div
            key={order.id}
            className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 text-sm light:border-slate-200 light:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-slate-400">#{order.id}</p>
                <p className="text-base font-semibold">{order.service_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Qty</span>
                <span className="font-mono">{order.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Provider</span>
                <span className="font-mono text-xs">{order.provider_code ?? "-"}</span>
              </div>
              {isExpanded && (
                <div>
                  <p className="text-xs text-slate-500">Link</p>
                  <a
                    href={order.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sky-400"
                  >
                    {order.link}
                  </a>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(order.id)) {
                      next.delete(order.id);
                    } else {
                      next.add(order.id);
                    }
                    return next;
                  })
                }
              >
                {isExpanded ? "Hide Details" : "View Details"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(order.link)}
              >
                Copy Link
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRefillTarget(order)}>
                Refill
              </Button>
              <Button size="sm" variant="outline" onClick={() => setResubmitTarget(order)}>
                Resubmit
              </Button>
            </div>
          </div>
        )})}
        {!ordersQuery.data?.data.length && (
          <div className="rounded-lg border border-slate-800/60 p-4 text-center text-slate-400 light:border-slate-200">
            No orders found.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {!ordersQuery.data?.data.length && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-slate-400">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Page {query.page} of {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: Math.max(prev.page - 1, 1),
              }))
            }
            disabled={query.page === 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: Math.min(
                  prev.page + 1,
                  table.getPageCount() || prev.page + 1,
                ),
              }))
            }
            disabled={query.page >= (table.getPageCount() || 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={!!refillTarget}
        onOpenChange={() => {
          setRefillTarget(null);
          setRefillCurrentCount("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refill Order</DialogTitle>
            <DialogDescription>
              Confirm refill for order #{refillTarget?.id}. Start count:{" "}
              {refillTarget?.start_count}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Current Count"
              type="number"
              value={refillCurrentCount}
              onChange={(event) => setRefillCurrentCount(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefillTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (refillTarget) {
                  refillMutation.mutate({
                    orderId: refillTarget.id,
                    current_count: refillCurrentCount
                      ? Number(refillCurrentCount)
                      : undefined,
                  });
                  setRefillTarget(null);
                  setRefillCurrentCount("");
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resubmitTarget}
        onOpenChange={() => {
          setResubmitTarget(null);
          setNewServiceId("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resubmit Order</DialogTitle>
            <DialogDescription>
              Update service mapping and resubmit this order to a new provider
              service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-slate-800/60 bg-slate-900/40 p-3 text-sm light:border-slate-200 light:bg-slate-100">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Current
              </p>
              <p className="mt-2 text-slate-200 light:text-slate-700">
                {resubmitTarget?.link}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Qty: {resubmitTarget?.quantity}
              </p>
            </div>
            <div className="rounded-md border border-slate-800/60 bg-slate-900/40 p-3 text-sm light:border-slate-200 light:bg-slate-100">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Remark
              </p>
              <p className="mt-2 text-slate-200 light:text-slate-700">
                Resubmit from order #{resubmitTarget?.id}
              </p>
            </div>
            <Input
              placeholder="New Service ID"
              type="number"
              value={newServiceId}
              onChange={(event) => setNewServiceId(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resubmitTarget && newServiceId) {
                  resubmitMutation.mutate({
                    old_order_id: resubmitTarget.id,
                    new_service_id: Number(newServiceId),
                    link: resubmitTarget.link,
                    qty: resubmitTarget.quantity,
                  });
                  setNewServiceId("");
                  setResubmitTarget(null);
                }
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
