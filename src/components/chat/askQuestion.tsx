"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "@/utils/supabase/client";

interface AskQuestionProps {
  companyName: string;
}

export default function AskQuestion({ companyName }: AskQuestionProps) {
  const [questionInput, setQuestionInput] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null); // <-- new state for AI answer

  const handleAsk = async (userInput: string) => {
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userInput }),
      });

      const data = await res.json();

      if (res.ok) {
        if (!data.success) {
          toast.error(
            data.data.answer ||
              "An error occurred while processing your question.",
          );
          return;
        }

        // Update state with answer instead of toast
        setAiAnswer(data.data.answer || "No answer returned.");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <>
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">
                Ask a question about <b>{companyName}</b>
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Get instant answers from your company's knowledge base
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Ask anything about company policies, procedures, or guidelines..."
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <Button
              onClick={() => handleAsk(questionInput)}
              className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              Ask
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Answer Section - Enhanced */}
      {aiAnswer && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/60 dark:border-green-800/60 shadow-lg shadow-green-200/20 dark:shadow-green-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-green-900 dark:text-green-100">
                AI Knowledge Base Results
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-green-800 dark:text-green-200 leading-relaxed">
                <strong>The AI has responded with the following:</strong>
              </p>
              <p className="text-green-700 dark:text-green-300 mt-3 whitespace-pre-wrap">
                {aiAnswer}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
