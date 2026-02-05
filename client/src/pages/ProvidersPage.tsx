import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Provider } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () => apiFetch<Provider[]>("/api/providers"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Provider) =>
      apiFetch(`/api/providers/${payload.code}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providers"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Providers</h2>
        <p className="text-sm text-slate-400 light:text-slate-600">
          Manage upstream API endpoints and credentials.
        </p>
      </div>

      <div className="space-y-3 sm:hidden">
        {(providersQuery.data ?? []).map((provider) => (
          <div
            key={provider.code}
            className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 text-sm light:border-slate-200 light:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Code</p>
                <p className="font-mono text-base">{provider.code}</p>
              </div>
              <Button size="sm" variant="subtle" onClick={() => updateMutation.mutate(provider)}>
                Save
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              <Input
                defaultValue={provider.name ?? ""}
                onBlur={(event) =>
                  updateMutation.mutate({ ...provider, name: event.currentTarget.value })
                }
                placeholder="Provider Name"
              />
              <Input
                defaultValue={provider.api_url}
                onBlur={(event) =>
                  updateMutation.mutate({ ...provider, api_url: event.currentTarget.value })
                }
                placeholder="API URL"
              />
              <Input
                defaultValue={provider.api_key}
                onBlur={(event) =>
                  updateMutation.mutate({ ...provider, api_key: event.currentTarget.value })
                }
                placeholder="API Key"
              />
            </div>
          </div>
        ))}
        {!providersQuery.data?.length && (
          <div className="rounded-lg border border-slate-800/60 p-4 text-center text-slate-400 light:border-slate-200">
            No providers configured.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>API URL</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(providersQuery.data ?? []).map((provider) => (
            <ProviderRow key={provider.code} provider={provider} onSave={updateMutation.mutate} />
          ))}
          {!providersQuery.data?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400">
                No providers configured.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProviderRow({
  provider,
  onSave,
}: {
  provider: Provider;
  onSave: (payload: Provider) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono">{provider.code}</TableCell>
      <TableCell>
        <Input
          defaultValue={provider.name ?? ""}
          onBlur={(event) => onSave({ ...provider, name: event.currentTarget.value })}
        />
      </TableCell>
      <TableCell>
        <Input
          defaultValue={provider.api_url}
          onBlur={(event) => onSave({ ...provider, api_url: event.currentTarget.value })}
        />
      </TableCell>
      <TableCell>
        <Input
          defaultValue={provider.api_key}
          onBlur={(event) => onSave({ ...provider, api_key: event.currentTarget.value })}
        />
      </TableCell>
      <TableCell>
        <Button size="sm" variant="subtle" onClick={() => onSave(provider)}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}
