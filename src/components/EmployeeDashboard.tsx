
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageSquare, Search, User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  source?: string;
}

interface EmployeeDashboardProps {
  onBack: () => void;
}

const EmployeeDashboard = ({ onBack }: EmployeeDashboardProps) => {
  const { signOut } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<{ answer: string; source?: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      question: 'What is our remote work policy?',
      answer: 'According to the Employee Handbook, employees can work remotely up to 3 days per week with manager approval. Remote work requests should be submitted at least 24 hours in advance.',
      timestamp: '2024-01-15 10:30 AM',
      source: 'Employee Handbook.pdf'
    },
    {
      id: '2',
      question: 'How do I reset my password?',
      answer: 'To reset your password, you can contact IT support at support@company.com or call extension 1234. You can also use the self-service portal at portal.company.com/reset.',
      timestamp: '2024-01-14 2:15 PM',
      source: 'IT Security Policy.docx'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

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

    // Simulate AI processing delay
    setTimeout(() => {
      const answer = generateMockAnswer(currentQuestion);
      const source = answer !== "Sorry, I couldn't find an answer based on the current material. Try rephrasing your question, and if this topic should be included, feel free to let your admin know." 
        ? getRandomSource() 
        : undefined;

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer,
        timestamp: new Date().toLocaleString(),
        source
      };

      setCurrentAnswer({ answer, source });
      setChatHistory(prev => [newMessage, ...prev]);
      setCurrentQuestion('');
      setIsLoading(false);
      toast.success("Answer generated successfully!");
    }, 1500);
  };

  const generateMockAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('vacation') || lowerQuestion.includes('time off') || lowerQuestion.includes('pto')) {
      return "According to our HR policy, full-time employees accrue 15 days of PTO annually, with the ability to carry over up to 5 days to the following year. Vacation requests should be submitted through the HR portal at least 2 weeks in advance.";
    } else if (lowerQuestion.includes('password') || lowerQuestion.includes('login') || lowerQuestion.includes('access')) {
      return "For password-related issues, contact IT support at support@company.com or call extension 1234. For immediate assistance, use the self-service portal at portal.company.com. Password requirements include 8+ characters with uppercase, lowercase, and special characters.";
    } else if (lowerQuestion.includes('expense') || lowerQuestion.includes('reimbursement')) {
      return "Expense reports should be submitted within 30 days of incurring the expense. Use the Expense Management System at expenses.company.com. All receipts must be attached for amounts over $25. Approval is required from your direct manager.";
    } else if (lowerQuestion.includes('meeting') || lowerQuestion.includes('conference room')) {
      return "Conference rooms can be booked through the Room Booking System accessible via the company intranet. Rooms are available from 7 AM to 7 PM on weekdays. For technical support during meetings, contact facilities at ext. 5678.";
    } else if (lowerQuestion.includes('remote') || lowerQuestion.includes('work from home')) {
      return "According to the Employee Handbook, employees can work remotely up to 3 days per week with manager approval. Remote work requests should be submitted at least 24 hours in advance.";
    } else {
      return "Sorry, I couldn't find an answer based on the current material. Try rephrasing your question, and if this topic should be included, feel free to let your admin know.";
    }
  };

  const getRandomSource = (): string => {
    const sources = [
      'Employee Handbook.pdf',
      'IT Security Policy.docx',
      'HR Policies.pdf',
      'Office Guidelines.docx',
      'Company FAQ'
    ];
    return sources[Math.floor(Math.random() * sources.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

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
              Get instant answers from your company's knowledge base
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
              <CardTitle className="text-lg">Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{currentAnswer.answer}</p>
                {currentAnswer.source && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">
                      Source: {currentAnswer.source}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Suggestions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "What is our remote work policy?",
                "How do I submit expense reports?",
                "What are the vacation day policies?",
                "How do I book a conference room?",
                "What is the password reset process?"
              ].map((suggestion, index) => (
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
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{chat.question}</p>
                        <p className="text-xs text-gray-500 mt-1">{chat.timestamp}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 ml-11">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounde-lg p-3 rounded-lg">
                        <p className="text-gray-800 text-sm leading-relaxed">{chat.answer}</p>
                        {chat.source && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Source: {chat.source}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
