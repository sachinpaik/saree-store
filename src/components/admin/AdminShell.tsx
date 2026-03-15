"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

type User = { id: string; email?: string } | null;

export function AdminShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!user) {
      router.replace("/admin/login");
    }
  }, [user, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-stone-100">
      <aside className="w-56 bg-white border-r border-stone-200 shrink-0">
        <div className="p-4 border-b border-stone-200">
          <Link href="/admin/dashboard" className="font-semibold text-stone-900">
            Admin
          </Link>
        </div>
        <nav className="p-2 space-y-0.5">
          <Link
            href="/admin/dashboard"
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded"
          >
            Products
          </Link>
          <Link
            href="/admin/types"
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded"
          >
            Types
          </Link>
          <Link
            href="/admin/attributes"
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded"
          >
            Attributes
          </Link>
          <Link
            href="/admin/settings"
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded"
          >
            Settings
          </Link>
          <Link
            href="/admin/change-password"
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded"
          >
            Change password
          </Link>
          <Link
            href="/"
            className="block px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded"
          >
            ← Store
          </Link>
          <form action={logout} className="mt-2">
            <button type="submit" className="block w-full text-left px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded">
              Log out
            </button>
          </form>
        </nav>
      </aside>
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
