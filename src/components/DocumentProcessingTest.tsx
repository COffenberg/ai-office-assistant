
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, FileText, Search, MessageSquare, RefreshCw } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DocumentProcessingTest = () => {
  const { documents } = useDocuments();
  const { reprocessDocument, processingStatus } = useDocumentProcessing();
  const { searchKnowledgeBase, generateAnswer } = useKnowledgeBase();
  
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningFullTest, setIsRunningFullTest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('What email should the installation report be sent to?');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generatedAnswer, setGeneratedAnswer] = useState<string>('');

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
      console.log('=== STARTING FULL PIPELINE TEST ===');
      
      // Step 1: Clear existing chunks
      console.log('Step 1: Clearing existing chunks...');
      await clearDocumentChunks(selectedDocId);

      // Step 2: Re-process document
      console.log('Step 2: Re-processing document...');
      reprocessDocument(selectedDocId);

      // Wait a bit for processing to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Test search
      console.log('Step 3: Testing search...');
      const searchResults = await searchKnowledgeBase(searchQuery);
      setSearchResults(searchResults);
      console.log('Search results:', searchResults);

      // Step 4: Generate answer
      console.log('Step 4: Generating answer...');
      const answerResult = await generateAnswer(searchQuery);
      setGeneratedAnswer(answerResult.answer);
      console.log('Generated answer:', answerResult.answer);

      // Step 5: Analyze results
      const hasRelevantResults = searchResults.some(result => 
        result.answer.toLowerCase().includes('tech@') || 
        result.answer.toLowerCase().includes('email')
      );

      const answerContainsEmail = answerResult.answer.toLowerCase().includes('tech@vs-ai-assistant.com');

      setTestResults({
        searchResultsCount: searchResults.length,
        hasRelevantResults,
        answerContainsEmail,
        success: hasRelevantResults && answerContainsEmail
      });

      console.log('=== FULL PIPELINE TEST COMPLETE ===');
      console.log('Results:', {
        searchResultsCount: searchResults.length,
        hasRelevantResults,
        answerContainsEmail
      });

    } catch (error) {
      console.error('Full pipeline test error:', error);
      toast.error('Full pipeline test failed');
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
            <span>Document Processing Debug Tools</span>
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
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => selectedDocId && clearDocumentChunks(selectedDocId)}
              disabled={!selectedDocId}
              variant="outline"
            >
              Clear Corrupted Chunks
            </Button>
            
            <Button
              onClick={() => selectedDocId && reprocessDocument(selectedDocId)}
              disabled={!selectedDocId || processingStatus[selectedDocId] === 'reprocessing'}
              variant="outline"
            >
              {processingStatus[selectedDocId] === 'reprocessing' ? 'Re-processing...' : 'Re-process with Updated Function'}
            </Button>
          </div>

          {/* Full Pipeline Test */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Full Pipeline Test</h3>
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
                    Running Full Pipeline Test...
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
              <span>Pipeline Test Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.error ? (
              <div className="text-red-600">Error: {testResults.error}</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={testResults.searchResultsCount > 0 ? "default" : "destructive"}>
                    Search Results: {testResults.searchResultsCount}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={testResults.hasRelevantResults ? "default" : "destructive"}>
                    Has Relevant Results: {testResults.hasRelevantResults ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={testResults.answerContainsEmail ? "default" : "destructive"}>
                    Answer Contains Email: {testResults.answerContainsEmail ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
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
