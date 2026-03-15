import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    role: "admin",
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    role: "admin",
  };
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function isAdminLoginRoute(pathname: string): boolean {
  return pathname === "/admin/login";
}
