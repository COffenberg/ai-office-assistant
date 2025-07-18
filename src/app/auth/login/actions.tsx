"use server";

import { createClient } from "@/utils/supabase/server";
import { LoginState } from "@/types/authentication";

export async function login(formData: FormData): Promise<LoginState> {
  // Create a new supbase server client
  const supabase = await createClient();

  // Get the email and password from formdata
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate username and password
  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required.",
    };
  }

  // Attempt login
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Handle login error
  if (error) {
    return {
      success: false,
      message: `Login failed: ${error.message}`,
    };
  }

  // Return a successful message
  return {
    success: true,
    message: "Login successful.",
  };
}
