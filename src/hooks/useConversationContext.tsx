
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    id: string;
    source: string;
    type: string;
  }>;
}

export interface ConversationContext {
  id: string;
  session_id: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

export const useConversationContext = (sessionId: string) => {
  const { user } = useAuth();
  const [context, setContext] = useState<ConversationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && sessionId) {
      loadContext();
    }
  }, [user, sessionId]);

  const loadContext = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_context')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setContext(data);
    } catch (error) {
      console.error('Error loading conversation context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (message: ConversationMessage) => {
    if (!user) return;

    try {
      const updatedMessages = context 
        ? [...context.messages, message]
        : [message];

      if (context) {
        // Update existing context
        const { data, error } = await supabase
          .from('conversation_context')
          .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
          })
          .eq('id', context.id)
          .select()
          .single();

        if (error) throw error;
        setContext(data);
      } else {
        // Create new context
        const { data, error } = await supabase
          .from('conversation_context')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            messages: updatedMessages,
          })
          .select()
          .single();

        if (error) throw error;
        setContext(data);
      }
    } catch (error) {
      console.error('Error adding message to context:', error);
    }
  };

  const clearContext = async () => {
    if (!context) return;

    try {
      await supabase
        .from('conversation_context')
        .delete()
        .eq('id', context.id);

      setContext(null);
    } catch (error) {
      console.error('Error clearing context:', error);
    }
  };

  return {
    context,
    isLoading,
    addMessage,
    clearContext,
    messages: context?.messages || [],
  };
};
