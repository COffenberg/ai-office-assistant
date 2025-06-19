
export interface SearchResult {
  type: 'qa_pair' | 'document';
  id: string;
  question?: string;
  answer: string;
  source: string;
  category?: string;
  relevanceScore: number;
}

export interface EnhancedSearchResult {
  result_type: 'qa_pair' | 'document';
  result_id: string;
  title: string;
  content: string;
  source: string;
  relevance_score: number;
  context_match?: number;
}

export interface AnswerGenerationResult {
  answer: string;
  source?: string;
  sourceType?: 'qa_pair' | 'document' | 'ai_generated';
  sourceId?: string;
  searchResults?: SearchResult[];
  aiGenerated?: boolean;
}
