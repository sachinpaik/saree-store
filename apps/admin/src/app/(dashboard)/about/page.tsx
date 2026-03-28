import { AboutContentForm } from "@/components/admin/AboutContentForm";

export default function AdminAboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">About (Silk Manufacturing)</h1>
      <p className="text-sm text-stone-600">
        Manage section title, intro text, and body content using simple markdown formatting.
      </p>
      <AboutContentForm />
    </div>
  );
}
