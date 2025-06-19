
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Search, MessageSquare, FileText } from "lucide-react";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { useQAPairs } from "@/hooks/useQAPairs";
import { useDocuments } from "@/hooks/useDocuments";

const AdminAnalytics = () => {
  const { analytics } = useSearchAnalytics();
  const { qaPairs } = useQAPairs();
  const { documents } = useDocuments();

  // Process analytics data
  const searchVolume = analytics.length;
  const avgRating = analytics
    .filter(a => a.satisfaction_rating)
    .reduce((sum, a) => sum + (a.satisfaction_rating || 0), 0) / 
    analytics.filter(a => a.satisfaction_rating).length || 0;

  // Popular search terms
  const searchTerms = analytics.reduce((acc, curr) => {
    const term = curr.search_query.toLowerCase();
    acc[term] = (acc[term] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const popularSearches = Object.entries(searchTerms)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  // Usage by source type
  const sourceTypeData = analytics.reduce((acc, curr) => {
    if (curr.clicked_result_type) {
      acc[curr.clicked_result_type] = (acc[curr.clicked_result_type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(sourceTypeData).map(([type, count]) => ({
    name: type === 'qa_pair' ? 'Q&A Pairs' : 'Documents',
    value: count
  }));

  // Most used Q&A pairs
  const topQAPairs = qaPairs
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 5);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchVolume}</div>
            <p className="text-xs text-muted-foreground">
              All time searches
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Q&A Pairs</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaPairs.length}</div>
            <p className="text-xs text-muted-foreground">
              Active knowledge items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Uploaded documents
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Search Terms</CardTitle>
            <CardDescription>Most frequently searched queries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={popularSearches}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="term" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Source Usage</CardTitle>
            <CardDescription>Which sources users click on most</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Q&A Pairs */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Q&A Pairs</CardTitle>
          <CardDescription>Questions that employees find most helpful</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {topQAPairs.map((qa) => (
                <div key={qa.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{qa.question}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{qa.answer}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">{qa.category}</Badge>
                    </div>
                  </div>
                  <div className="ml-4 text-center">
                    <div className="text-lg font-bold text-blue-600">{qa.usage_count}</div>
                    <div className="text-xs text-gray-500">uses</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Search Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Search Activity</CardTitle>
          <CardDescription>Latest user searches and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {analytics.slice(0, 20).map((search) => (
                <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{search.search_query}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(search.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {search.results_count} results
                    </Badge>
                    {search.satisfaction_rating && (
                      <Badge variant="secondary" className="text-xs">
                        {search.satisfaction_rating}★
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
