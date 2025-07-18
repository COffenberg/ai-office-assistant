"use server";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const popularQuestions = [
    "What is the phone number for the support department?",
    "At what height should the motion sensor be mounted?",
    "Why must you contact the customer one day before the installation?",
    "Where should the primary control unit be installed?",
    "What should you do in the app before leaving the installation site?",
  ];

  return NextResponse.json({
    success: true,
    data: popularQuestions,
  });
}
