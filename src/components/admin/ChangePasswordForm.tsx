"use client";

import { useState } from "react";
import { changePassword } from "@/app/actions/auth";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await changePassword(formData);

    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    if (result?.success) {
      setSuccess(true);
      form.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-stone-700 mb-1">
          Current password (optional)
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400"
          placeholder="Leave blank if not required"
        />
      </div>
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
          Confirm new password
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
          Password updated successfully.
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="py-2.5 px-4 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
