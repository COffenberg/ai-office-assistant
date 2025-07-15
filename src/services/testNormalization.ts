// Temporary test file to debug normalization
import { QuestionNormalizationService } from './questionNormalization';

export function testNormalization() {
  const testQuestions = [
    "How can I contact the support department by phone?",
    "What number should I call to reach support?",
    "Is there a phone number available for the support team?"
  ];
  
  console.log('🧪 TESTING NORMALIZATION:');
  testQuestions.forEach((question, index) => {
    console.log(`\n--- Test ${index + 1}: "${question}" ---`);
    const result = QuestionNormalizationService.normalizeQuestion(question);
    console.log('Result:', result);
  });
}

// Call it immediately for debugging
testNormalization();