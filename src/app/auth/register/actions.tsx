"use server";

import { createClient } from "@/utils/supabase/server";
import { RegisterState } from "@/types/authentication";

export async function register(formData: FormData): Promise<RegisterState> {
  const supabase = await createClient();

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    inviteCode: formData.get("code") as string,
  };

  // Confirm the email contains an "@" character
  if (!data.email.includes("@")) {
    return {
      success: false,
      message: "Your email must contain a '@' character",
    };
  }

  // Check for the invite code
  const { data: companyData, error: dbError } = await supabase
    .from("companies")
    .select("id")
    .eq("invite_code", data.inviteCode)
    .single();

  if (dbError) {
    return {
      success: false,
      message: "Invalid company code!",
    };
  }

  // Attempt the signup
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        company_id: companyData.id,
        role: "User",
      },
    },
  });

  // Handle any errors
  if (error) {
    return {
      success: false,
      message: "Failed to signup.",
    };
  }

  // Successful signup, return success
  return {
    success: true,
    message: "Signed up successfully!",
  };
}
