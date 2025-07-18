
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, User, Star } from "lucide-react";

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  source_name?: string;
  rating?: number;
}

interface ChatHistoryProps {
  chatHistory: ChatMessage[];
  onRateAnswer: (messageId: string, rating: number) => void;
}

const ChatHistory = ({ chatHistory, onRateAnswer }: ChatHistoryProps) => {
  return (
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
                              onClick={() => onRateAnswer(chat.id, rating)}
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
  );
};

export default ChatHistory;
