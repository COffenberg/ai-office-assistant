
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDocumentProcessing = () => {
  const queryClient = useQueryClient();
  const [processingStatus, setProcessingStatus] = useState<{ [key: string]: string }>({});

  const processDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'processing' }));
      
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Processing failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('Processing failed:', data);
        throw new Error(data.error || 'Processing failed with unknown error');
      }

      return data;
    },
    onSuccess: (data, documentId) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'completed' }));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-chunks'] });
      
      const message = data.aiEnhanced 
        ? `Document processed with AI enhancement! Found ${data.contentLength} characters of content.`
        : `Document processed successfully! Found ${data.contentLength} characters of content.`;
      
      toast.success(message);
      
      if (data.hasRelevantContent) {
        toast.success('✅ Document contains relevant installation/email content!');
      }
    },
    onError: (error, documentId) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'error' }));
      console.error('Document processing error:', error);
      toast.error(`Failed to process document: ${error.message}`);
    },
  });

  const reprocessDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      console.log('Re-processing document:', documentId);
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'reprocessing' }));
      
      // First, clear existing chunks
      const { error: deleteError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (deleteError) {
        console.error('Error clearing old chunks:', deleteError);
        throw new Error('Failed to clear old document chunks');
      }

      // Reset document status
      const { error: resetError } = await supabase
        .from('documents')
        .update({ 
          processing_status: 'uploaded',
          content_summary: null,
          total_chunks: 0,
          ai_summary: null,
          keywords: null
        })
        .eq('id', documentId);

      if (resetError) {
        console.error('Error resetting document status:', resetError);
        throw new Error('Failed to reset document status');
      }

      // Process with updated logic
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Re-processing failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('Re-processing failed:', data);
        throw new Error(data.error || 'Re-processing failed with unknown error');
      }

      return data;
    },
    onSuccess: (data, documentId) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'completed' }));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-chunks'] });
      
      const message = `Document re-processed successfully! ${data.aiEnhanced ? 'AI enhanced. ' : ''}Content length: ${data.contentLength} characters`;
      toast.success(message);
      
      if (data.hasRelevantContent) {
        toast.success('✅ Document now contains relevant installation/email content!');
      } else {
        toast.warning('⚠️ Document processed but may not contain expected content');
      }
    },
    onError: (error, documentId) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'error' }));
      console.error('Document re-processing error:', error);
      toast.error(`Failed to re-process document: ${error.message}`);
    },
  });

  return {
    processDocument: processDocumentMutation.mutate,
    reprocessDocument: reprocessDocumentMutation.mutate,
    isProcessing: processDocumentMutation.isPending,
    isReprocessing: reprocessDocumentMutation.isPending,
    processingStatus,
  };
};
