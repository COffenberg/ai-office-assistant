
// Enhanced relevance scoring utility
export function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const contentLower = content.toLowerCase();
  
  let exactMatches = 0;
  let partialMatches = 0;
  let positionBonus = 0;
  
  queryWords.forEach(queryWord => {
    if (contentLower.includes(queryWord)) {
      exactMatches++;
      
      // Bonus for matches at the beginning of content
      const firstIndex = contentLower.indexOf(queryWord);
      if (firstIndex < 100) {
        positionBonus += 0.1;
      }
    } else {
      // Check for partial matches (stemming)
      const stem = queryWord.substring(0, Math.max(3, queryWord.length - 2));
      if (contentLower.includes(stem)) {
        partialMatches++;
      }
    }
  });
  
  // Calculate base score
  const exactScore = exactMatches / queryWords.length;
  const partialScore = partialMatches / queryWords.length * 0.3;
  
  // Add bonuses for specific patterns
  let patternBonus = 0;
  
  // Email detection bonus
  if (query.toLowerCase().includes('email') && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) {
    patternBonus += 0.3;
  }
  
  // Phone number detection bonus
  if (query.toLowerCase().includes('phone') && /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) {
    patternBonus += 0.3;
  }
  
  // Time/deadline detection bonus
  if ((query.toLowerCase().includes('when') || query.toLowerCase().includes('deadline') || query.toLowerCase().includes('within')) 
      && /\b\d+\s*(?:hours?|days?|weeks?|months?)\b/.test(content)) {
    patternBonus += 0.2;
  }
  
  const finalScore = Math.min(exactScore + partialScore + positionBonus + patternBonus, 1.0);
  
  return finalScore;
}

// Additional utility for content analysis
export function analyzeContentType(content: string): {
  hasEmail: boolean;
  hasPhone: boolean;
  hasDate: boolean;
  hasInstructions: boolean;
  contentType: 'procedural' | 'contact' | 'informational' | 'mixed';
} {
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content);
  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content);
  const hasDate = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}-\d{1,2}-\d{2,4}\b/.test(content);
  const hasInstructions = /\b(?:step|follow|procedure|process|instruction|guide)\b/i.test(content);
  
  let contentType: 'procedural' | 'contact' | 'informational' | 'mixed' = 'informational';
  
  if (hasEmail || hasPhone) {
    contentType = hasInstructions ? 'mixed' : 'contact';
  } else if (hasInstructions) {
    contentType = 'procedural';
  } else if (hasEmail && hasPhone && hasInstructions) {
    contentType = 'mixed';
  }
  
  return {
    hasEmail,
    hasPhone,
    hasDate,
    hasInstructions,
    contentType
  };
}
