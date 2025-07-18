
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  content_vector?: string;
  page_number?: number;
  created_at: string;
}

export const useDocumentChunks = (documentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch document chunks
  const { data: chunks = [], isLoading, error } = useQuery({
    queryKey: ['document-chunks', documentId],
    queryFn: async () => {
      let query = supabase.from('document_chunks').select('*');
      
      if (documentId) {
        query = query.eq('document_id', documentId);
      }
      
      const { data, error } = await query.order('chunk_index');
      
      if (error) throw error;
      return data as DocumentChunk[];
    },
    enabled: !!user,
  });

  // Create document chunks mutation
  const createChunksMutation = useMutation({
    mutationFn: async (chunks: { 
      document_id: string; 
      content: string; 
      chunk_index: number;
      page_number?: number;
    }[]) => {
      const { data, error } = await supabase
        .from('document_chunks')
        .insert(chunks)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-chunks'] });
      toast.success('Document processed successfully!');
    },
    onError: (error) => {
      console.error('Process document error:', error);
      toast.error('Failed to process document');
    },
  });

  return {
    chunks,
    isLoading,
    error,
    createChunks: createChunksMutation.mutate,
    isCreating: createChunksMutation.isPending,
  };
};
