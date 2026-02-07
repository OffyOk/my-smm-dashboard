import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import type { User, UsersResponse } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupRemark, setTopupRemark] = useState("");
  const [topupSlip, setTopupSlip] = useState("");
  const { push } = useToast();

  const usersQuery = useQuery({
    queryKey: ["users", page, pageSize, search],
    queryFn: () =>
      apiFetch<UsersResponse>("/api/users", {
        query: {
          page,
          pageSize,
          search: search.trim() || undefined,
        },
      }),
  });

  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paginationLabel = useMemo(() => {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `${start}-${end} of ${total}`;
  }, [page, pageSize, total]);

  const topupMutation = useMutation({
    mutationFn: (payload: { userId: number; amount: number; remark?: string; slip_url?: string }) =>
      apiFetch<{ success: boolean; balance: number; transaction_id?: number }>(
        `/api/users/${payload.userId}/topup`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: payload.amount,
            remark: payload.remark,
            slip_url: payload.slip_url,
          }),
        },
      ),
    onSuccess: (data) => {
      push({
        title: "Top up completed",
        description: `New balance: ${data.balance.toFixed(2)}`,
        variant: "success",
      });
      usersQuery.refetch();
    },
    onError: (error) => {
      push({
        title: "Top up failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    },
  });

  function openTopup(user: User) {
    setSelectedUser(user);
    setTopupAmount("");
    setTopupRemark("");
    setTopupSlip("");
  }

  function closeTopup() {
    setSelectedUser(null);
  }

  function submitTopup() {
    if (!selectedUser) return;
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      push({ title: "Invalid amount", description: "Enter a positive amount.", variant: "error" });
      return;
    }
    topupMutation.mutate({
      userId: selectedUser.id,
      amount,
      remark: topupRemark.trim() || undefined,
      slip_url: topupSlip.trim() || undefined,
    });
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Users</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            View customer profiles and account balances.
          </p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
          <Input
            placeholder="Search by ID, username, or platform ID"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Platform ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(usersQuery.data?.data ?? []).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono">{user.id}</TableCell>
              <TableCell className="font-mono text-xs">{user.platform_user_id}</TableCell>
              <TableCell>{user.username ?? "-"}</TableCell>
              <TableCell className="font-mono">{user.balance.toFixed(2)}</TableCell>
              <TableCell className="font-mono">{user.total_spent.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => openTopup(user)}>
                  Top up
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!usersQuery.data?.data?.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-400">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400 light:text-slate-600">{paginationLabel}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-400 light:text-slate-600">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => (!open ? closeTopup() : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Top up balance</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `User #${selectedUser.id} ? ${selectedUser.username ?? "-"}`
                : "Select user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={topupAmount}
              onChange={(event) => setTopupAmount(event.target.value)}
            />
            <Input
              placeholder="Remark (optional)"
              value={topupRemark}
              onChange={(event) => setTopupRemark(event.target.value)}
            />
            <Input
              placeholder="Slip URL (optional)"
              value={topupSlip}
              onChange={(event) => setTopupSlip(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTopup}>
              Cancel
            </Button>
            <Button onClick={submitTopup} disabled={topupMutation.isPending}>
              Confirm Top up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
