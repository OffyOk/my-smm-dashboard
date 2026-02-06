import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Service } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { MoreHorizontal, Plus } from "lucide-react";

const emptyDraft: ServiceDraft = {
  id: 0,
  name: "",
  price: 0,
  is_active: true,
  provider_code: "",
  provider_service_id: null,
  backup_service_id: null,
  refill_service_id: null,
  min_qty: 0,
  max_qty: 0,
  cost_price: 0,
  price_tiers: [],
};

type ServiceDraft = {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  provider_code: string;
  provider_service_id: number | null;
  backup_service_id: number | null;
  refill_service_id: number | null;
  min_qty: number | null;
  max_qty: number | null;
  cost_price: number | null;
  price_tiers: unknown;
};

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "duplicate">("create");
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);
  const [detailsTarget, setDetailsTarget] = useState<Service | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => apiFetch<Service[]>("/api/services"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ServiceDraft) =>
      apiFetch("/api/services", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Service> & { id: number }) =>
      apiFetch(`/api/services/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const services = useMemo(
    () => servicesQuery.data ?? [],
    [servicesQuery.data],
  );
  const backupOptions = useMemo(
    () => services.map((service) => service.id),
    [services],
  );

  function openCreate() {
    setMode("create");
    setDraft({ ...emptyDraft, id: nextServiceId(services) });
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setMode("edit");
    setDraft(mapServiceToDraft(service));
    setDialogOpen(true);
  }

  function openDuplicate(service: Service) {
    setMode("duplicate");
    setDraft({ ...mapServiceToDraft(service), id: nextServiceId(services) });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Services</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            Create, duplicate, and update services with backup routing control.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Service
        </Button>
      </div>

      <div className="space-y-3 sm:hidden">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 text-sm light:border-slate-200 light:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-slate-400">#{service.id}</p>
                <p className="text-base font-semibold">{service.name}</p>
                <p className="text-xs text-slate-500">
                  {service.provider_code ?? "-"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsTarget(service)}
              >
                Details
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Price</span>
              <span className="font-mono">
                {Number(service.price ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Active</span>
              <Switch
                checked={!!service.is_active}
                onCheckedChange={(value) =>
                  updateMutation.mutate({ id: service.id, is_active: value })
                }
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(service)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDuplicate(service)}
              >
                Duplicate
              </Button>
            </div>
          </div>
        ))}
        {!services.length && (
          <div className="rounded-lg border border-slate-800/60 p-4 text-center text-slate-400 light:border-slate-200">
            No services found.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-mono">{service.id}</TableCell>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-sm text-slate-400 light:text-slate-600">
                  {service.provider_code ?? "-"}
                </TableCell>
                <TableCell className="font-mono">
                  {Number(service.price ?? 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!service.is_active}
                    onCheckedChange={(value) =>
                      updateMutation.mutate({ id: service.id, is_active: value })
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailsTarget(service)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(service)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDuplicate(service)}>
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!services.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400">
                  No services found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" && "Create Service"}
              {mode === "edit" && `Edit Service #${draft.id}`}
              {mode === "duplicate" && `Duplicate Service #${draft.id}`}
            </DialogTitle>
            <DialogDescription>
              Update pricing, provider mapping, and failover configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              placeholder="Service ID"
              type="number"
              value={draft.id}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  id: Number(event.target.value),
                }))
              }
              disabled={mode === "edit"}
            />
            <Input
              placeholder="Service Name"
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Provider Code"
                value={draft.provider_code}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    provider_code: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Provider Service ID"
                type="number"
                value={draft.provider_service_id ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    provider_service_id: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Cost Price"
                type="number"
                step="0.01"
                value={draft.cost_price ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    cost_price: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
              <Input
                placeholder="Sale Price"
                type="number"
                step="0.01"
                value={draft.price}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    price: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Min Qty"
                type="number"
                value={draft.min_qty ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    min_qty: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
              <Input
                placeholder="Max Qty"
                type="number"
                value={draft.max_qty ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    max_qty: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Backup Service ID"
                type="number"
                value={draft.backup_service_id ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    backup_service_id: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
                list="backup-services"
              />
              <Input
                placeholder="Refill Service ID"
                type="number"
                value={draft.refill_service_id ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    refill_service_id: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <datalist id="backup-services">
              {backupOptions.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
            <Textarea
              placeholder='Price tiers JSON (e.g. [{"min":1000,"price":3.9}])'
              value={
                typeof draft.price_tiers === "string"
                  ? draft.price_tiers
                  : JSON.stringify(draft.price_tiers ?? [], null, 2)
              }
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  price_tiers: event.target.value,
                }))
              }
            />
            <div className="flex items-center justify-between rounded-md border border-slate-800/60 px-3 py-2 text-sm light:border-slate-200">
              <span>Active</span>
              <Switch
                checked={draft.is_active}
                onCheckedChange={(value) =>
                  setDraft((prev) => ({ ...prev, is_active: value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const payload = {
                  ...draft,
                  provider_code: draft.provider_code,
                  price_tiers: parsePriceTiers(draft.price_tiers),
                };
                if (mode === "edit") {
                  updateMutation.mutate(payload);
                } else {
                  createMutation.mutate(payload);
                }
                setDialogOpen(false);
              }}
            >
              {mode === "edit" ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailsTarget} onOpenChange={() => setDetailsTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>
              Full mapping details for service #{detailsTarget?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <DetailRow label="Name" value={detailsTarget?.name} />
            <DetailRow
              label="Provider Code"
              value={detailsTarget?.provider_code ?? "-"}
            />
            <DetailRow
              label="Provider Service ID"
              value={detailsTarget?.provider_service_id ?? "-"}
            />
            <DetailRow
              label="Backup Service"
              value={detailsTarget?.backup_service_id ?? "-"}
            />
            <DetailRow
              label="Refill Service"
              value={detailsTarget?.refill_service_id ?? "-"}
            />
            <DetailRow label="Min Qty" value={detailsTarget?.min_qty ?? "-"} />
            <DetailRow label="Max Qty" value={detailsTarget?.max_qty ?? "-"} />
            <DetailRow
              label="Cost Price"
              value={detailsTarget?.cost_price ?? "-"}
            />
            <DetailRow label="Price" value={detailsTarget?.price ?? "-"} />
            <DetailRow
              label="Price Tiers"
              value={
                detailsTarget?.price_tiers
                  ? JSON.stringify(detailsTarget.price_tiers)
                  : "[]"
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 light:border-slate-200">
      <span className="text-slate-400 light:text-slate-600">{label}</span>
      <span className="font-mono text-xs text-slate-200 light:text-slate-800">
        {value ?? "-"}
      </span>
    </div>
  );
}

function mapServiceToDraft(service: Service): ServiceDraft {
  return {
    id: service.id,
    name: service.name,
    price: Number(service.price ?? 0),
    is_active: !!service.is_active,
    provider_code: service.provider_code ?? "",
    provider_service_id: service.provider_service_id ?? null,
    backup_service_id: service.backup_service_id ?? null,
    refill_service_id: service.refill_service_id ?? null,
    min_qty: service.min_qty ?? null,
    max_qty: service.max_qty ?? null,
    cost_price: service.cost_price ?? null,
    price_tiers: service.price_tiers ?? [],
  };
}

function nextServiceId(services: Service[]) {
  const maxId = services.reduce((acc, service) => Math.max(acc, service.id), 0);
  return maxId + 1;
}

function parsePriceTiers(input: unknown) {
  if (typeof input !== "string") {
    return input ?? [];
  }
  try {
    return JSON.parse(input || "[]");
  } catch {
    return [];
  }
}
