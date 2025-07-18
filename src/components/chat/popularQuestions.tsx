"use client";

import React, { useState } from "react";
import { CardContent } from "@/components/ui/card";

const loadPopular = async () => {
  try {
    const res = await fetch("/api/popular", { method: "GET" });

    const data = await res.json();
    if (res.ok) {
      return data.data;
    } else {
      console.error(`Error loading popular questions: ${data.error}`);
      return [];
    }
  } catch (err) {
    console.error("Failed to load popular questions:", err);
    return [];
  }
};

export default function PopularQuestions() {
  const [popularQuestions, setPopularQuestions] = useState<string[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingPopular(true);

      const popularData = await loadPopular();

      setPopularQuestions(popularData || []);
      setLoadingPopular(false);
    };

    fetchData();
  }, []);

  return (
    <CardContent className="space-y-3">
      {loadingPopular ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : popularQuestions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
          No popular questions available.
        </p>
      ) : (
        popularQuestions.map((question, index) => (
          <div
            key={index}
            className="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-all duration-200 bg-white/50 dark:bg-slate-800/50"
          >
            <p className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              {question}
            </p>
          </div>
        ))
      )}
    </CardContent>
  );
}
