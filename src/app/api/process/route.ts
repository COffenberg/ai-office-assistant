"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  // Authenticate the user
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Grab the file from the request
  const form = await req.formData();
  const file = form.get("file");

  // Validate the file input
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Grab the file name and type
  console.log("File name:", file.name);
  console.log("File type:", file.type);

  // Json response
  return NextResponse.json({
    success: true,
    message: "Document processing is not yet implemented.",
  });
}
