import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Service } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function ServicesPage() {
  const queryClient = useQueryClient();
  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => apiFetch<Service[]>("/api/services"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Service> & { id: number }) =>
      apiFetch(`/api/services/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="text-sm text-slate-400 light:text-slate-600">
          Adjust pricing, naming, and availability for storefront services.
        </p>
      </div>

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
          {(servicesQuery.data ?? []).map((service) => (
            <ServiceRow key={service.id} service={service} onSave={updateMutation.mutate} />
          ))}
          {!servicesQuery.data?.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-400">
                No services found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ServiceRow({
  service,
  onSave,
}: {
  service: Service;
  onSave: (payload: Partial<Service> & { id: number }) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono">{service.id}</TableCell>
      <TableCell>
        <Input
          defaultValue={service.name}
          onBlur={(event) =>
            onSave({ id: service.id, name: event.currentTarget.value })
          }
        />
      </TableCell>
      <TableCell className="text-sm text-slate-400 light:text-slate-600">
        {service.provider_code ?? "-"}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          defaultValue={service.price}
          onBlur={(event) =>
            onSave({ id: service.id, price: Number(event.currentTarget.value) })
          }
        />
      </TableCell>
      <TableCell>
        <Switch
          defaultChecked={service.is_active}
          onCheckedChange={(value) => onSave({ id: service.id, is_active: value })}
        />
      </TableCell>
      <TableCell>
        <Button size="sm" variant="subtle" onClick={() => onSave({ id: service.id })}>
          Sync
        </Button>
      </TableCell>
    </TableRow>
  );
}
