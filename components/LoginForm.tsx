"use client";

import { useActionState } from "react";
import { authenticate, type AuthFormState } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    authenticate,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <Label>
        <span className="text-xs font-medium text-muted-foreground">Email</span>
        <Input name="email" type="email" autoComplete="username" required placeholder="you@example.com" />
      </Label>
      <Label>
        <span className="text-xs font-medium text-muted-foreground">Password</span>
        <Input name="password" type="password" autoComplete="current-password" required minLength={8} />
      </Label>
      {state?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
