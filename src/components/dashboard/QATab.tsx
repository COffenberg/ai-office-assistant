
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface QATabProps {
  qaPairs: any[];
  qaPairsLoading: boolean;
  isCreating: boolean;
  isDeletingQA: boolean;
  createQAPair: (data: { question: string; answer: string; category: string }) => void;
  deleteQAPair: (id: string) => void;
}

const QATab = ({
  qaPairs,
  qaPairsLoading,
  isCreating,
  isDeletingQA,
  createQAPair,
  deleteQAPair
}: QATabProps) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleAddQAPair = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      return;
    }

    createQAPair({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory.trim() || 'General',
    });

    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('');
  };

  const handleDeleteQAPair = (id: string) => {
    deleteQAPair(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Add Q&A Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Q&A Pair</CardTitle>
          <CardDescription>
            Manually add questions and answers to the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Question
            </label>
            <Input
              placeholder="Enter the question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Answer
            </label>
            <Textarea
              placeholder="Enter the answer..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category (Optional)
            </label>
            <Input
              placeholder="e.g., HR, IT, General..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleAddQAPair} 
            className="w-full"
            disabled={isCreating}
          >
            {isCreating ? 'Adding...' : 'Add Q&A Pair'}
          </Button>
        </CardContent>
      </Card>

      {/* Q&A List */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Q&A ({qaPairs.length})</CardTitle>
          <CardDescription>
            Manage manually added questions and answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qaPairsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading Q&A pairs...</div>
          ) : qaPairs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No Q&A pairs added yet</div>
          ) : (
            <div className="space-y-4">
              {qaPairs.map((qa) => (
                <div key={qa.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{qa.category}</Badge>
                        <span className="text-xs text-gray-500">
                          Added: {formatDate(qa.created_at)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Used: {qa.usage_count} times
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{qa.question}</h4>
                      <p className="text-gray-700 text-sm">{qa.answer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQAPair(qa.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                      disabled={isDeletingQA}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QATab;
