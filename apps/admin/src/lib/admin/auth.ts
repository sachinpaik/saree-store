import { createClient } from "@/lib/supabase/client";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const password = formData.get("password") as string;
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  return { ok: true as const };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return { ok: true as const };
}

export async function changePassword(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const otp = (formData.get("otp") as string)?.trim();
  const newPassword = (formData.get("newPassword") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

  if (!otp || otp.length < 6) {
    return { error: "Enter the OTP sent to your email" };
  }
  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase();
  if (userError || !email) {
    return { error: "Unable to resolve signed-in user email" };
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });
  if (verifyError) {
    return { error: "Invalid or expired OTP" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function sendChangePasswordOtp(): Promise<{
  error?: string;
  success?: boolean;
  email?: string;
}> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase();
  if (userError || !email) {
    return { error: "Unable to resolve signed-in user email" };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true, email };
}

export async function sendLoginResetOtp(
  emailInput: string
): Promise<{ error?: string; success?: boolean; email?: string }> {
  const email = emailInput?.trim().toLowerCase();
  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true, email };
}

export async function resetPasswordWithLoginOtp(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("resetEmail") as string)?.trim()?.toLowerCase();
  const otp = (formData.get("resetOtp") as string)?.trim();
  const newPassword = (formData.get("resetNewPassword") as string)?.trim();
  const confirmPassword = (formData.get("resetConfirmPassword") as string)?.trim();

  if (!email) return { error: "Email is required" };
  if (!otp || otp.length < 6) return { error: "Enter the OTP sent to your email" };
  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match" };
  }

  const supabase = createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });
  if (verifyError) {
    return { error: "Invalid or expired OTP" };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { error: updateError.message };
  }
  return { success: true };
}
