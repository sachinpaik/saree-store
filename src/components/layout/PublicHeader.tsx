import { TopBrandBar } from "@/components/sections/TopBrandBar";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
      <TopBrandBar />
    </header>
  );
}
