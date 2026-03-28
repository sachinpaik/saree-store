"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, sendLoginResetOtp, resetPasswordWithLoginOtp } from "@/lib/admin/auth";

export function LoginForm({ next = "" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await login(formData);
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.replace((formData.get("next") as string) || "/dashboard");
  }

  async function handleSendOtp() {
    setResetError(null);
    setResetSuccess(null);
    setSendingOtp(true);
    const result = await sendLoginResetOtp(email);
    setSendingOtp(false);
    if (result.error) {
      setResetError(result.error);
      return;
    }
    setResetSuccess(`OTP sent to ${result.email}`);
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await resetPasswordWithLoginOtp(formData);
    setResetLoading(false);
    if (result.error) {
      setResetError(result.error);
      return;
    }
    setShowReset(false);
    setResetSuccess("Password updated. Sign in with your new password.");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="next" value={next} readOnly />
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="border-t border-stone-200 pt-3">
        <button
          type="button"
          onClick={() => {
            setShowReset((v) => !v);
            setResetError(null);
            setResetSuccess(null);
          }}
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          {showReset ? "Hide OTP password reset" : "Forgot password? Reset with OTP"}
        </button>
      </div>

      {showReset && (
        <form onSubmit={handleResetPassword} className="space-y-3 rounded border border-stone-200 p-3">
          <input type="hidden" name="resetEmail" value={email} readOnly />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || !email}
              className="py-1.5 px-3 border border-stone-300 text-stone-700 text-xs font-medium rounded hover:bg-stone-50 disabled:opacity-50"
            >
              {sendingOtp ? "Sending OTP…" : "Send OTP"}
            </button>
            <span className="text-xs text-stone-500">Uses the email above</span>
          </div>
          <div>
            <label htmlFor="resetOtp" className="block text-xs font-medium text-stone-700 mb-1">
              OTP
            </label>
            <input
              id="resetOtp"
              name="resetOtp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label htmlFor="resetNewPassword" className="block text-xs font-medium text-stone-700 mb-1">
              New password
            </label>
            <input
              id="resetNewPassword"
              name="resetNewPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label htmlFor="resetConfirmPassword" className="block text-xs font-medium text-stone-700 mb-1">
              Confirm new password
            </label>
            <input
              id="resetConfirmPassword"
              name="resetConfirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          {resetError && <p className="text-sm text-red-600">{resetError}</p>}
          {resetSuccess && <p className="text-sm text-green-700">{resetSuccess}</p>}
          <button
            type="submit"
            disabled={resetLoading}
            className="w-full py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
          >
            {resetLoading ? "Updating…" : "Update password with OTP"}
          </button>
        </form>
      )}

      {!showReset && resetSuccess && <p className="text-sm text-green-700">{resetSuccess}</p>}
    </div>
  );
}
