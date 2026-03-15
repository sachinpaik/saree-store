"use client";

const PREFERRED_ORDER = [
  "Fabric",
  "Technique",
  "Border",
  "Pallu",
  "Blouse Piece",
  "Length",
  "Care Instructions",
];

export type ProductSpecificationsProps = {
  /** Key-value pairs; keys are spec names, values are strings or numbers */
  specs: Record<string, string | number | boolean>;
  /** Optional title above the table */
  title?: string;
};

function formatValue(v: string | number | boolean): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function ProductSpecifications({ specs, title = "Specifications" }: ProductSpecificationsProps) {
  const entries = Object.entries(specs).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return null;

  const ordered = [...entries].sort(([a], [b]) => {
    const ia = PREFERRED_ORDER.indexOf(a);
    const ib = PREFERRED_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <section className="border border-stone-200 rounded-sm overflow-hidden">
      <h3 className="text-sm font-medium text-stone-800 bg-stone-50 px-4 py-2 border-b border-stone-200">
        {title}
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {ordered.map(([label, value]) => (
            <tr key={label} className="border-b border-stone-100 last:border-b-0">
              <td className="px-4 py-2.5 text-stone-500 font-medium w-[40%]">{label}</td>
              <td className="px-4 py-2.5 text-stone-800">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
