"use client";

import React, { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { ChatMessage } from "@/types/chat";

const loadRecent = async () => {
  try {
    const res = await fetch("/api/recent", { method: "GET" });

    const data = await res.json();
    if (res.ok) {
      return data.data;
    } else {
      console.error(`Error loading recent questions: ${data.error}`);
      return [];
    }
  } catch (err) {
    console.error("Failed to load recent questions:", err);
    return [];
  }
};

export default function RecentQuestions() {
  const [recentQuestions, setRecentQuestions] = useState<ChatMessage[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingRecent(true);

      const recentData = await loadRecent();

      setRecentQuestions(recentData || []);
      setLoadingRecent(false);
    };

    fetchData();
  }, []);

  return (
    <CardContent className="space-y-6">
      {loadingRecent ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
              <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : recentQuestions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
          No recent questions available.
        </p>
      ) : (
        recentQuestions.map((question, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border-2 border-white dark:border-slate-800 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {question.query}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {question.created_at}
                  </p>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-200 space-y-2">
                      <p>{question.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {index < recentQuestions.length - 1 && (
              <div className="border-b border-slate-200/60 dark:border-slate-700/60" />
            )}
          </div>
        ))
      )}
    </CardContent>
  );
}
