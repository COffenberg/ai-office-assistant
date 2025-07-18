
import { QAPair } from '@/hooks/useQAPairs';

export class SuggestedQuestionsService {
  static getSuggestedQuestions(qaPairs: QAPair[]): string[] {
    // Get popular questions from analytics and Q&A pairs
    const recentQA = qaPairs
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5)
      .map(qa => qa.question);

    return recentQA;
  }
}
