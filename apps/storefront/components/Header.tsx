import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 py-8 md:py-10">
        <Link href="/" className="text-2xl md:text-3xl font-serif tracking-wide text-stone-900">
          Saree Store
        </Link>
        <nav className="flex items-center gap-8 text-sm tracking-wide text-stone-600">
          <Link href="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <Link href="/kanchipuram-silks" className="hover:text-stone-900 transition-colors">
            Kanchipuram Silks
          </Link>
          <Link href="/information" className="hover:text-stone-900 transition-colors">
            Information
          </Link>
        </nav>
      </div>
    </header>
  );
}
