import { ReactNode } from "react";

export function SareeGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {children}
    </div>
  );
}
