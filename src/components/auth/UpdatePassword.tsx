"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function UpdatePassword() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPassword = (formData.get("newPassword") as string)?.trim() ?? "";
    const confirmPassword = (formData.get("confirmPassword") as string)?.trim() ?? "";

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/admin/login"), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-stone-600">Confirming reset link…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-stone-900">Invalid or expired link</h1>
          <p className="text-sm text-stone-600">
            This password reset link is invalid or has expired. Request a new one from the login page.
          </p>
          <Link
            href="/admin/login"
            className="inline-block py-2.5 px-4 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Set new password</h1>
          <p className="text-sm text-stone-600 mt-1">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-stone-700 mb-1">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700" role="status">
              Password updated. Redirecting to login…
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="text-center">
          <Link href="/admin/login" className="text-sm text-stone-500 hover:text-stone-900">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
