"use client";

import { useEffect, useRef, useState } from "react";
import { getAboutContent, saveAboutContent } from "@/lib/admin/about";

type FormState = {
  title: string;
  intro_text: string;
  body_html: string;
};

const EMPTY_STATE: FormState = {
  title: "",
  intro_text: "",
  body_html: "",
};

export function AboutContentForm() {
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_STATE);

  useEffect(() => {
    let cancelled = false;
    getAboutContent()
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setForm(EMPTY_STATE);
          setLoading(false);
          return;
        }
        setForm({
          title: data.title ?? "",
          intro_text: data.intro_text ?? "",
          body_html: data.body_html ?? "",
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load About content");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function applyMarkdown(before: string, after?: string, placeholder = "text") {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = form.body_html.slice(start, end) || placeholder;
    const suffix = after ?? before;
    const next = `${form.body_html.slice(0, start)}${before}${selected}${suffix}${form.body_html.slice(end)}`;
    const cursor = start + before.length + selected.length + suffix.length;
    setForm((prev) => ({ ...prev, body_html: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const result = await saveAboutContent(form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess("Saved");
  }

  if (loading) {
    return <div className="text-sm text-stone-500">Loading…</div>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-stone-300 rounded"
          placeholder="About Silk Manufacturing"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Intro text</label>
        <textarea
          value={form.intro_text}
          onChange={(e) => setForm((prev) => ({ ...prev, intro_text: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-stone-300 rounded"
          placeholder="Short intro for the section"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Body content (Markdown)</label>
        <div className="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyMarkdown("## ", "", "Section title")}
            className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => applyMarkdown("**", "**", "bold text")}
            className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50"
          >
            Bold
          </button>
          <button
            type="button"
            onClick={() => applyMarkdown("*", "*", "italic text")}
            className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50"
          >
            Italic
          </button>
          <button
            type="button"
            onClick={() => applyMarkdown("- ", "", "List item")}
            className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50"
          >
            List
          </button>
          <button
            type="button"
            onClick={() => applyMarkdown("[", "](https://)", "Link text")}
            className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50"
          >
            Link
          </button>
        </div>
        <textarea
          ref={bodyRef}
          value={form.body_html}
          onChange={(e) => setForm((prev) => ({ ...prev, body_html: e.target.value }))}
          rows={12}
          className="w-full px-3 py-2 border border-stone-300 rounded font-mono text-sm"
          placeholder={"## Silk Manufacturing\nWrite your content here in plain text.\n\n- Point 1\n- Point 2"}
        />
        <p className="mt-2 text-xs text-stone-500">
          Tip: Write plain text and use the buttons above. No HTML needed.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save About content"}
      </button>
    </form>
  );
}
