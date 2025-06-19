
// Enhanced relevance scoring utility
export function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const contentWords = content.toLowerCase();
  
  let exactMatches = 0;
  let partialMatches = 0;
  
  queryWords.forEach(queryWord => {
    if (contentWords.includes(queryWord)) {
      exactMatches++;
    } else if (contentWords.includes(queryWord.substring(0, queryWord.length - 1))) {
      partialMatches++;
    }
  });
  
  const exactScore = exactMatches / queryWords.length;
  const partialScore = partialMatches / queryWords.length * 0.5;
  
  return Math.min(exactScore + partialScore, 1.0);
}
