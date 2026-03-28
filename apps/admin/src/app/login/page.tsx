"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminLoginMessage } from "./AdminLoginMessage";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const reason = searchParams.get("reason");
  const next = searchParams.get("next") ?? "";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Admin sign in</h1>
        <p className="text-sm text-stone-600 mb-4">
          Sign in with your admin email and password, or reset password with OTP.
        </p>
        {error === "access_denied" && (
          <AdminLoginMessage className="mb-6" reason={reason ?? undefined} />
        )}
        <LoginForm next={next} />
        <p className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-900">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-stone-500 text-sm">
          Loading…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
