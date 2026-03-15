import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/modules/auth/auth.service";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const user = await getSession();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  return <AdminShell user={{ id: user.id, email: user.email }}>{children}</AdminShell>;
}
