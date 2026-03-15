/** Shared types and pure helpers for attribute definitions (safe to import from client). */

export type AttributeDefinition = {
  key: string;
  label: string;
  group: string;
  input_type: "text" | "textarea" | "select";
  options_json: string | null;
  sort_order: number;
  is_active: boolean;
  is_required: boolean;
};

export function parseSelectOptions(optionsJson: string | null): { value: string; label: string }[] {
  if (!optionsJson?.trim()) return [];
  try {
    const parsed = JSON.parse(optionsJson) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { value: item, label: item };
        if (item && typeof item === "object" && "value" in item && "label" in item)
          return { value: String((item as { value: string }).value), label: String((item as { label: string }).label) };
        return { value: String(item), label: String(item) };
      });
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([value, label]) => ({ value, label: String(label) }));
    }
  } catch {
    // ignore
  }
  return [];
}
