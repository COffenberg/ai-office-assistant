"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import openai from "@/utils/openai/client";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { question } = await req.json();

  // Check if request is from an authenticated user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate the question input
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  // Create the chat message in the database
  const { data, error: dbError } = await supabase
    .from("user_searches")
    .insert({
      query: question,
      status: "processing",
      answer: "",
      created_by: user.id,
      answer_type: "ai_generated",
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("Database error:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const questionId = data.id;

  // Start processing the question with openai's api
  try {
    // Call OpenAI to generate an answer
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      max_completion_tokens: 50, // Adjust as needed
      messages: [
        {
          role: "system",
          content:
            "You are an internal company assistant. Answer questions clearly and concisely using the company's knowledge base.",
        },
        { role: "user", content: question },
      ],
    });

    const answerContent =
      completion.choices[0].message.content || "No response";

    // Update the entry with the AI-generated answer
    await supabase
      .from("user_searches")
      .update({
        status: "answered",
        answer: answerContent,
      })
      .eq("id", questionId);

    return NextResponse.json({
      success: true,
      data: {
        id: questionId,
        status: "answered",
        answer: answerContent,
      },
    });
  } catch (err) {
    console.error("OpenAI error:", err);

    // Update status to failed if there was an error
    await supabase
      .from("user_searches")
      .update({
        success: false,
        data: {
          id: questionId,
          status: "error",
          answer: "AI generation failed",
        },
      })
      .eq("id", questionId);

    return NextResponse.json({
      error: "AI generation failed",
      status: 500,
    });
  }
}
