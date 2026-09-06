"use client";

import { useActionState } from "react";
import { authenticate, type AuthFormState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    authenticate,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-brand-500 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-brand-500 focus:ring-2"
        />
      </label>
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
