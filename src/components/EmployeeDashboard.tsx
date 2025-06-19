
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageSquare, Search, User, LogOut, Star, Lightbulb, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

interface EmployeeDashboardProps {
  onBack: () => void;
}

const EmployeeDashboard = ({ onBack }: EmployeeDashboardProps) => {
  const { signOut } = useAuth();
  const { chatHistory, addMessage, rateAnswer } = useChatHistory();
  const { generateAnswer, getSuggestedQuestions } = useKnowledgeBase();
  
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<{ 
    answer: string; 
    source?: string;
    sourceType?: string;
    sourceId?: string;
    searchResults?: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Load suggested questions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await getSuggestedQuestions();
        setSuggestedQuestions(suggestions);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };
    loadSuggestions();
  }, [getSuggestedQuestions]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim()) {
      toast.error("Please enter a question.");
      return;
    }

    setIsLoading(true);
    setCurrentAnswer(null);

    try {
      // Use the enhanced knowledge base to generate an answer
      const result = await generateAnswer(currentQuestion);
      
      // Set the current answer for display
      setCurrentAnswer(result);

      // Save to chat history
      addMessage({
        question: currentQuestion,
        answer: result.answer,
        source_type: result.sourceType,
        source_id: result.sourceId,
        source_name: result.source,
      });

      setCurrentQuestion('');
      toast.success("Answer generated successfully!");
    } catch (error) {
      console.error('Error generating answer:', error);
      toast.error("Failed to generate answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateAnswer = (messageId: string, rating: number) => {
    rateAnswer({ messageId, rating });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const defaultSuggestions = [
    "What is our remote work policy?",
    "How do I submit expense reports?",
    "What are the vacation day policies?",
    "How do I book a conference room?",
    "What is the password reset process?"
  ];

  const displaySuggestions = suggestedQuestions.length > 0 ? suggestedQuestions : defaultSuggestions;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-600">Ask questions about company policies and procedures</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Question Input */}
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
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleAskQuestion}
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

        {/* Current Answer Display */}
        {currentAnswer && (
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
        )}

        {/* Smart Suggestions */}
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
                  onClick={() => setCurrentQuestion(suggestion)}
                  className="text-sm"
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Questions & Answers</span>
              <Badge variant="secondary">{chatHistory.length} conversations</Badge>
            </CardTitle>
            <CardDescription>
              Your previous interactions with the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No chat history yet. Ask your first question above!
                  </div>
                ) : (
                  chatHistory.map((chat) => (
                    <div key={chat.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{chat.question}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(chat.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 ml-11">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{chat.answer}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              {chat.source_name && (
                                <Badge variant="outline" className="text-xs">
                                  Source: {chat.source_name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => handleRateAnswer(chat.id, rating)}
                                  className={`w-4 h-4 ${
                                    chat.rating && chat.rating >= rating
                                      ? 'text-yellow-500'
                                      : 'text-gray-300 hover:text-yellow-400'
                                  }`}
                                >
                                  <Star className="w-full h-full fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
