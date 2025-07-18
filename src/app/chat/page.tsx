"use server";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Clock, Sparkles, TrendingUp, LockIcon } from "lucide-react";
import { NextResponse } from "next/server";

import PopularQuestions from "@/components/chat/popularQuestions";
import RecentQuestions from "@/components/chat/recentQuestions";
import AskQuestion from "@/components/chat/askQuestion";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ChatPage() {
  // Ensure the user is authenticated
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get the number of conversations user has
  const { data: conversationData, error: dbError } = await supabase
    .from("user_searches")
    .select("id")
    .eq("created_by", data.user.id)
    .limit(10);

  if (dbError) {
    console.error("Error", dbError.code);

    return NextResponse.json({
      error: dbError.code,
      message:
        "Failed to load conversation data. Try to refresh or try again later.",
    });
  }

  // Get the user's company
  const companyId: string = data.user.user_metadata["company_id"];

  const { data: companyData, error: companyErr } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .single();

  // Handle invalid/unknown company
  if (companyErr) {
    return NextResponse.json({
      error: companyErr.code,
      message: "Failed to load company data. Try again later.",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-black dark:via-slate-950 dark:to-black">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    AI Assistant
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Welcome back, {data.user.email?.split("@")[0] || "User"}!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {data.user.user_metadata["role"]}
              </Badge>
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <LockIcon className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Ask a Question Section - Enhanced */}
        <AskQuestion companyName={companyData.name} />

        {/* Popular Questions Section - Enhanced */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Popular Questions
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Based on what others are asking
                </p>
              </div>
            </div>
          </CardHeader>
          <PopularQuestions />
        </Card>

        {/* Recent Questions & Answers Section - Enhanced */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Recent Questions & Answers
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Your previous interactions with the AI assistant
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0 px-3 py-1"
              >
                {conversationData.length} conversation(s)
              </Badge>
            </div>
          </CardHeader>
          <RecentQuestions />
        </Card>
      </div>
    </div>
  );
}
