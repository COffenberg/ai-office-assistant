
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search } from "lucide-react";

interface QuestionInputProps {
  currentQuestion: string;
  setCurrentQuestion: (question: string) => void;
  onAskQuestion: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

const QuestionInput = ({ 
  currentQuestion, 
  setCurrentQuestion, 
  onAskQuestion, 
  onKeyPress, 
  isLoading 
}: QuestionInputProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Ask a Question</span>
        </CardTitle>
        <CardDescription>
          Get instant answers from your company's knowledge base including documents and Q&A pairs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          <Input
            placeholder="Ask anything about company policies, procedures, or guidelines..."
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={onKeyPress}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={onAskQuestion}
            disabled={isLoading || !currentQuestion.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Ask
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionInput;
