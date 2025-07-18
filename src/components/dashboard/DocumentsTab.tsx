
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, X, Brain } from "lucide-react";
import { toast } from "sonner";

interface DocumentsTabProps {
  documents: any[];
  documentsLoading: boolean;
  uploadProgress: Record<string, number>;
  isUploading: boolean;
  isDeleting: boolean;
  processingStatus: Record<string, string>;
  uploadDocument: (file: File) => void;
  deleteDocument: (doc: any) => void;
  downloadDocument: (doc: any) => void;
  processDocument: (documentId: string) => void;
}

const DocumentsTab = ({
  documents,
  documentsLoading,
  uploadProgress,
  isUploading,
  isDeleting,
  processingStatus,
  uploadDocument,
  deleteDocument,
  downloadDocument,
  processDocument
}: DocumentsTabProps) => {
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

  return (
    <div className="space-y-6">
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
                        {(doc as any).ai_summary && (
                          <Badge variant="outline" className="text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            AI Enhanced
                          </Badge>
                        )}
                      </div>
                      {(doc as any).ai_summary && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {(doc as any).ai_summary}
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
    </div>
  );
};

export default DocumentsTab;
