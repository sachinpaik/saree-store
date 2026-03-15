"use client";

import { useRouter } from "next/navigation";
import { enablePreviewMode, disablePreviewMode } from "@/app/actions/preview-mode";
import { useState } from "react";

/**
 * Determine the best admin destination based on current path.
 * 
 * Logic:
 * - If on product page and have productId -> go to product edit page
 * - If on homepage or other pages -> go to admin products list
 */
function getAdminDestination(currentPath: string, productId?: string): string {
  // If we have a product ID, go directly to edit page
  if (productId) {
    return `/admin/products/${productId}/edit`;
  }
  
  // For product detail pages, try to extract product ID from path
  const productPageMatch = currentPath.match(/\/saree\/([^/]+)/);
  if (productPageMatch) {
    // We're on a product page but don't have the ID yet
    // Default to products list (can't determine product ID from slug alone)
    return "/admin/products";
  }
  
  // For homepage or collection pages
  if (currentPath === "/" || currentPath === "/kanchipuram-silks") {
    return "/admin/products";
  }
  
  // Default fallback
  return "/admin/dashboard";
}

export function PreviewBar({ 
  currentPath,
  productId,
  initialMode = "preview",
}: { 
  currentPath: string;
  productId?: string;
  initialMode?: "preview" | "live";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"preview" | "live">(initialMode);
  const [switching, setSwitching] = useState(false);

  async function handleModeSwitch(newMode: "preview" | "live") {
    if (newMode === mode || switching) return;
    
    setSwitching(true);
    
    if (newMode === "preview") {
      await enablePreviewMode();
    } else {
      await disablePreviewMode();
    }
    
    setMode(newMode);
    router.refresh();
    setSwitching(false);
  }

  function handleBackToAdmin() {
    const adminPath = getAdminDestination(currentPath, productId);
    router.push(adminPath);
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <span className="font-semibold">👁️ Admin Preview Mode</span>
        <span className="text-blue-200 text-xs">
          {mode === "preview" 
            ? "(Viewing draft changes - customers see approved version)" 
            : "(Viewing live approved version)"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* Preview/Live Toggle */}
        <div className="flex bg-blue-700 rounded overflow-hidden">
          <button
            onClick={() => handleModeSwitch("live")}
            disabled={switching}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "live"
                ? "bg-white text-blue-600"
                : "bg-blue-700 text-white hover:bg-blue-800"
            } ${switching ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Live
          </button>
          <button
            onClick={() => handleModeSwitch("preview")}
            disabled={switching}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "preview"
                ? "bg-white text-blue-600"
                : "bg-blue-700 text-white hover:bg-blue-800"
            } ${switching ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Preview
          </button>
        </div>
        
        {/* Back to Admin */}
        <button
          onClick={handleBackToAdmin}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}
