import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Volume2, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  type: 'text' | 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  attachedFile?: {
    type: 'document' | 'audio' | 'image';
    url: string;
    name: string;
  };
}

interface QuizData {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  totalQuestions: number;
}

interface QuizTakerProps {
  quizData: QuizData;
  onComplete: (answers: Record<string, string>) => void;
  onExit: () => void;
  savedAnswers?: Record<string, string>;
  isEditMode?: boolean;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ 
  quizData, 
  onComplete, 
  onExit,
  savedAnswers = {},
  isEditMode = false
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const question = quizData.questions[currentQuestion];

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = quizData.questions.length;

    if (answeredQuestions < totalQuestions) {
      toast({
        title: "Incomplete Quiz",
        description: `You've answered ${answeredQuestions} out of ${totalQuestions} questions. Some questions are still unanswered.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitted(true);
    onComplete(answers);
  };

  const renderAttachedFile = (file: QuizQuestion['attachedFile']) => {
    if (!file) return null;

    return (
      <div className="mt-4 p-3 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          {file.type === 'audio' && <Volume2 className="w-4 h-4" />}
          {file.type === 'image' && <ImageIcon className="w-4 h-4" />}
          {file.type === 'document' && <FileText className="w-4 h-4" />}
          <span className="text-sm font-medium">{file.name}</span>
        </div>
        {file.type === 'audio' && (
          <audio controls className="w-full">
            <source src={file.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
        {file.type === 'image' && (
          <img src={file.url} alt={file.name} className="max-w-full h-auto rounded" />
        )}
        {file.type === 'document' && (
          <Button variant="outline" size="sm" onClick={() => window.open(file.url, '_blank')}>
            View Document
          </Button>
        )}
      </div>
    );
  };

  const renderQuestionInput = () => {
    const questionId = question.id;
    const currentAnswer = answers[questionId] || '';

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup 
            value={currentAnswer} 
            onValueChange={(value) => handleAnswerChange(questionId, value)}
            className="mt-4"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup 
            value={currentAnswer} 
            onValueChange={(value) => handleAnswerChange(questionId, value)}
            className="mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'text':
      default:
        return (
          <Textarea
            placeholder="Enter your answer here..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            className="mt-4"
            rows={4}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isEditMode ? 'Save & Exit' : 'Exit Quiz'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quizData.title}</h1>
            {quizData.description && (
              <p className="text-muted-foreground">{quizData.description}</p>
            )}
          </div>
        </div>
        <Badge variant="outline">
          Question {currentQuestion + 1} of {quizData.questions.length}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
              {currentQuestion + 1}
            </span>
            Question {currentQuestion + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <p className="text-lg">{question.question}</p>
            
            {/* Attached File */}
            {renderAttachedFile(question.attachedFile)}
            
            {/* Question Input */}
            {renderQuestionInput()}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {Object.keys(answers).length} of {quizData.questions.length} answered
          </span>
        </div>

        {currentQuestion === quizData.questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={isSubmitted}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {isEditMode ? 'Save Answers' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};