import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GripVertical,
  Upload,
  Download,
  Share,
  Folder
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface QuestionBankProps {
  onBack: () => void;
}

interface Question {
  id: string;
  title: string;
  prompt: string;
  category: string;
  department?: string;
  usageCount: number;
  isShared: boolean;
  createdAt: Date;
}

const QuestionBank = ({ onBack }: QuestionBankProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    prompt: '',
    category: '',
    department: '',
    isShared: false
  });

  const questions: Question[] = [
    {
      id: '1',
      title: 'Customer Objection Analysis',
      prompt: 'What are the most common objections raised by customers and how are they being handled?',
      category: 'Sales',
      department: 'Sales Development',
      usageCount: 23,
      isShared: true,
      createdAt: new Date('2024-10-15')
    },
    {
      id: '2',
      title: 'Opening Phrase Effectiveness',
      prompt: 'Which opening phrases lead to the highest engagement and positive response rates?',
      category: 'Performance',
      department: 'All',
      usageCount: 18,
      isShared: true,
      createdAt: new Date('2024-10-10')
    },
    {
      id: '3',
      title: 'Pricing Handling Success',
      prompt: 'How often do agents successfully handle pricing questions without escalation?',
      category: 'Sales',
      department: 'Customer Care',
      usageCount: 15,
      isShared: false,
      createdAt: new Date('2024-10-05')
    },
    {
      id: '4',
      title: 'Sentiment Analysis',
      prompt: 'What sentiment patterns emerge throughout successful vs unsuccessful calls?',
      category: 'Quality',
      department: 'All',
      usageCount: 31,
      isShared: true,
      createdAt: new Date('2024-09-28')
    },
    {
      id: '5',
      title: 'Closing Technique Effectiveness',
      prompt: 'Which closing techniques are most effective at securing commitments?',
      category: 'Sales',
      department: 'Sales Development',
      usageCount: 12,
      isShared: false,
      createdAt: new Date('2024-09-20')
    }
  ];

  const categories = ['All', 'Sales', 'Performance', 'Quality', 'Retention', 'Training'];

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           question.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleCreateQuestion = () => {
    // TODO: Implement question creation
    console.log('Creating question:', newQuestion);
    setIsCreateDialogOpen(false);
    setNewQuestion({
      title: '',
      prompt: '',
      category: '',
      department: '',
      isShared: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="heading-display text-foreground">Question Bank</h1>
          <p className="text-muted-foreground">Manage your analysis questions and templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Question Title</Label>
                  <Input
                    id="title"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    placeholder="e.g., Customer Objection Analysis"
                  />
                </div>
                <div>
                  <Label htmlFor="prompt">Analysis Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={newQuestion.prompt}
                    onChange={(e) => setNewQuestion({ ...newQuestion, prompt: e.target.value })}
                    placeholder="Describe what you want to analyze..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                      placeholder="e.g., Sales, Quality"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newQuestion.department}
                      onChange={(e) => setNewQuestion({ ...newQuestion, department: e.target.value })}
                      placeholder="e.g., Sales Development"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isShared"
                    checked={newQuestion.isShared}
                    onChange={(e) => setNewQuestion({ ...newQuestion, isShared: e.target.checked })}
                  />
                  <Label htmlFor="isShared">Share with all admins</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateQuestion}>
                    Create Question
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category.toLowerCase() ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.toLowerCase())}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Share className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Shared</p>
                <p className="text-2xl font-bold">
                  {questions.filter(q => q.isShared).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(questions.map(q => q.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">
                  {questions.reduce((sum, q) => sum + q.usageCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{question.title}</h3>
                      <Badge variant="outline">{question.category}</Badge>
                      {question.isShared && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Share className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {question.prompt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Department: {question.department}</span>
                      <span>Used {question.usageCount} times</span>
                      <span>Created {question.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionBank;