"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSettings } from "@/app/actions/settings";

export function SettingsForm({
  settings,
}: {
  settings: {
    whatsapp_number: string;
    call_number: string;
    whatsapp_message_template: string;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateStoreSettings(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          WhatsApp number
        </label>
        <input
          name="whatsapp_number"
          type="tel"
          defaultValue={settings.whatsapp_number}
          placeholder="e.g. 919876543210"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Call number
        </label>
        <input
          name="call_number"
          type="tel"
          defaultValue={settings.call_number}
          placeholder="e.g. +971501234567"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          WhatsApp message template
        </label>
        <textarea
          name="whatsapp_message_template"
          defaultValue={settings.whatsapp_message_template}
          rows={4}
          placeholder="Use {title} and {sku} as placeholders. e.g. Hi, I'm interested in: {title} (SKU: {sku})"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
