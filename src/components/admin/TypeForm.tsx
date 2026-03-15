"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createType, updateType } from "@/app/actions/types";

type Type = {
  id: string;
  name: string;
  slug: string;
  banner_url: string | null;
  sort_order: number;
};

export function TypeForm({ type }: { type?: Type }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!type;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = isEdit
      ? await updateType(type.id, formData)
      : await createType(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/types");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
        <input
          name="name"
          defaultValue={type?.name}
          required
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Slug</label>
        <input
          name="slug"
          defaultValue={type?.slug}
          placeholder="auto-generated"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Banner URL</label>
        <input
          name="banner_url"
          type="url"
          defaultValue={type?.banner_url ?? ""}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Sort order</label>
        <input
          name="sort_order"
          type="number"
          defaultValue={type?.sort_order ?? 0}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
        <Link
          href="/admin/types"
          className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded hover:bg-stone-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
