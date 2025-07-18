
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface SuggestedQuestionsProps {
  suggestedQuestions: string[];
  onSelectQuestion: (question: string) => void;
  isLoading: boolean;
}

const SuggestedQuestions = ({ suggestedQuestions, onSelectQuestion, isLoading }: SuggestedQuestionsProps) => {
  const defaultSuggestions = [
    "What is our remote work policy?",
    "How do I submit expense reports?",
    "What are the vacation day policies?",
    "How do I book a conference room?",
    "What is the password reset process?"
  ];

  const displaySuggestions = suggestedQuestions.length > 0 ? suggestedQuestions : defaultSuggestions;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Lightbulb className="w-5 h-5" />
          <span>Popular Questions</span>
        </CardTitle>
        <CardDescription>
          {suggestedQuestions.length > 0 ? 'Based on what others are asking' : 'Try these common questions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {displaySuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSelectQuestion(suggestion)}
              className="text-sm"
              disabled={isLoading}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedQuestions;
