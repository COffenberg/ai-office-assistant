import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useModules } from '@/hooks/useModules';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Volume2, 
  ImageIcon,
  Save,
  X
} from 'lucide-react';

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

interface QuizBuilderProps {
  moduleId: string;
  existingContent?: any[];
  onSave: () => void;
  onCancel: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ 
  moduleId, 
  existingContent = [], 
  onSave, 
  onCancel 
}) => {
  const { addContentToModule, updateContent } = useModules();
  const { toast } = useToast();
  
  // Check if we're editing an existing quiz
  const existingQuiz = existingContent.find(item => item.content_type === 'quiz');
  const isEditing = !!existingQuiz;
  
  const [quizTitle, setQuizTitle] = useState(existingQuiz?.content_data?.title || '');
  const [quizDescription, setQuizDescription] = useState(existingQuiz?.content_data?.description || '');
  const [questions, setQuestions] = useState<QuizQuestion[]>(existingQuiz?.content_data?.questions || []);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuizQuestion>>({
    type: 'text',
    question: '',
    correctAnswer: '',
    options: []
  });
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get available files from existing module content
  const availableFiles = existingContent.filter(item => 
    item.content_type === 'document' || 
    item.content_type === 'audio' || 
    (item.content_type === 'document' && ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(item.content_data?.fileType))
  );

  const addQuestion = () => {
    if (!currentQuestion.question) {
      toast({
        title: "Error",
        description: "Please fill in the question",
        variant: "destructive"
      });
      return;
    }

    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      type: currentQuestion.type as QuizQuestion['type'],
      question: currentQuestion.question,
      correctAnswer: currentQuestion.correctAnswer || '', // Allow empty correct answer
      options: currentQuestion.options || [],
      explanation: currentQuestion.explanation,
      attachedFile: currentQuestion.attachedFile
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'text',
      question: '',
      correctAnswer: '',
      options: []
    });
    setShowQuestionDialog(false);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const attachFileToQuestion = (fileId: string) => {
    const file = availableFiles.find(f => f.id === fileId);
    if (file) {
      const fileType = file.content_type === 'audio' ? 'audio' : 
                      file.content_data?.fileType?.startsWith('image/') ? 'image' : 'document';
      
      setCurrentQuestion({
        ...currentQuestion,
        attachedFile: {
          type: fileType,
          url: file.content_data?.url || '',
          name: file.content_data?.title || file.content_data?.fileName || 'Attached file'
        }
      });
    }
  };

  const addOptionToQuestion = () => {
    const options = currentQuestion.options || [];
    setCurrentQuestion({
      ...currentQuestion,
      options: [...options, '']
    });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(currentQuestion.options || [])];
    options[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options
    });
  };

  const removeOption = (index: number) => {
    const options = [...(currentQuestion.options || [])];
    options.splice(index, 1);
    setCurrentQuestion({
      ...currentQuestion,
      options
    });
  };

  const saveQuiz = async () => {
    if (!quizTitle || questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add a title and at least one question",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const quizData = {
        title: quizTitle,
        description: quizDescription,
        questions: questions,
        totalQuestions: questions.length,
        createdAt: existingQuiz?.content_data?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEditing && existingQuiz) {
        // Update existing quiz
        await updateContent(existingQuiz.id, {
          content_data: quizData
        });
        
        toast({
          title: "Success",
          description: "Quiz updated successfully",
        });
      } else {
        // Create new quiz
        await addContentToModule(moduleId, 'quiz', quizData, quizTitle);
        
        toast({
          title: "Success",
          description: "Quiz created successfully",
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error", 
        description: isEditing ? "Failed to update quiz" : "Failed to save quiz",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getFileIcon = (file: any) => {
    if (file.content_type === 'audio') return <Volume2 className="w-4 h-4" />;
    if (file.content_data?.fileType?.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Quiz' : 'Create Quiz'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Edit your quiz content and questions' : 'Create interactive quizzes with questions that can reference uploaded documents and audio files'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quiz Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz Title</Label>
            <Input
              id="quiz-title"
              placeholder="Enter quiz title..."
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-description">Description (Optional)</Label>
            <Textarea
              id="quiz-description"
              placeholder="Enter quiz description..."
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
            <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Question Type */}
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select 
                      value={currentQuestion.type} 
                      onValueChange={(value) => setCurrentQuestion({...currentQuestion, type: value as QuizQuestion['type']})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Answer</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="true-false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      placeholder="Enter your question..."
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                    />
                  </div>

                  {/* Attach File */}
                  {availableFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Attach File (Optional)</Label>
                      <Select onValueChange={attachFileToQuestion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a file to attach..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFiles.map((file) => (
                            <SelectItem key={file.id} value={file.id}>
                              <div className="flex items-center gap-2">
                                {getFileIcon(file)}
                                {file.content_data?.title || file.content_data?.fileName}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currentQuestion.attachedFile && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          {currentQuestion.attachedFile.type === 'audio' && <Volume2 className="w-4 h-4" />}
                          {currentQuestion.attachedFile.type === 'image' && <ImageIcon className="w-4 h-4" />}
                          {currentQuestion.attachedFile.type === 'document' && <FileText className="w-4 h-4" />}
                          <span className="text-sm">{currentQuestion.attachedFile.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setCurrentQuestion({...currentQuestion, attachedFile: undefined})}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {currentQuestion.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Answer Options</Label>
                        <Button variant="outline" size="sm" onClick={addOptionToQuestion}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                      {(currentQuestion.options || []).map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answer */}
                  <div className="space-y-2">
                    <Label>Correct Answer (Optional)</Label>
                    {currentQuestion.type === 'true-false' ? (
                      <Select 
                        value={currentQuestion.correctAnswer} 
                        onValueChange={(value) => setCurrentQuestion({...currentQuestion, correctAnswer: value})}
                      >
                        <SelectTrigger>
                        <SelectValue placeholder="Select correct answer (optional)..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : currentQuestion.type === 'multiple-choice' ? (
                      <Select 
                        value={currentQuestion.correctAnswer} 
                        onValueChange={(value) => setCurrentQuestion({...currentQuestion, correctAnswer: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer (optional)..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(currentQuestion.options || []).map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option || `Option ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter the correct answer (optional)..."
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                      />
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="space-y-2">
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      placeholder="Explain why this is the correct answer..."
                      value={currentQuestion.explanation || ''}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={addQuestion}>Add Question</Button>
                    <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Questions Display */}
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions added yet. Click "Add Question" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">Q{index + 1}</Badge>
                          <Badge variant="outline">{question.type}</Badge>
                          {question.attachedFile && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              {question.attachedFile.type === 'audio' && <Volume2 className="w-3 h-3" />}
                              {question.attachedFile.type === 'image' && <ImageIcon className="w-3 h-3" />}
                              {question.attachedFile.type === 'document' && <FileText className="w-3 h-3" />}
                              File attached
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium mb-2">{question.question}</p>
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="text-sm text-muted-foreground">
                            Options: {question.options.join(', ')}
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="font-medium">Answer:</span> {question.correctAnswer || 'Open-ended question'}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={saveQuiz} disabled={saving}>
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isEditing ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Quiz' : 'Save Quiz'}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};