
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { useKnowledgeGaps } from "@/hooks/useKnowledgeGaps";

const KnowledgeGapManager = () => {
  const { knowledgeGaps, isLoading } = useKnowledgeGaps();

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading knowledge gaps...</div>;
  }

  const openGaps = knowledgeGaps.filter(gap => gap.status === 'open');
  const addressedGaps = knowledgeGaps.filter(gap => gap.status === 'addressed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openGaps.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Addressed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{addressedGaps.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Frequent</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {openGaps.length > 0 ? Math.max(...openGaps.map(g => g.frequency)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Times searched
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Gaps List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Knowledge Gaps</span>
          </CardTitle>
          <CardDescription>
            Questions that users are searching for but don't have good answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {knowledgeGaps.map((gap) => (
                <div key={gap.id} className="flex items-start justify-between p-4 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{gap.search_query}</h4>
                      <Badge 
                        variant={gap.status === 'open' ? 'destructive' : gap.status === 'addressed' ? 'default' : 'secondary'}
                      >
                        {gap.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{gap.frequency} searches</span>
                      </span>
                      <span>Last searched: {new Date(gap.last_searched).toLocaleDateString()}</span>
                    </div>
                    {gap.suggested_action && (
                      <p className="text-sm text-blue-600 mt-2">
                        💡 {gap.suggested_action}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {gap.status === 'open' && (
                      <>
                        <Button variant="outline" size="sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Addressed
                        </Button>
                        <Button variant="ghost" size="sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Ignore
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {knowledgeGaps.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No knowledge gaps found! Your knowledge base seems comprehensive.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeGapManager;
