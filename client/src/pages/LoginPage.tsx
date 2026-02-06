import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { setAuthToken } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      navigate(from, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Login failed");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel-950 px-4 text-slate-100 light:bg-slate-50 light:text-slate-900">
      <Card className="w-full max-w-md border border-slate-800/60 light:border-slate-200">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <p className="text-sm text-slate-400 light:text-slate-600">
            Sign in to access Rocket Boost Mission Control.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400 light:text-slate-600">
              Username
            </label>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 light:text-slate-600">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}
          <Button
            className="w-full"
            onClick={() => loginMutation.mutate()}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}