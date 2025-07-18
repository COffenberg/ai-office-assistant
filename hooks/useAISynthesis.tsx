
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchResult } from './useKnowledgeBase';
import { ConversationMessage } from './useConversationContext';

export const useAISynthesis = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAIAnswer = async (
    question: string,
    searchResults: SearchResult[],
    conversationHistory: ConversationMessage[] = []
  ): Promise<{
    answer: string;
    sources: Array<{ id: string; source: string; type: string }>;
    aiGenerated: boolean;
  }> => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-answer-synthesis', {
        body: {
          question,
          searchResults,
          conversationHistory,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('AI synthesis error:', error);
      // Fallback to regular search results
      return {
        answer: searchResults.length > 0 
          ? `Based on the available information:\n\n${searchResults[0].answer}`
          : "I couldn't find relevant information to answer your question.",
        sources: searchResults.map(r => ({
          id: r.id,
          source: r.source,
          type: r.type
        })),
        aiGenerated: false,
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAIAnswer,
    isGenerating,
  };
};
