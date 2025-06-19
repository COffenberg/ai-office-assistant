
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

      if (error) throw error;
      return data;
    },
    onSuccess: (data, documentId) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'completed' }));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-chunks'] });
      
      toast.success(
        data.aiEnhanced 
          ? 'Document processed with AI enhancement!' 
          : 'Document processed successfully!'
      );
    },
    onError: (error, documentId) => {
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'error' }));
      console.error('Document processing error:', error);
      toast.error(`Failed to process document: ${error.message}`);
    },
  });

  return {
    processDocument: processDocumentMutation.mutate,
    isProcessing: processDocumentMutation.isPending,
    processingStatus,
  };
};
