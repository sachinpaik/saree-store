"use client";

import { useRouter } from "next/navigation";
import { enablePreviewMode } from "@/app/actions/preview-mode";
import { useState } from "react";

export function OpenPreviewButton({ 
  productId,
  productSlug,
}: { 
  productId: string;
  productSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleOpenPreview() {
    setLoading(true);
    
    // Enable preview mode
    const result = await enablePreviewMode();
    
    if (result.success) {
      // Navigate to customer-facing product page
      router.push(`/saree/${productSlug}`);
    } else {
      alert(result.error || "Failed to enable preview mode");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleOpenPreview}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
      title="Open product page in draft preview mode"
    >
      {loading ? "Opening..." : "👁️ Open Preview"}
    </button>
  );
}
