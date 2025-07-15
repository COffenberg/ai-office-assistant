// Enhanced question normalization with better pattern matching
export function normalizeQuestion(question: string): string {
  const questionLower = question.toLowerCase().trim();
  
  console.log('🔤 Normalizing question:', questionLower);
  
  // Customer contact patterns - expanded for better matching
  const customerContactPatterns = [
    /why\s+(?:must|should|do)\s+(?:you|we)\s+(?:call|contact)\s+(?:the\s+)?customer.*?(?:before|one\s+day)/i,
    /why\s+(?:call|contact)\s+customer.*?(?:before|day)/i,
    /customer.*?(?:call|contact).*?(?:before|day)/i,
    /(?:call|contact).*?customer.*?(?:before|one\s+day)/i
  ];
  
  for (const pattern of customerContactPatterns) {
    if (pattern.test(questionLower)) {
      console.log('✅ Matched customer contact pattern');
      return 'always call the customer 1 day before installation';
    }
  }
  
  // Control panel/unit installation patterns
  const controlPanelPatterns = [
    /where\s+(?:should|must)\s+(?:the\s+)?(?:primary\s+)?control\s+(?:panel|unit)\s+be\s+(?:installed|mounted)/i,
    /(?:primary\s+)?control\s+(?:panel|unit)\s+(?:installation|mounting)\s+(?:location|position)/i,
    /where.*?(?:install|mount).*?control\s+(?:panel|unit)/i
  ];
  
  for (const pattern of controlPanelPatterns) {
    if (pattern.test(questionLower)) {
      console.log('✅ Matched control panel installation pattern');
      return 'mount control panel installation location height';
    }
  }
  
  // App testing patterns
  const appTestingPatterns = [
    /what\s+(?:should|must)\s+(?:you|we)\s+do\s+in\s+(?:the\s+)?app\s+before\s+leaving/i,
    /app.*?(?:before|leaving).*?(?:site|installation)/i,
    /(?:test|check).*?app.*?before/i,
    /sensors?.*?app.*?before/i
  ];
  
  for (const pattern of appTestingPatterns) {
    if (pattern.test(questionLower)) {
      console.log('✅ Matched app testing pattern');
      return 'test sensors via app before leaving installation site';
    }
  }
  
  // Post-installation completion patterns
  const postInstallationPatterns = [
    /what\s+(?:must|should)\s+be\s+done\s+(?:with\s+)?(?:the\s+)?customer\s+after\s+installation/i,
    /after\s+installation.*?(?:customer|complete)/i,
    /installation.*?(?:complete|finished).*?customer/i,
    /(?:done|completed).*?customer.*?after/i
  ];
  
  for (const pattern of postInstallationPatterns) {
    if (pattern.test(questionLower)) {
      console.log('✅ Matched post-installation pattern');
      return 'what must be done with customer after installation complete';
    }
  }
  
  console.log('🔄 No specific pattern matched, returning normalized question');
  
  // General normalization - remove extra whitespace and punctuation
  return questionLower
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Test function for debugging
export function testNormalization() {
  const testQuestions = [
    "Why must you contact the customer one day before the installation?",
    "Where should the primary control unit be installed?",
    "What should you do in the app before leaving the installation site?",
    "What must be done with the customer after installation is complete?"
  ];
  
  console.log('🧪 Testing question normalization:');
  testQuestions.forEach((question, index) => {
    console.log(`\n${index + 1}. Original: "${question}"`);
    const normalized = normalizeQuestion(question);
    console.log(`   Normalized: "${normalized}"`);
  });
}