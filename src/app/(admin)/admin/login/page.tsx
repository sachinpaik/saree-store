import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminLoginMessage } from "./AdminLoginMessage";

export const metadata = {
  title: "Admin Login",
  description: "Sign in to the admin dashboard",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  const { error, reason, next } = await searchParams;
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Admin sign in</h1>
        <p className="text-sm text-stone-600 mb-4">
          Sign in with your admin email and password.
        </p>
        {error === "access_denied" && (
          <AdminLoginMessage className="mb-6" reason={reason ?? undefined} />
        )}
        <LoginForm next={next ?? ""} />
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
