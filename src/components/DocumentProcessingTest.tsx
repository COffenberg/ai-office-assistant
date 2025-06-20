
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, FileText, Search, MessageSquare, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useDocumentChunks } from '@/hooks/useDocumentChunks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DocumentProcessingTest = () => {
  const { documents } = useDocuments();
  const { reprocessDocument, processingStatus } = useDocumentProcessing();
  const { searchKnowledgeBase, generateAnswer } = useKnowledgeBase();
  const { chunks } = useDocumentChunks();
  
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningFullTest, setIsRunningFullTest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('What email should the installation report be sent to?');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generatedAnswer, setGeneratedAnswer] = useState<string>('');
  const [showChunks, setShowChunks] = useState(false);
  const [chunkDetails, setChunkDetails] = useState<any[]>([]);

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);
  const documentChunks = chunks.filter(chunk => chunk.document_id === selectedDocId);

  const inspectDocumentChunks = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document first');
      return;
    }

    try {
      const { data: chunks, error } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', selectedDocId)
        .order('chunk_index');

      if (error) throw error;

      setChunkDetails(chunks || []);
      setShowChunks(true);
      
      console.log('Document chunks:', chunks);
      toast.success(`Found ${chunks?.length || 0} chunks for inspection`);
    } catch (error) {
      console.error('Error inspecting chunks:', error);
      toast.error('Failed to inspect document chunks');
    }
  };

  const clearDocumentChunks = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;

      // Reset document status
      const { error: resetError } = await supabase
        .from('documents')
        .update({ 
          processing_status: 'uploaded',
          content_summary: null,
          total_chunks: 0,
          ai_summary: null,
          keywords: null,
          processing_error: null
        })
        .eq('id', documentId);

      if (resetError) throw resetError;

      toast.success('Document chunks cleared successfully');
    } catch (error) {
      console.error('Error clearing chunks:', error);
      toast.error('Failed to clear document chunks');
    }
  };

  const runFullPipelineTest = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document first');
      return;
    }

    setIsRunningFullTest(true);
    setTestResults(null);
    setSearchResults([]);
    setGeneratedAnswer('');

    try {
      console.log('=== STARTING COMPREHENSIVE PIPELINE TEST ===');
      
      // Step 1: Clear existing chunks
      console.log('Step 1: Clearing existing chunks...');
      await clearDocumentChunks(selectedDocId);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Re-process document
      console.log('Step 2: Re-processing document with enhanced extraction...');
      reprocessDocument(selectedDocId);

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Inspect chunks
      console.log('Step 3: Inspecting processed chunks...');
      await inspectDocumentChunks();

      // Step 4: Test search
      console.log('Step 4: Testing search functionality...');
      const searchResults = await searchKnowledgeBase(searchQuery);
      setSearchResults(searchResults);
      console.log('Search results:', searchResults);

      // Step 5: Generate answer
      console.log('Step 5: Generating comprehensive answer...');
      const answerResult = await generateAnswer(searchQuery);
      setGeneratedAnswer(answerResult.answer);
      console.log('Generated answer:', answerResult.answer);

      // Step 6: Analyze results
      const hasRelevantResults = searchResults.some(result => 
        result.answer.toLowerCase().includes('tech@') || 
        result.answer.toLowerCase().includes('installation')
      );

      const answerContainsEmail = answerResult.answer.toLowerCase().includes('tech@vs-ai-assistant.com');
      const answerQuality = answerResult.answer.length > 50 && !answerResult.answer.includes("couldn't find");

      setTestResults({
        searchResultsCount: searchResults.length,
        hasRelevantResults,
        answerContainsEmail,
        answerQuality,
        chunksProcessed: chunkDetails.length,
        success: hasRelevantResults && answerContainsEmail && answerQuality,
        documentProcessed: true
      });

      console.log('=== COMPREHENSIVE PIPELINE TEST COMPLETE ===');

    } catch (error) {
      console.error('Comprehensive pipeline test error:', error);
      toast.error('Comprehensive pipeline test failed');
      setTestResults({ error: error.message });
    } finally {
      setIsRunningFullTest(false);
    }
  };

  const testSearch = async () => {
    try {
      console.log('Testing search with query:', searchQuery);
      const results = await searchKnowledgeBase(searchQuery);
      setSearchResults(results);
      console.log('Search results:', results);
      toast.success(`Found ${results.length} search results`);
    } catch (error) {
      console.error('Search test error:', error);
      toast.error('Search test failed');
    }
  };

  const testAnswerGeneration = async () => {
    try {
      console.log('Testing answer generation with query:', searchQuery);
      const result = await generateAnswer(searchQuery);
      setGeneratedAnswer(result.answer);
      console.log('Generated answer:', result.answer);
      toast.success('Answer generated successfully');
    } catch (error) {
      console.error('Answer generation test error:', error);
      toast.error('Answer generation test failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Enhanced Document Processing Debug Tools</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Document for Testing</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Choose a document...</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.file_type}) - {doc.processing_status}
                </option>
              ))}
            </select>
            
            {selectedDocument && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                <div><strong>File:</strong> {selectedDocument.name}</div>
                <div><strong>Type:</strong> {selectedDocument.file_type}</div>
                <div><strong>Size:</strong> {(selectedDocument.file_size / 1024).toFixed(1)} KB</div>
                <div><strong>Status:</strong> {selectedDocument.processing_status}</div>
                <div><strong>Chunks:</strong> {documentChunks.length}</div>
                {(selectedDocument as any).ai_summary && (
                  <div><strong>AI Summary:</strong> {(selectedDocument as any).ai_summary.substring(0, 100)}...</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => selectedDocId && clearDocumentChunks(selectedDocId)}
              disabled={!selectedDocId}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chunks
            </Button>
            
            <Button
              onClick={inspectDocumentChunks}
              disabled={!selectedDocId}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Inspect Chunks
            </Button>
            
            <Button
              onClick={() => selectedDocId && reprocessDocument(selectedDocId)}
              disabled={!selectedDocId || processingStatus[selectedDocId] === 'reprocessing'}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${processingStatus[selectedDocId] === 'reprocessing' ? 'animate-spin' : ''}`} />
              {processingStatus[selectedDocId] === 'reprocessing' ? 'Re-processing...' : 'Re-process'}
            </Button>
          </div>

          {/* Full Pipeline Test */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Comprehensive Pipeline Test</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Test Query</label>
                <Textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your test question..."
                  rows={2}
                />
              </div>
              
              <Button
                onClick={runFullPipelineTest}
                disabled={!selectedDocId || isRunningFullTest}
                className="w-full"
              >
                {isRunningFullTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Comprehensive Test...
                  </>
                ) : (
                  'Run Complete Pipeline Test'
                )}
              </Button>
            </div>
          </div>

          {/* Individual Tests */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Individual Component Tests</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={testSearch} variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Test Search Only
              </Button>
              
              <Button onClick={testAnswerGeneration} variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Test Answer Generation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chunk Inspection */}
      {showChunks && chunkDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Chunks Inspection ({chunkDetails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chunkDetails.map((chunk, index) => (
                <div key={chunk.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Chunk {chunk.chunk_index + 1}</Badge>
                    <span className="text-sm text-gray-500">{chunk.content.length} chars</span>
                  </div>
                  <div className="text-sm">
                    <strong>Content Preview:</strong>
                    <div className="mt-1 p-2 bg-white rounded border text-xs font-mono">
                      {chunk.content.substring(0, 300)}
                      {chunk.content.length > 300 && '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {testResults.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Comprehensive Test Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.error ? (
              <div className="text-red-600">Error: {testResults.error}</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <Badge variant={testResults.chunksProcessed > 0 ? "default" : "destructive"}>
                    Chunks Processed: {testResults.chunksProcessed || 0}
                  </Badge>
                  <Badge variant={testResults.searchResultsCount > 0 ? "default" : "destructive"}>
                    Search Results: {testResults.searchResultsCount}
                  </Badge>
                  <Badge variant={testResults.hasRelevantResults ? "default" : "destructive"}>
                    Relevant Results: {testResults.hasRelevantResults ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={testResults.answerContainsEmail ? "default" : "destructive"}>
                    Contains Email: {testResults.answerContainsEmail ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={testResults.answerQuality ? "default" : "destructive"}>
                    Answer Quality: {testResults.answerQuality ? 'Good' : 'Poor'}
                  </Badge>
                  <Badge variant={testResults.success ? "default" : "destructive"}>
                    Overall: {testResults.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{result.type}</Badge>
                    <span className="text-sm text-gray-500">Score: {result.relevanceScore?.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <strong>Source:</strong> {result.source}
                  </div>
                  <div className="text-sm mt-2">
                    <strong>Content:</strong> {result.answer?.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Answer */}
      {generatedAnswer && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-lg">
              {generatedAnswer}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentProcessingTest;
