export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | string;

export function stockRank(status: string): number {
  if (status === "in_stock") return 0;
  if (status === "low_stock") return 1;
  return 2;
}

export function stockLabel(status: string): { label: string; tone: "ok" | "warn" | "bad" } {
  if (status === "low_stock") return { label: "Low stock", tone: "warn" };
  if (status === "out_of_stock") return { label: "Out of stock", tone: "bad" };
  return { label: "In stock", tone: "ok" };
}
