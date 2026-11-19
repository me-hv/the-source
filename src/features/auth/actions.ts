"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLocalDataMode } from "@/lib/config/data-mode";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validation/auth";
import { ensureUserWorkspace } from "@/features/workspaces/service";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  requiresEmailVerification?: boolean;
}

export async function loginAction(data: LoginInput): Promise<AuthActionResult> {
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Local development mode handler
  if (isLocalDataMode()) {
    const cookieStore = await cookies();
    cookieStore.set("source_local_session", "active", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    redirect("/overview");
  }

  // Supabase remote / production handler
  const { email, password } = validation.data;
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (authData.user) {
    const displayName = authData.user.user_metadata?.display_name;
    try {
      await ensureUserWorkspace(
        supabase,
        authData.user.id,
        authData.user.email,
        displayName
      );
    } catch {
      // Non-fatal if DB trigger already handled it
    }
  }

  redirect("/overview");
}

export async function signupAction(data: SignupInput): Promise<AuthActionResult> {
  const validation = signupSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Local development mode handler
  if (isLocalDataMode()) {
    const cookieStore = await cookies();
    cookieStore.set("source_local_session", "active", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    redirect("/overview");
  }

  // Supabase remote / production handler
  const { email, password, displayName } = validation.data;
  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // If user session is created immediately (auto-confirm)
  if (authData.user && authData.session) {
    try {
      await ensureUserWorkspace(
        supabase,
        authData.user.id,
        authData.user.email,
        displayName
      );
    } catch {
      // Non-fatal
    }
    redirect("/overview");
  }

  // Email confirmation required
  return {
    success: true,
    requiresEmailVerification: true,
  };
}

export async function enterLocalStudioAction(): Promise<void> {
  if (!isLocalDataMode()) {
    throw new Error("Local studio entry is only available in local data mode.");
  }
  const cookieStore = await cookies();
  cookieStore.set("source_local_session", "active", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  redirect("/overview");
}

export async function logoutAction(): Promise<void> {
  if (isLocalDataMode()) {
    const cookieStore = await cookies();
    cookieStore.delete("source_local_session");
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
