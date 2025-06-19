
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import EmployeeDashboardHeader from "./dashboard/EmployeeDashboardHeader";
import QuestionInput from "./dashboard/QuestionInput";
import AnswerDisplay from "./dashboard/AnswerDisplay";
import SuggestedQuestions from "./dashboard/SuggestedQuestions";
import ChatHistory from "./dashboard/ChatHistory";

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
        // Set default suggestions if loading fails
        setSuggestedQuestions([
          "What is our remote work policy?",
          "How do I submit expense reports?",
          "What are the vacation day policies?",
          "How do I book a conference room?",
          "What is the password reset process?"
        ]);
      }
    };
    loadSuggestions();
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const handleAskQuestion = useCallback(async () => {
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
  }, [currentQuestion, generateAnswer, addMessage]);

  const handleRateAnswer = useCallback((messageId: string, rating: number) => {
    rateAnswer({ messageId, rating });
  }, [rateAnswer]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  }, [handleAskQuestion]);

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeDashboardHeader onBack={onBack} onLogout={handleLogout} />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <QuestionInput
          currentQuestion={currentQuestion}
          setCurrentQuestion={setCurrentQuestion}
          onAskQuestion={handleAskQuestion}
          onKeyPress={handleKeyPress}
          isLoading={isLoading}
        />

        <AnswerDisplay currentAnswer={currentAnswer} />

        <SuggestedQuestions
          suggestedQuestions={suggestedQuestions}
          onSelectQuestion={setCurrentQuestion}
          isLoading={isLoading}
        />

        <ChatHistory
          chatHistory={chatHistory}
          onRateAnswer={handleRateAnswer}
        />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
