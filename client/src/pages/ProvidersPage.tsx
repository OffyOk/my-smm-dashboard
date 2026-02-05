import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Provider } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useToast } from "../components/toast";

type BalanceItem = {
  code: string;
  balance: number | null;
  balance_status: "ok" | "error";
  balance_message?: string;
};

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [showKeys, setShowKeys] = useState<Set<string>>(() => new Set());
  const notifiedRef = useRef<string>("");

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () => apiFetch<Provider[]>("/api/providers"),
  });

  const balancesQuery = useQuery({
    queryKey: ["providers", "balances"],
    queryFn: () => apiFetch<BalanceItem[]>("/api/providers/balances"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Provider) =>
      apiFetch(`/api/providers/${payload.code}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providers"] }),
  });

  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const balances = useMemo(() => balancesQuery.data ?? [], [balancesQuery.data]);
  const balanceMap = useMemo(() => {
    const map = new Map<string, BalanceItem>();
    balances.forEach((item) => map.set(item.code, item));
    return map;
  }, [balances]);

  const lowBalances = useMemo(
    () =>
      balances.filter(
        (item) => item.balance_status === "ok" && item.balance !== null && item.balance < 2
      ),
    [balances]
  );

  useEffect(() => {
    if (!lowBalances.length) return;
    const signature = lowBalances.map((item) => item.code).join(",");
    if (signature === notifiedRef.current) return;
    notifiedRef.current = signature;
    push({
      title: "Low Provider Balance",
      description: `Providers below $2: ${signature}`,
      variant: "error",
    });
  }, [lowBalances, push]);

  function toggleKey(code: string) {
    setShowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Providers</h2>
        <p className="text-sm text-slate-400 light:text-slate-600">
          Manage upstream API endpoints and credentials.
        </p>
      </div>

      <div className="space-y-3 sm:hidden">
        {providers.map((provider) => {
          const balanceInfo = balanceMap.get(provider.code);
          return (
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
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">Balance</span>
                {balanceInfo?.balance_status === "ok" ? (
                  <span className="font-mono text-xs">
                    {balanceInfo.balance?.toFixed(2)} USD
                    {balanceInfo.balance !== null && balanceInfo.balance < 2 && (
                      <Badge className="ml-2" variant="danger">
                        Low
                      </Badge>
                    )}
                  </span>
                ) : (
                  <Badge variant="warning">Unavailable</Badge>
                )}
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
                  type={showKeys.has(provider.code) ? "text" : "password"}
                  defaultValue={provider.api_key}
                  onBlur={(event) =>
                    updateMutation.mutate({ ...provider, api_key: event.currentTarget.value })
                  }
                  placeholder="API Key"
                />
                <Button size="sm" variant="outline" onClick={() => toggleKey(provider.code)}>
                  {showKeys.has(provider.code) ? "Hide Key" : "Show Key"}
                </Button>
              </div>
            </div>
          );
        })}
        {!providers.length && (
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
              <TableHead>Balance</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <ProviderRow
                key={provider.code}
                provider={provider}
                balanceInfo={balanceMap.get(provider.code)}
                onSave={updateMutation.mutate}
                showKey={showKeys.has(provider.code)}
                onToggleKey={() => toggleKey(provider.code)}
              />
            ))}
            {!providers.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400">
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
  balanceInfo,
  onSave,
  showKey,
  onToggleKey,
}: {
  provider: Provider;
  balanceInfo?: BalanceItem;
  onSave: (payload: Provider) => void;
  showKey: boolean;
  onToggleKey: () => void;
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
        <div className="flex items-center gap-2">
          <Input
            type={showKey ? "text" : "password"}
            defaultValue={provider.api_key}
            onBlur={(event) => onSave({ ...provider, api_key: event.currentTarget.value })}
          />
          <Button size="sm" variant="outline" onClick={onToggleKey}>
            {showKey ? "Hide" : "Show"}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        {balanceInfo?.balance_status === "ok" ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{balanceInfo.balance?.toFixed(2)} USD</span>
            {balanceInfo.balance !== null && balanceInfo.balance < 2 && (
              <Badge variant="danger">Low</Badge>
            )}
          </div>
        ) : (
          <Badge variant="warning">Unavailable</Badge>
        )}
      </TableCell>
      <TableCell>
        <Button size="sm" variant="subtle" onClick={() => onSave(provider)}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}
