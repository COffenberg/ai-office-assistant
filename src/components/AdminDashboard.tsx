import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, MessageSquare, Upload, X, LogOut, User, Download, BarChart3, Brain, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { useQAPairs } from "@/hooks/useQAPairs";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import AdminAnalytics from "./AdminAnalytics";
import KnowledgeGapManager from "./KnowledgeGapManager";

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { signOut, profile } = useAuth();
  const { 
    documents, 
    isLoading: documentsLoading, 
    uploadProgress, 
    uploadDocument, 
    deleteDocument, 
    downloadDocument,
    isUploading,
    isDeleting 
  } = useDocuments();

  const { processDocument, processingStatus } = useDocumentProcessing();

  const {
    qaPairs,
    isLoading: qaPairsLoading,
    createQAPair,
    deleteQAPair,
    isCreating,
    isDeleting: isDeletingQA
  } = useQAPairs();

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        // Validate file type
        const allowedTypes = ['pdf', 'doc', 'docx'];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExt || !allowedTypes.includes(fileExt)) {
          toast.error(`File type not supported: ${file.name}. Please upload PDF, DOC, or DOCX files only.`);
          return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
          return;
        }

        uploadDocument(file);
      });
    }
    // Reset input
    event.target.value = '';
  };

  const handleProcessDocument = (documentId: string) => {
    processDocument(documentId);
  };

  const handleAddQAPair = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please fill in both question and answer fields.");
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

  const handleSignOut = async () => {
    await signOut();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
                <p className="text-sm text-gray-600">Manage documents, knowledge base, and analytics</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Q&A Management</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="gaps" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Knowledge Gaps</span>
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
                  Upload PDF, DOC, or DOCX files to add to the knowledge base (max 10MB per file)
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
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer flex flex-col items-center space-y-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {isUploading ? 'Uploading...' : 'Click to upload or drag and drop files here'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Supported formats: PDF, DOC, DOCX (max 10MB each)
                    </span>
                  </label>
                </div>

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{fileName}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
                <CardDescription>
                  Manage your uploaded knowledge base documents with AI processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No documents uploaded yet</div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <Badge variant="secondary">{doc.file_type}</Badge>
                              <span>{((doc.file_size) / 1024).toFixed(1)} KB</span>
                              <span>Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</span>
                              <Badge 
                                variant={doc.processing_status === 'processed' ? 'default' : 
                                       doc.processing_status === 'processing' ? 'secondary' : 
                                       doc.processing_status === 'error' ? 'destructive' : 'outline'}
                              >
                                {doc.processing_status}
                              </Badge>
                              {doc.ai_summary && (
                                <Badge variant="outline" className="text-xs">
                                  <Brain className="w-3 h-3 mr-1" />
                                  AI Enhanced
                                </Badge>
                              )}
                            </div>
                            {doc.ai_summary && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {doc.ai_summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.processing_status === 'uploaded' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessDocument(doc.id)}
                              disabled={processingStatus[doc.id] === 'processing'}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              {processingStatus[doc.id] === 'processing' ? 'Processing...' : 'Process'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadDocument(doc)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(doc)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isDeleting}
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
            <KnowledgeGapManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
