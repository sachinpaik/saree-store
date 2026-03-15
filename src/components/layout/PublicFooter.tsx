import Link from "next/link";
import { Container } from "./Container";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50/50 py-12">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-serif text-stone-800 text-lg tracking-wide">Saree Store</p>
          <nav className="flex gap-8 text-sm text-stone-600">
            <Link href="/" className="hover:text-stone-900">Home</Link>
            <Link href="/kanchipuram-silks" className="hover:text-stone-900">Kanchipuram Silks</Link>
            <Link href="/information" className="hover:text-stone-900">Information</Link>
          </nav>
        </div>
        <p className="mt-8 pt-6 border-t border-stone-200 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} Saree Store. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
