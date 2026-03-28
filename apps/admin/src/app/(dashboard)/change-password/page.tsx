import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Change password</h1>
      <p className="text-sm text-stone-600">
        Request an OTP to your admin email, then enter it with your new password.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
