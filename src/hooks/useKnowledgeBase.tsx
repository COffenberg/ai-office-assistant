
import { useCallback } from 'react';
import { useQAPairs } from './useQAPairs';
import { useDocuments } from './useDocuments';
import { useSearchAnalytics } from './useSearchAnalytics';
import { useAISynthesis } from './useAISynthesis';
import { SearchResult, AnswerGenerationResult } from '@/types/knowledgeBase';
import { KnowledgeBaseSearchService } from '@/services/knowledgeBaseSearch';
import { AnswerGenerationService } from '@/services/answerGeneration';
import { SuggestedQuestionsService } from '@/services/suggestedQuestions';

export const useKnowledgeBase = () => {
  const { qaPairs } = useQAPairs();
  const { documents } = useDocuments();
  const { trackSearch } = useSearchAnalytics();
  const { generateAIAnswer } = useAISynthesis();

  const searchKnowledgeBase = useCallback(async (query: string, userContext?: any): Promise<SearchResult[]> => {
    const results = await KnowledgeBaseSearchService.searchEnhanced(query, userContext);
    
    // Track the search
    trackSearch({
      search_query: query,
      results_count: results?.length || 0,
    });

    return results;
  }, [trackSearch]);

  const generateAnswer = useCallback(async (
    question: string,
    conversationHistory: any[] = []
  ): Promise<AnswerGenerationResult> => {
    const answerService = new AnswerGenerationService(generateAIAnswer);
    return await answerService.generateAnswer(question, conversationHistory);
  }, [generateAIAnswer]);

  const getSuggestedQuestions = useCallback(async (): Promise<string[]> => {
    return SuggestedQuestionsService.getSuggestedQuestions(qaPairs);
  }, [qaPairs]);

  return {
    qaPairs,
    documents,
    searchKnowledgeBase,
    generateAnswer,
    getSuggestedQuestions,
  };
};

// Re-export types for backward compatibility
export type { SearchResult, AnswerGenerationResult as EnhancedSearchResult };
