import type { Saree } from "@/lib/types";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
function formatAed(amount: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(amount);
}

export function PriceLine({ saree }: { saree: Saree }) {
  const showInr = saree.price_inr > 0;
  const showAed = saree.price_aed > 0;
  if (!showInr && !showAed) return null;
  return (
    <div className="flex flex-wrap gap-3 text-sm text-stone-600">
      {showInr && <span>{formatInr(saree.price_inr)}</span>}
      {showAed && <span>{formatAed(saree.price_aed)}</span>}
    </div>
  );
}
