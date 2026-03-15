"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/app/actions/settings";

type SiteSettingsFormProps = {
  settings: {
    business_name: string;
    contact_phone: string;
    contact_whatsapp: string;
    contact_email: string;
    address_text: string;
    instagram_url: string;
    support_hours: string;
    homepage_rotation_seconds: string;
  };
};

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSiteSettings(formData);
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
        <label className="block text-sm font-medium text-stone-700 mb-1">Business name</label>
        <input
          name="business_name"
          defaultValue={settings.business_name}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Contact phone</label>
        <input
          name="contact_phone"
          type="tel"
          defaultValue={settings.contact_phone}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Contact WhatsApp</label>
        <input
          name="contact_whatsapp"
          type="tel"
          defaultValue={settings.contact_whatsapp}
          placeholder="e.g. 919876543210"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Contact email</label>
        <input
          name="contact_email"
          type="email"
          defaultValue={settings.contact_email}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
        <textarea
          name="address_text"
          defaultValue={settings.address_text}
          rows={2}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Instagram URL</label>
        <input
          name="instagram_url"
          type="url"
          defaultValue={settings.instagram_url}
          placeholder="https://instagram.com/..."
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Support hours</label>
        <input
          name="support_hours"
          defaultValue={settings.support_hours}
          placeholder="e.g. Mon–Sat 9am–6pm"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Homepage carousel rotation (seconds)</label>
        <input
          name="homepage_rotation_seconds"
          type="number"
          min="1"
          max="60"
          defaultValue={settings.homepage_rotation_seconds || ""}
          placeholder="5"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save site settings"}
      </button>
    </form>
  );
}
