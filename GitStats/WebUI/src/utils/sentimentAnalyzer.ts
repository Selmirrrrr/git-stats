/**
 * A simple sentiment analyzer for commit messages
 */

// Positive words commonly found in commit messages
const POSITIVE_WORDS = [
  'add', 'improve', 'enhance', 'optimize', 'fix', 'resolve', 'solved', 'support',
  'feature', 'clean', 'simplify', 'upgrade', 'refactor', 'better', 'faster', 
  'easier', 'simplified', 'nice', 'good', 'great', 'awesome', 'amazing', 
  'excellent', 'implement', 'success', 'successful', 'complete', 'completed',
  'done', 'finish', 'finished', 'working', 'works', 'perfect', 'updated'
];

// Negative words commonly found in commit messages
const NEGATIVE_WORDS = [
  'bug', 'issue', 'error', 'fail', 'failed', 'failure', 'crash', 'fix', 'problem',
  'broken', 'breaking', 'critical', 'severe', 'bad', 'wrong', 'terrible', 'horrible',
  'nasty', 'ugly', 'hack', 'workaround', 'temporary', 'temp', 'revert', 'rollback',
  'emergency', 'hotfix', 'regression', 'disaster', 'wtf', 'corrupted', 'invalid'
];

// Emoticons and emojis
const POSITIVE_EMOJIS = ['😀', '😊', '👍', '🎉', '✅', '🚀', '💯', '👏', '🙌', '💪', '✨'];
const NEGATIVE_EMOJIS = ['😞', '😢', '😡', '👎', '❌', '💔', '😱', '😰', '🤦', '🤮', '🔥'];

/**
 * Analyzes the sentiment of a commit message
 * 
 * @param message - The commit message to analyze
 * @returns A score between -1 (very negative) and 1 (very positive)
 */
export function analyzeSentiment(message: string): number {
  if (!message || message.trim() === '') return 0;
  
  const lowerMessage = message.toLowerCase();
  let score = 0;
  let wordCount = 0;
  
  // Count positive words
  for (const word of POSITIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerMessage.match(regex);
    if (matches) {
      // Special case: "fix" is both positive and negative
      // We consider it positive when in the context of "fixed" or "fixing"
      if (word === 'fix') {
        score += matches.length * 0.5; // Lower weight for "fix"
      } else {
        score += matches.length;
      }
      wordCount += matches.length;
    }
  }
  
  // Count negative words
  for (const word of NEGATIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerMessage.match(regex);
    if (matches) {
      // Special case: "fix" is both positive and negative
      // We consider it negative when not in the context of "fixed" or "fixing"
      if (word === 'fix' && !lowerMessage.includes('fixed') && !lowerMessage.includes('fixing')) {
        score -= matches.length * 0.8; // Higher weight for negative "fix"
      } else if (word !== 'fix') {
        score -= matches.length;
      }
      wordCount += matches.length;
    }
  }
  
  // Check for emojis
  for (const emoji of POSITIVE_EMOJIS) {
    const count = (message.match(new RegExp(emoji, 'g')) || []).length;
    score += count * 1.5; // Emojis have higher weight
    wordCount += count;
  }
  
  for (const emoji of NEGATIVE_EMOJIS) {
    const count = (message.match(new RegExp(emoji, 'g')) || []).length;
    score -= count * 1.5; // Emojis have higher weight
    wordCount += count;
  }
  
  // Normalize score to be between -1 and 1
  if (wordCount > 0) {
    return Math.max(-1, Math.min(1, score / wordCount));
  }
  
  return 0; // Neutral if no sentiment words found
}

/**
 * Categorizes a sentiment score
 * 
 * @param score - Sentiment score between -1 and 1
 * @returns A category string and color
 */
export function categorizeSentiment(score: number): { category: string; color: string } {
  if (score > 0.5) {
    return { category: 'Very Positive', color: 'rgb(34, 197, 94)' }; // green-500
  } else if (score > 0.1) {
    return { category: 'Positive', color: 'rgb(110, 231, 183)' }; // green-300
  } else if (score >= -0.1) {
    return { category: 'Neutral', color: 'rgb(148, 163, 184)' }; // slate-400
  } else if (score >= -0.5) {
    return { category: 'Negative', color: 'rgb(252, 165, 165)' }; // red-300
  } else {
    return { category: 'Very Negative', color: 'rgb(239, 68, 68)' }; // red-500
  }
}