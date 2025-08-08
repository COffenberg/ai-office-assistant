
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";
import { Info, TrendingUp, FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { useQAPairs } from "@/hooks/useQAPairs";
import { useDocuments } from "@/hooks/useDocuments";
import { useChatHistory } from "@/hooks/useChatHistory";

// Helper functions
const isUnanswered = (answer?: string) => {
  if (!answer) return false;
  const a = answer.toLowerCase();
  return (
    a.includes("i don't know") ||
    a.includes("i do not know") ||
    a.includes("couldn't find") ||
    a.includes("could not find") ||
    a.includes("no information") ||
    a.includes("not sure")
  );
};

const toDayKey = (d: Date) => d.toISOString().slice(0, 10);
const startOfWeek = (d: Date) => {
  const nd = new Date(d);
  const day = nd.getUTCDay();
  const diff = (day + 6) % 7; // Monday-start week
  nd.setUTCDate(nd.getUTCDate() - diff);
  nd.setUTCHours(0, 0, 0, 0);
  return nd;
};

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#84CC16"];

const AdminAnalytics = () => {
  const { analytics } = useSearchAnalytics();
  const { qaPairs } = useQAPairs();
  const { documents } = useDocuments();
  const { chatHistory } = useChatHistory();

  // Controls
  const [unansweredGranularity, setUnansweredGranularity] = useState<"daily" | "weekly">("daily");
  const [unansweredLimit, setUnansweredLimit] = useState<5 | 20 | 9999>(5);
  const [askedLimit, setAskedLimit] = useState<5 | 20 | 9999>(5);
  const [topicsLimit, setTopicsLimit] = useState<5 | 20 | 9999>(5);
  const [citedDays, setCitedDays] = useState<number>(30);
  const [citedLimit, setCitedLimit] = useState<10 | 20 | 9999>(10);
  const [docsDays, setDocsDays] = useState<number>(30);

  // General Analytics
  const unansweredItems = useMemo(() => chatHistory.filter(m => isUnanswered(m.answer)), [chatHistory]);
  const unansweredCount = unansweredItems.length;
  const totalQuestions = chatHistory.length;
  const unansweredRate = totalQuestions > 0 ? (unansweredCount / totalQuestions) * 100 : 0;

  const topUnanswered = useMemo(() => {
    const map = new Map<string, number>();
    unansweredItems.forEach(m => map.set(m.question, (map.get(m.question) || 0) + 1));
    return Array.from(map.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count);
  }, [unansweredItems]);

  const unansweredOverTime = useMemo(() => {
    const bucket = new Map<string, { total: number; unans: number }>();
    chatHistory.forEach(m => {
      const date = new Date(m.timestamp);
      const key = unansweredGranularity === "daily" ? toDayKey(date) : toDayKey(startOfWeek(date));
      const rec = bucket.get(key) || { total: 0, unans: 0 };
      rec.total += 1;
      if (isUnanswered(m.answer)) rec.unans += 1;
      bucket.set(key, rec);
    });
    return Array.from(bucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, { total, unans }]) => ({ date, rate: total ? Math.round((unans / total) * 100) : 0 }));
  }, [chatHistory, unansweredGranularity]);

  // Knowledge Gap
  const topAskedQuestions = useMemo(() => {
    const map = new Map<string, { count: number; last: number }>();
    chatHistory.forEach(m => {
      const last = new Date(m.timestamp).getTime();
      const rec = map.get(m.question) || { count: 0, last };
      rec.count += 1;
      rec.last = Math.max(rec.last, last);
      map.set(m.question, rec);
    });
    return Array.from(map.entries())
      .map(([question, v]) => ({ question, count: v.count, last: v.last }))
      .sort((a, b) => b.count - a.count);
  }, [chatHistory]);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    // From documents keywords
    documents.forEach((d: any) => {
      (d.keywords || []).forEach((k: string) => counts.set(k, (counts.get(k) || 0) + 1));
    });
    // From Q&A tags
    qaPairs.forEach((q: any) => {
      (q.tags || []).forEach((t: string) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents, qaPairs]);

  const referencedDocIds = useMemo(() => {
    const set = new Set<string>();
    chatHistory.forEach(m => {
      if (m.source_type === "document" && m.source_id) set.add(m.source_id);
    });
    return set;
  }, [chatHistory]);

  const citedWindowStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - citedDays);
    return d.getTime();
  }, [citedDays]);

  const topCitedDocs = useMemo(() => {
    const counts = new Map<string, number>();
    chatHistory.forEach(m => {
      const t = new Date(m.timestamp).getTime();
      if (t >= citedWindowStart && m.source_type === "document" && m.source_id) {
        counts.set(m.source_id, (counts.get(m.source_id) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, count, name: documents.find((d: any) => d.id === id)?.name || "Unknown" }))
      .sort((a, b) => b.count - a.count);
  }, [chatHistory, citedWindowStart, documents]);

  // Answer Quality
  const ratingsFromChat = chatHistory.filter(m => typeof m.rating === "number") as any[];
  const upFromChat = ratingsFromChat.filter(r => (r.rating as number) >= 4).length;
  const downFromChat = ratingsFromChat.filter(r => (r.rating as number) <= 2).length;

  const ratingsFromSearch = analytics.filter(a => typeof a.satisfaction_rating === "number");
  const upFromSearch = ratingsFromSearch.filter(r => (r.satisfaction_rating as number) >= 4).length;
  const downFromSearch = ratingsFromSearch.filter(r => (r.satisfaction_rating as number) <= 2).length;

  const thumbsUp = upFromChat + upFromSearch;
  const thumbsDown = downFromChat + downFromSearch;

  const feedbackTrend = useMemo(() => {
    const bucket = new Map<string, { up: number; down: number }>();
    // chat
    ratingsFromChat.forEach(m => {
      const key = toDayKey(new Date(m.timestamp));
      const rec = bucket.get(key) || { up: 0, down: 0 };
      if ((m.rating as number) >= 4) rec.up += 1;
      if ((m.rating as number) <= 2) rec.down += 1;
      bucket.set(key, rec);
    });
    // search
    ratingsFromSearch.forEach(a => {
      const key = toDayKey(new Date(a.created_at as string));
      const rec = bucket.get(key) || { up: 0, down: 0 };
      if ((a.satisfaction_rating as number) >= 4) rec.up += 1;
      if ((a.satisfaction_rating as number) <= 2) rec.down += 1;
      bucket.set(key, rec);
    });
    return Array.from(bucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, { up, down }]) => ({ date, up, down }));
  }, [ratingsFromChat, ratingsFromSearch]);

  // Content Health
  const docsWindowStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - docsDays);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [docsDays]);

  const uploadsInWindow = useMemo(() => {
    return documents.filter((d: any) => new Date(d.upload_date || d.created_at).getTime() >= docsWindowStart);
  }, [documents, docsWindowStart]);

  const neverReferenced = useMemo(() => documents.filter((d: any) => !referencedDocIds.has(d.id)), [documents, referencedDocIds]);

  const olderThan6Months = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    const t = cutoff.getTime();
    return documents.filter((d: any) => new Date(d.updated_at || d.upload_date || d.created_at).getTime() < t);
  }, [documents]);

  const uploadsOverTime = useMemo(() => {
    const bucket = new Map<string, number>();
    documents.forEach((d: any) => {
      const key = toDayKey(new Date(d.upload_date || d.created_at));
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return Array.from(bucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [documents]);

  const referencedVsNever = useMemo(() => {
    const ref = referencedDocIds.size;
    const never = documents.length - ref;
    return [
      { name: "Referenced", value: Math.max(ref, 0) },
      { name: "Never Referenced", value: Math.max(never, 0) },
    ];
  }, [referencedDocIds, documents.length]);

  const oldestDocs = useMemo(() => {
    return [...documents]
      .sort((a: any, b: any) => new Date(a.updated_at || a.upload_date || a.created_at).getTime() - new Date(b.updated_at || b.upload_date || b.created_at).getTime())
      .slice(0, 10)
      .map((d: any) => ({ name: d.name, age: new Date(d.updated_at || d.upload_date || d.created_at).toLocaleDateString() }));
  }, [documents]);

  return (
    <div className="space-y-8">
      {/* Section 1: General Analytics */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">General Analytics</h2>
          <div className="flex items-center gap-2">
            <Select value={unansweredGranularity} onValueChange={(v: any) => setUnansweredGranularity(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Granularity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(unansweredLimit)} onValueChange={(v) => setUnansweredLimit(Number(v) as any)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Show" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="9999">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Unanswered count</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{unansweredCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Unanswered rate</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{unansweredRate.toFixed(1)}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Questions total</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalQuestions}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Unanswered Rate Over Time</CardTitle>
              <CardDescription>Percentage of questions without answers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={unansweredOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RTooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#6366F1" name="Unanswered %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Unanswered Questions</CardTitle>
              <CardDescription>Top items by unanswered frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topUnanswered.slice(0, unansweredLimit)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" tick={{ fontSize: 12 }} hide={false} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis />
                  <RTooltip />
                  <Bar dataKey="count" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 2: Knowledge Gap */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Knowledge Gap</h2>
          <div className="flex items-center gap-2">
            <Select value={String(askedLimit)} onValueChange={(v) => setAskedLimit(Number(v) as any)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Show" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="9999">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(topicsLimit)} onValueChange={(v) => setTopicsLimit(Number(v) as any)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Topics show" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="9999">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(citedDays)} onValueChange={(v) => setCitedDays(Number(v))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Days window" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(citedLimit)} onValueChange={(v) => setCitedLimit(Number(v) as any)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Docs show" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="9999">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Asked Questions</CardTitle>
              <CardDescription>Frequently asked by users</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-3">
                  {topAskedQuestions.slice(0, askedLimit).map((q) => (
                    <div key={q.question} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium line-clamp-2 mr-4">{q.question}</div>
                      <Badge variant="secondary">{q.count}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Topics</CardTitle>
              <CardDescription>Based on KB tags and document keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topics.slice(0, topicsLimit)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis />
                  <RTooltip />
                  <Bar dataKey="count" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Documents Cited in Answers</CardTitle>
              <CardDescription>Within the last {citedDays} days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topCitedDocs.slice(0, citedLimit)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis />
                  <RTooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Departments by Usage</CardTitle>
              <CardDescription>No department metadata available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Connect department tagging to enable this chart.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Answer Quality */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Answer Quality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Thumbs-up</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{thumbsUp}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Thumbs-down</CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{thumbsDown}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Flagged for human review</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Flagging not yet implemented</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thumbs-up vs Thumbs-down Trend</CardTitle>
              <CardDescription>Feedback over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={feedbackTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="up" stroke="#22C55E" name="Thumbs-up" />
                  <Line type="monotone" dataKey="down" stroke="#EF4444" name="Thumbs-down" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flagged Questions per Week</CardTitle>
              <CardDescription>No flagged questions yet</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[]}> 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <RTooltip />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: Content Health */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Content Health</h2>
          <div className="flex items-center gap-2">
            <Select value={String(docsDays)} onValueChange={(v) => setDocsDays(Number(v))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Days window" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Docs uploaded (last {docsDays}d)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{uploadsInWindow.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Never referenced</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{neverReferenced.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Older than 6 months</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{olderThan6Months.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total documents</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{documents.length}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Referenced vs Never Referenced</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={referencedVsNever} dataKey="value" nameKey="name" outerRadius={90}>
                    {referencedVsNever.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Docs Uploaded Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={uploadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RTooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366F1" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Top 10 Oldest Docs</CardTitle>
              <CardDescription>By upload/update date</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-2">
                  {oldestDocs.map((d) => (
                    <div key={d.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium line-clamp-1 mr-4">{d.name}</div>
                      <Badge variant="outline">{d.age}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
