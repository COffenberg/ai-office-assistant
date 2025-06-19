
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  usage_count: number;
}

export const useQAPairs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Q&A pairs
  const { data: qaPairs = [], isLoading, error } = useQuery({
    queryKey: ['qa-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_pairs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QAPair[];
    },
    enabled: !!user,
  });

  // Create Q&A pair mutation
  const createMutation = useMutation({
    mutationFn: async (newQA: { question: string; answer: string; category?: string; tags?: string[] }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('qa_pairs')
        .insert({
          question: newQA.question,
          answer: newQA.answer,
          category: newQA.category || 'General',
          tags: newQA.tags || [],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-pairs'] });
      toast.success('Q&A pair created successfully!');
    },
    onError: (error) => {
      console.error('Create Q&A error:', error);
      toast.error('Failed to create Q&A pair');
    },
  });

  // Update Q&A pair mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QAPair> }) => {
      const { data, error } = await supabase
        .from('qa_pairs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-pairs'] });
      toast.success('Q&A pair updated successfully!');
    },
    onError: (error) => {
      console.error('Update Q&A error:', error);
      toast.error('Failed to update Q&A pair');
    },
  });

  // Delete Q&A pair mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('qa_pairs')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-pairs'] });
      toast.success('Q&A pair deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete Q&A error:', error);
      toast.error('Failed to delete Q&A pair');
    },
  });

  // Search Q&A pairs
  const searchQAPairs = async (query: string): Promise<QAPair[]> => {
    const { data, error } = await supabase
      .from('qa_pairs')
      .select('*')
      .eq('is_active', true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%,category.ilike.%${query}%`)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data as QAPair[];
  };

  return {
    qaPairs,
    isLoading,
    error,
    createQAPair: createMutation.mutate,
    updateQAPair: updateMutation.mutate,
    deleteQAPair: deleteMutation.mutate,
    searchQAPairs,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
