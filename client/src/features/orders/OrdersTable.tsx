import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, RefreshCw } from "lucide-react";
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

const bangkokFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function formatBangkok(value: string) {
  return bangkokFormatter.format(new Date(value));
}

function isRefillRemark(remark?: string | null) {
  return !!remark && /refill|refil/i.test(remark);
}

function isOlderThan30Days(createdAt: string) {
  const created = new Date(createdAt).getTime();
  return Date.now() - created > 30 * 24 * 60 * 60 * 1000;
}

function getActionDisableReason(order: Order) {
  if (isRefillRemark(order.remark)) {
    return "Disabled for refill orders.";
  }
  if (isOlderThan30Days(order.created_at)) {
    return "Disabled after 30 days.";
  }
  return "";
}

function isActionDisabled(order: Order) {
  return isRefillRemark(order.remark) || isOlderThan30Days(order.created_at);
}

type OrdersQuery = {
  page: number;
  pageSize: number;
  search: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  remark?: string;
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
  const [editTarget, setEditTarget] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("PENDING");
  const [editRemark, setEditRemark] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newStartCount, setNewStartCount] = useState("");
  const [refillCurrentCount, setRefillCurrentCount] = useState("");
  const [refillLink, setRefillLink] = useState("");
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
          startDate: query.startDate,
          endDate: query.endDate,
          remark: query.remark,
        },
      }),
  });

  const refillMutation = useMutation({
    mutationFn: async (payload: {
      orderId: number;
      current_count?: number;
      link?: string;
    }) =>
      apiFetch(`/api/orders/${payload.orderId}/refill`, {
        method: "POST",
        body: JSON.stringify({
          current_count: payload.current_count,
          link: payload.link,
        }),
      }),
    onSuccess: (data) => {
      const message = (data as { message?: string })?.message ?? "Refill sent.";
      push({
        title: "Refill success",
        description: message,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      push({
        title: "Refill failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (payload: {
      old_order_id: number;
      new_service_id: number;
      new_start_count: number;
      user_id: number;
      link: string;
      qty: number;
    }) =>
      apiFetch("/api/orders/resubmit", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      const message =
        (data as { message?: string })?.message ?? "Resubmit sent.";
      push({
        title: "Resubmit success",
        description: message,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      push({
        title: "Resubmit failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: {
      id: number;
      status?: OrderStatus;
      remark?: string;
    }) =>
      apiFetch(`/api/orders/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      push({ title: "Order updated", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      push({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    },
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
            {formatBangkok(row.original.created_at)}
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
        header: "User Name",
        accessorKey: "user_name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user_name}</span>
        ),
      },
      {
        header: "Link",
        accessorKey: "link",
        maxSize: 100,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <a
              href={row.original.link}
              target="_blank"
              rel="noreferrer"
              className="block max-w-[200px] truncate text-sky-400 hover:text-sky-300"
            >
              {row.original.link}
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(row.original.link);
                push({
                  title: "Copied",
                  description: "Link copied to clipboard",
                  variant: "success",
                });
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
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
        header: "Start Cnt",
        accessorKey: "start_count",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.start_count ?? "-"}</span>
        ),
      },
      {
        header: "Remark",
        accessorKey: "remark",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-400 light:text-slate-600">
            {row.original.remark ?? "-"}
          </span>
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
      // {
      //   header: "Provider",
      //   accessorKey: "provider_code",
      //   cell: ({ row }) => (
      //     <span className="font-mono text-xs text-slate-400 light:text-slate-600">
      //       {row.original.provider_code ?? "-"}
      //     </span>
      //   ),
      // },

      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const disabled = isActionDisabled(row.original);
          const reason = getActionDisableReason(row.original);
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditTarget(row.original);
                  setEditStatus(row.original.status);
                  setEditRemark(row.original.remark ?? "");
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                title={disabled ? reason : undefined}
                onClick={() => setRefillTarget(row.original)}
              >
                Refill
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                title={disabled ? reason : undefined}
                onClick={() => setResubmitTarget(row.original)}
              >
                Resubmit
              </Button>
            </div>
          );
        },
      },
    ],
    [push],
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
        <Select
          value={query.remark ?? "ALL"}
          onValueChange={(value) =>
            setQuery((prev) => ({
              ...prev,
              page: 1,
              remark: value === "ALL" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Remark" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All remarks</SelectItem>
            <SelectItem value="Original">Original</SelectItem>
            <SelectItem value="Refill">Refill</SelectItem>
            <SelectItem value="Resubmit">Resubmit</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const today = new Date();
              const iso = today.toISOString().slice(0, 10);
              setQuery((prev) => ({
                ...prev,
                page: 1,
                startDate: iso,
                endDate: iso,
              }));
            }}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 2);
              setQuery((prev) => ({
                ...prev,
                page: 1,
                startDate: start.toISOString().slice(0, 10),
                endDate: end.toISOString().slice(0, 10),
              }));
            }}
          >
            Last 3 Days
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 6);
              setQuery((prev) => ({
                ...prev,
                page: 1,
                startDate: start.toISOString().slice(0, 10),
                endDate: end.toISOString().slice(0, 10),
              }));
            }}
          >
            Last Week
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={query.startDate ?? ""}
            onChange={(event) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                startDate: event.target.value,
              }))
            }
          />
          <Input
            type="date"
            value={query.endDate ?? ""}
            onChange={(event) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                endDate: event.target.value,
              }))
            }
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                startDate: undefined,
                endDate: undefined,
              }))
            }
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        {ordersQuery.data?.data.map((order) => {
          const isExpanded = expandedIds.has(order.id);
          const disabled = isActionDisabled(order);
          const reason = getActionDisableReason(order);
          return (
            <div
              key={order.id}
              className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 text-sm light:border-slate-200 light:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-400">
                    #{order.id}
                  </p>
                  <p className="text-base font-semibold">
                    {order.service_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatBangkok(order.created_at)}
                  </p>
                </div>
                <Badge variant={statusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Qty</span>
                  <span className="font-mono">{order.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Provider</span>
                  <span className="font-mono text-xs">
                    {order.provider_code ?? "-"}
                  </span>
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
                  onClick={() => {
                    navigator.clipboard.writeText(order.link);
                    push({
                      title: "Copied",
                      description: "Link copied to clipboard",
                      variant: "success",
                    });
                  }}
                >
                  Copy Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  title={disabled ? reason : undefined}
                  onClick={() => setRefillTarget(order)}
                >
                  Refill
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  title={disabled ? reason : undefined}
                  onClick={() => setResubmitTarget(order)}
                >
                  Resubmit
                </Button>
              </div>
            </div>
          );
        })}
        {!ordersQuery.data?.data.length && (
          <div className="rounded-lg border border-slate-800/60 p-4 text-center text-slate-400 light:border-slate-200">
            No orders found.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "link"
                        ? "w-[220px]"
                        : header.column.id === "actions"
                          ? "w-[190px]"
                          : undefined
                    }
                  >
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
          setRefillLink("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refill Order</DialogTitle>
            <DialogDescription>
              Confirm refill for order #{refillTarget?.id}. <br />
              Start count: {refillTarget?.start_count}. Quantity:{" "}
              {refillTarget?.quantity}. Target count:{" "}
              {(refillTarget?.start_count ?? 0) + (refillTarget?.quantity ?? 0)}
              .<br />
              Target Refill Count:{" "}
              {(refillTarget?.start_count ?? 0) +
                (refillTarget?.quantity ?? 0) -
                ((refillTarget?.quantity ?? 0) * 0.1 > 100
                  ? 100
                  : (refillTarget?.quantity ?? 0) * 0.1)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Current Count"
              type="number"
              value={refillCurrentCount}
              onChange={(event) => setRefillCurrentCount(event.target.value)}
            />
            <Input
              placeholder="New Link (optional)"
              value={refillLink}
              onChange={(event) => setRefillLink(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefillTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                !refillCurrentCount ||
                Number(refillCurrentCount) >
                  (refillTarget?.start_count ?? 0) +
                    (refillTarget?.quantity ?? 0) -
                    ((refillTarget?.quantity ?? 0) * 0.1 > 100
                      ? 100
                      : (refillTarget?.quantity ?? 0) * 0.1)
              }
              onClick={() => {
                if (refillTarget) {
                  refillMutation.mutate({
                    orderId: refillTarget.id,
                    current_count: refillCurrentCount
                      ? Number(refillCurrentCount)
                      : undefined,
                    link: refillLink.trim() ? refillLink.trim() : undefined,
                  });
                  setRefillTarget(null);
                  setRefillCurrentCount("");
                  setRefillLink("");
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
          setNewStartCount("");
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
            <Input
              placeholder="New Start Count"
              type="number"
              value={newStartCount}
              onChange={(event) => setNewStartCount(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resubmitTarget && newServiceId && newStartCount) {
                  resubmitMutation.mutate({
                    old_order_id: resubmitTarget.id,
                    new_service_id: Number(newServiceId),
                    new_start_count: Number(newStartCount),
                    user_id: resubmitTarget.user_id,
                    link: resubmitTarget.link,
                    qty: resubmitTarget.quantity,
                  });
                  setNewServiceId("");
                  setNewStartCount("");
                  setResubmitTarget(null);
                }
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={() => {
          setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update status or remark for order #{editTarget?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={editStatus}
              onValueChange={(value) => setEditStatus(value as OrderStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Remark"
              value={editRemark}
              onChange={(event) => setEditRemark(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editTarget) {
                  editMutation.mutate({
                    id: editTarget.id,
                    status: editStatus,
                    remark: editRemark || "",
                  });
                  setEditTarget(null);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
