
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  source_type?: 'document' | 'qa_pair' | 'ai_generated';
  source_id?: string;
  source_name?: string;
  timestamp: string;
  rating?: number;
}

export const useChatHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory = [], isLoading, error } = useQuery({
    queryKey: ['chat-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!user,
  });

  // Add chat message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (message: {
      question: string;
      answer: string;
      source_type?: 'document' | 'qa_pair' | 'ai_generated';
      source_id?: string;
      source_name?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          question: message.question,
          answer: message.answer,
          source_type: message.source_type,
          source_id: message.source_id,
          source_name: message.source_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', user?.id] });
    },
    onError: (error) => {
      console.error('Add chat message error:', error);
      toast.error('Failed to save chat message');
    },
  });

  // Rate answer mutation
  const rateAnswerMutation = useMutation({
    mutationFn: async ({ messageId, rating }: { messageId: string; rating: number }) => {
      const { data, error } = await supabase
        .from('chat_history')
        .update({ rating })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', user?.id] });
      toast.success('Rating saved successfully!');
    },
    onError: (error) => {
      console.error('Rate answer error:', error);
      toast.error('Failed to save rating');
    },
  });

  return {
    chatHistory,
    isLoading,
    error,
    addMessage: addMessageMutation.mutate,
    rateAnswer: rateAnswerMutation.mutate,
    isAddingMessage: addMessageMutation.isPending,
    isRating: rateAnswerMutation.isPending,
  };
};
