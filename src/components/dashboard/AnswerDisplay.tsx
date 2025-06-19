
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface AnswerDisplayProps {
  currentAnswer: {
    answer: string;
    source?: string;
    sourceType?: string;
    sourceId?: string;
    searchResults?: any[];
  } | null;
}

const AnswerDisplay = ({ currentAnswer }: AnswerDisplayProps) => {
  if (!currentAnswer) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <span>Answer</span>
          {currentAnswer.sourceType === 'ai_generated' && currentAnswer.searchResults && (
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Enhanced Search
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{currentAnswer.answer}</p>
          {currentAnswer.source && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                Source: {currentAnswer.source}
              </Badge>
            </div>
          )}
          {/* Show related results if available */}
          {currentAnswer.searchResults && currentAnswer.searchResults.length > 1 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Related Information:</h4>
              <div className="space-y-2">
                {currentAnswer.searchResults.slice(1, 3).map((result, index) => (
                  <div key={index} className="text-xs bg-white p-2 rounded border">
                    <div className="font-medium text-gray-600">{result.source}</div>
                    <div className="text-gray-500 truncate">{result.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerDisplay;
