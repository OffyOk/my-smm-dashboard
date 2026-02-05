import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { User } from "../lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function UsersPage() {
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/api/users"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Users</h2>
        <p className="text-sm text-slate-400 light:text-slate-600">
          View customer profiles and account balances.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Platform ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Total Spent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(usersQuery.data ?? []).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono">{user.id}</TableCell>
              <TableCell className="font-mono text-xs">{user.platform_user_id}</TableCell>
              <TableCell>{user.username ?? "-"}</TableCell>
              <TableCell className="font-mono">{user.balance.toFixed(2)}</TableCell>
              <TableCell className="font-mono">{user.total_spent.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {!usersQuery.data?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
