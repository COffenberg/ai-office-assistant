
import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useDocumentChunks } from '@/hooks/useDocumentChunks';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const DocumentProcessingTest = () => {
  const { documents } = useDocuments();
  const { reprocessDocument, isReprocessing, processingStatus } = useDocumentProcessing();
  const { generateAnswer } = useKnowledgeBase();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [testQuestion, setTestQuestion] = useState('What email should the installation report be sent to?');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingAnswer, setIsTestingAnswer] = useState(false);
  
  const { chunks } = useDocumentChunks(selectedDocumentId);

  const handleReprocessDocument = async () => {
    if (!selectedDocumentId) {
      toast.error('Please select a document first');
      return;
    }
    
    console.log('Starting document re-processing test');
    reprocessDocument(selectedDocumentId);
  };

  const handleTestAnswer = async () => {
    if (!testQuestion.trim()) {
      toast.error('Please enter a test question');
      return;
    }

    setIsTestingAnswer(true);
    setTestResult(null);
    
    try {
      console.log('Testing answer generation for:', testQuestion);
      const result = await generateAnswer(testQuestion);
      console.log('Answer generation result:', result);
      setTestResult(result);
      
      if (result.answer.includes('tech@vs-ai-assistant.com') || 
          result.answer.toLowerCase().includes('installation report')) {
        toast.success('Test passed! Found relevant content.');
      } else {
        toast.warning('Test may have issues - check the answer content.');
      }
    } catch (error) {
      console.error('Answer generation test failed:', error);
      toast.error('Answer generation test failed');
      setTestResult({ error: error.message });
    } finally {
      setIsTestingAnswer(false);
    }
  };

  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Processing Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Document to Test:</label>
            <select
              value={selectedDocumentId}
              onChange={(e) => setSelectedDocumentId(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">Choose a document...</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} - {doc.processing_status}
                </option>
              ))}
            </select>
          </div>

          {selectedDocument && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={selectedDocument.processing_status === 'processed' ? 'default' : 'secondary'}>
                  {selectedDocument.processing_status}
                </Badge>
                {processingStatus[selectedDocumentId] && (
                  <Badge variant="outline">{processingStatus[selectedDocumentId]}</Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p>File: {selectedDocument.name}</p>
                <p>Size: {(selectedDocument.file_size / 1024).toFixed(1)} KB</p>
                <p>Chunks: {selectedDocument.total_chunks || 0}</p>
                {selectedDocument.content_summary && (
                  <p>Summary: {selectedDocument.content_summary}</p>
                )}
              </div>

              <Button 
                onClick={handleReprocessDocument}
                disabled={isReprocessing}
                className="w-full"
              >
                {isReprocessing ? 'Re-processing...' : 'Re-process Document'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDocumentId && chunks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Chunks ({chunks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chunks.map((chunk, index) => (
                <div key={chunk.id} className="p-2 border rounded text-sm">
                  <div className="font-medium">Chunk {index + 1}:</div>
                  <div className="text-gray-600 truncate">{chunk.content.substring(0, 200)}...</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Answer Generation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Test Question:</label>
            <Input
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="Enter your test question..."
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleTestAnswer}
            disabled={isTestingAnswer}
            className="w-full"
          >
            {isTestingAnswer ? 'Generating Answer...' : 'Test Answer Generation'}
          </Button>

          {testResult && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Test Result:</div>
              <div className="p-3 border rounded bg-gray-50">
                {testResult.error ? (
                  <div className="text-red-600">Error: {testResult.error}</div>
                ) : (
                  <div>
                    <div className="font-medium">Answer:</div>
                    <div className="mt-1">{testResult.answer}</div>
                    {testResult.source && (
                      <div className="mt-2 text-sm text-gray-600">
                        Source: {testResult.source}
                      </div>
                    )}
                    {testResult.searchResults && testResult.searchResults.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Found {testResult.searchResults.length} search results
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentProcessingTest;
