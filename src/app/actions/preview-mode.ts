"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const PREVIEW_MODE_COOKIE = "admin_preview_mode";

/**
 * Admin preview mode actions.
 * 
 * Allows admins to preview draft changes on normal storefront pages.
 * Preview mode is stored in a secure cookie and checked server-side.
 * 
 * CRITICAL: Storefront pages must NEVER throw or fail due to preview mode.
 * All functions use defensive error handling and graceful fallbacks.
 */

/**
 * Safely get current user and check if admin.
 * 
 * NEVER throws - always returns object with user info.
 * Used by storefront pages to safely check admin status.
 * 
 * @returns {user: SessionUser | null, isAdmin: boolean}
 */
async function getSafeUserStatus(): Promise<{
  user: { id: string; email?: string; role?: string } | null;
  isAdmin: boolean;
}> {
  try {
    const supabase = await createClient();
    
    // Try to get user - this might return null or error
    const { data, error } = await supabase.auth.getUser();
    
    // If no user or error, return null safely
    if (error || !data?.user) {
      console.log("[Preview] No user session or error:", error?.message);
      return { user: null, isAdmin: false };
    }
    
    const authUser = data.user;
    
    // Try to get profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", authUser.id)
      .maybeSingle();
    
    // If profile query fails or no profile, not admin
    if (profileError || !profile) {
      console.log("[Preview] No profile or error:", profileError?.message);
      return {
        user: { id: authUser.id, email: authUser.email },
        isAdmin: false,
      };
    }
    
    const isAdminUser = profile.role === "admin";
    
    console.log("[Preview] User status:", {
      hasUser: true,
      role: profile.role,
      isAdmin: isAdminUser,
    });
    
    return {
      user: {
        id: authUser.id,
        email: authUser.email,
        role: profile.role,
      },
      isAdmin: isAdminUser,
    };
  } catch (error) {
    // ANY unexpected error = not admin (fail safe)
    console.error("[Preview] Unexpected error in getSafeUserStatus:", error);
    return { user: null, isAdmin: false };
  }
}

/**
 * Check if current user is an admin (simplified version).
 * NEVER throws - always returns boolean.
 */
async function isAdmin(): Promise<boolean> {
  const { isAdmin } = await getSafeUserStatus();
  return isAdmin;
}

/**
 * Enable preview mode (admin only).
 * This action IS admin-only and can return Unauthorized.
 */
export async function enablePreviewMode(): Promise<{ success: boolean; error?: string }> {
  const adminStatus = await isAdmin();
  
  if (!adminStatus) {
    return { success: false, error: "Unauthorized" };
  }
  
  try {
    const cookieStore = await cookies();
    cookieStore.set(PREVIEW_MODE_COOKIE, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    console.log("[Preview] Preview mode enabled");
    
    return { success: true };
  } catch (error) {
    console.error("[Preview] Failed to enable preview mode:", error);
    return { success: false, error: "Failed to set cookie" };
  }
}

/**
 * Disable preview mode.
 * Anyone can disable their own preview mode.
 */
export async function disablePreviewMode(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(PREVIEW_MODE_COOKIE);
    
    console.log("[Preview] Preview mode disabled");
    
    return { success: true };
  } catch (error) {
    console.error("[Preview] Failed to disable preview mode:", error);
    return { success: true }; // Still return success, cookie might not exist
  }
}

/**
 * Check if preview mode is enabled for current admin.
 * 
 * CRITICAL: Used by storefront pages - NEVER throws.
 * 
 * Logic:
 * 1. Check if preview cookie exists
 * 2. If no cookie -> return false
 * 3. If cookie exists -> check if user is admin
 * 4. If user is admin -> return true
 * 5. If user is not admin or any error -> return false
 * 
 * This ensures non-admin users with preview cookie just see live data.
 */
export async function isPreviewModeEnabled(): Promise<boolean> {
  try {
    // First check if preview cookie exists
    const cookieStore = await cookies();
    const previewCookie = cookieStore.get(PREVIEW_MODE_COOKIE);
    
    // No cookie -> no preview mode
    if (!previewCookie || previewCookie.value !== "true") {
      return false;
    }
    
    console.log("[Preview] Preview cookie found, checking admin status...");
    
    // Cookie exists, now check if user is admin
    // This must not throw - getSafeUserStatus handles all errors
    const { isAdmin: userIsAdmin } = await getSafeUserStatus();
    
    if (!userIsAdmin) {
      console.log("[Preview] Preview cookie exists but user is not admin, falling back to live data");
    } else {
      console.log("[Preview] Preview mode confirmed for admin user");
    }
    
    return userIsAdmin;
  } catch (error) {
    // ANY unexpected error = fall back to live data (fail safe)
    console.error("[Preview] Unexpected error in isPreviewModeEnabled:", error);
    return false;
  }
}

/**
 * Get preview mode status (for client components).
 * 
 * NEVER throws - always returns a valid status object.
 * Used by storefront pages to determine if preview bar should be shown.
 */
export async function getPreviewModeStatus(): Promise<{
  isAdmin: boolean;
  previewEnabled: boolean;
}> {
  try {
    console.log("[Preview] Getting preview mode status...");
    
    // Check if preview cookie exists first
    const cookieStore = await cookies();
    const previewCookie = cookieStore.get(PREVIEW_MODE_COOKIE);
    
    // Get user status safely
    const { isAdmin: userIsAdmin } = await getSafeUserStatus();
    
    // Preview is only enabled if cookie exists AND user is admin
    const previewEnabled = previewCookie?.value === "true" && userIsAdmin;
    
    console.log("[Preview] Status:", {
      hasCookie: previewCookie?.value === "true",
      isAdmin: userIsAdmin,
      previewEnabled,
    });
    
    return { isAdmin: userIsAdmin, previewEnabled };
  } catch (error) {
    // ANY unexpected error = not in preview mode (fail safe)
    console.error("[Preview] Unexpected error in getPreviewModeStatus:", error);
    return { isAdmin: false, previewEnabled: false };
  }
}
