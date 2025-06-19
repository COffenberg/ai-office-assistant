import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, MessageSquare, Upload, X, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

interface QAPair {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdDate: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { signOut, profile } = useAuth();
  
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Employee Handbook.pdf', type: 'PDF', uploadDate: '2024-01-15', size: '2.3 MB' },
    { id: '2', name: 'IT Security Policy.docx', type: 'DOCX', uploadDate: '2024-01-10', size: '1.8 MB' }
  ]);

  const [qaPairs, setQaPairs] = useState<QAPair[]>([
    { id: '1', question: 'What is our remote work policy?', answer: 'Employees can work remotely up to 3 days per week with manager approval.', category: 'HR', createdDate: '2024-01-12' },
    { id: '2', question: 'How do I reset my password?', answer: 'Contact IT support at support@company.com or call extension 1234.', category: 'IT', createdDate: '2024-01-08' }
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newDoc: Document = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          uploadDate: new Date().toISOString().split('T')[0],
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        };
        setDocuments(prev => [...prev, newDoc]);
      });
      toast.success("Document(s) uploaded successfully!");
    }
  };

  const handleAddQAPair = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please fill in both question and answer fields.");
      return;
    }

    const newQA: QAPair = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory.trim() || 'General',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setQaPairs(prev => [...prev, newQA]);
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('');
    toast.success("Q&A pair added successfully!");
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success("Document deleted successfully!");
  };

  const handleDeleteQAPair = (id: string) => {
    setQaPairs(prev => prev.filter(qa => qa.id !== id));
    toast.success("Q&A pair deleted successfully!");
  };

  const handleSignOut = async () => {
    await signOut();
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
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage documents and knowledge base</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{profile.full_name || profile.email}</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.role}
                  </Badge>
                </div>
              )}
              <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Q&A Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Documents</span>
                </CardTitle>
                <CardDescription>
                  Upload PDF, DOC, or DOCX files to add to the knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop files here
                    </span>
                    <span className="text-xs text-gray-500">
                      Supported formats: PDF, DOC, DOCX
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
                <CardDescription>
                  Manage your uploaded knowledge base documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <Badge variant="secondary">{doc.type}</Badge>
                            <span>{doc.size}</span>
                            <span>Uploaded: {doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa" className="space-y-6">
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
                <Button onClick={handleAddQAPair} className="w-full">
                  Add Q&A Pair
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
                <div className="space-y-4">
                  {qaPairs.map((qa) => (
                    <div key={qa.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{qa.category}</Badge>
                            <span className="text-xs text-gray-500">Added: {qa.createdDate}</span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{qa.question}</h4>
                          <p className="text-gray-700 text-sm">{qa.answer}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQAPair(qa.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
