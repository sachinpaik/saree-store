import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const metadata = {
  title: "Change password",
  description: "Update your admin account password",
};

export default function AdminChangePasswordPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Change password</h1>
      <p className="text-sm text-stone-600">
        Enter a new password below. You will stay signed in after updating.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
