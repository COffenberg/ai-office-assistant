"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  // Authenticate the user
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the 5 most recent queries from the user_searches table, including the answers
  const { data, error: searchError } = await supabase
    .from("user_searches")
    .select("query, answer, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (searchError) {
    return NextResponse.json({ error: searchError.message }, { status: 500 });
  }

  // Return full list of { query, answer } objects
  const recentSearches = data || [];

  return NextResponse.json({
    success: true,
    data: recentSearches,
  });
}
