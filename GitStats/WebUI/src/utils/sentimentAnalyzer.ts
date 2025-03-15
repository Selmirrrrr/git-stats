/**
 * A simple sentiment analyzer for commit messages in English and French
 */

// Positive words commonly found in English commit messages
const POSITIVE_WORDS_EN = [
  'add', 'improve', 'enhance', 'optimize', 'fix', 'resolve', 'solved', 'support',
  'feature', 'clean', 'simplify', 'upgrade', 'refactor', 'better', 'faster', 
  'easier', 'simplified', 'nice', 'good', 'great', 'awesome', 'amazing', 
  'excellent', 'implement', 'success', 'successful', 'complete', 'completed',
  'done', 'finish', 'finished', 'working', 'works', 'perfect', 'updated'
];

// Positive words commonly found in French commit messages
const POSITIVE_WORDS_FR = [
  'ajouter', 'ajout', 'améliorer', 'amélioration', 'optimiser', 'optimisation', 'corriger', 
  'correction', 'réparer', 'réparation', 'résoudre', 'résolu', 'fonctionnalité', 'nettoyer',
  'nettoyage', 'simplifier', 'simplification', 'mettre à jour', 'mise à jour', 'mise à niveau',
  'refactoriser', 'refactorisation', 'meilleur', 'mieux', 'plus rapide', 'plus facile', 'simplifié',
  'bien', 'bon', 'super', 'génial', 'excellent', 'implémentation', 'implémenter', 'réussi', 'réussite',
  'complet', 'complété', 'terminé', 'fini', 'fonctionnel', 'fonctionne', 'parfait'
];

// Negative words commonly found in English commit messages
const NEGATIVE_WORDS_EN = [
  'bug', 'issue', 'error', 'fail', 'failed', 'failure', 'crash', 'fix', 'problem',
  'broken', 'breaking', 'critical', 'severe', 'bad', 'wrong', 'terrible', 'horrible',
  'nasty', 'ugly', 'hack', 'workaround', 'temporary', 'temp', 'revert', 'rollback',
  'emergency', 'hotfix', 'regression', 'disaster', 'wtf', 'corrupted', 'invalid'
];

// Negative words commonly found in French commit messages
const NEGATIVE_WORDS_FR = [
  'bogue', 'bug', 'problème', 'erreur', 'échec', 'échoué', 'plantage', 'planter', 'crash',
  'panne', 'cassé', 'casse', 'critique', 'grave', 'sévère', 'mauvais', 'incorrect', 'faux',
  'terrible', 'horrible', 'vilain', 'bidouille', 'contournement', 'temporaire', 'provisoire',
  'annuler', 'revenir', 'retour', 'urgence', 'urgent', 'régression', 'désastre', 'catastrophe',
  'corrompu', 'invalide', 'défaut', 'défectueux'
];

// Combined word lists for easier processing
const POSITIVE_WORDS = [...POSITIVE_WORDS_EN, ...POSITIVE_WORDS_FR];
const NEGATIVE_WORDS = [...NEGATIVE_WORDS_EN, ...NEGATIVE_WORDS_FR];

// Emoticons and emojis
const POSITIVE_EMOJIS = ['😀', '😊', '👍', '🎉', '✅', '🚀', '💯', '👏', '🙌', '💪', '✨'];
const NEGATIVE_EMOJIS = ['😞', '😢', '😡', '👎', '❌', '💔', '😱', '😰', '🤦', '🤮', '🔥'];

/**
 * Analyzes the sentiment of a commit message in English or French
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
    // For multi-word phrases in French (e.g., "mise à jour")
    if (word.includes(' ')) {
      const phraseCount = countOccurrences(lowerMessage, word);
      score += phraseCount;
      wordCount += phraseCount;
    } else {
      const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
      const matches = lowerMessage.match(regex);
      if (matches) {
        // Special cases with different weights
        if (word === 'fix' || word === 'corriger') {
          score += matches.length * 0.5; // Lower weight for "fix"/"corriger"
        } else {
          score += matches.length;
        }
        wordCount += matches.length;
      }
    }
  }
  
  // Count negative words
  for (const word of NEGATIVE_WORDS) {
    // For multi-word phrases in French
    if (word.includes(' ')) {
      const phraseCount = countOccurrences(lowerMessage, word);
      score -= phraseCount;
      wordCount += phraseCount;
    } else {
      const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
      const matches = lowerMessage.match(regex);
      if (matches) {
        // Special cases with different weights
        // English "fix" special case
        if (word === 'fix' && 
           !lowerMessage.includes('fixed') && 
           !lowerMessage.includes('fixing')) {
          score -= matches.length * 0.8; // Higher weight for negative "fix"
        } 
        // French "corriger" special case
        else if (word === 'corriger' && 
                !lowerMessage.includes('corrigé') && 
                !lowerMessage.includes('correction')) {
          score -= matches.length * 0.8; // Higher weight for negative "corriger"
        }
        else if (word !== 'fix' && word !== 'corriger') {
          score -= matches.length;
        }
        wordCount += matches.length;
      }
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
 * Count occurrences of a phrase in a text
 */
function countOccurrences(text: string, phrase: string): number {
  let count = 0;
  let pos = text.indexOf(phrase);
  
  while (pos !== -1) {
    count++;
    pos = text.indexOf(phrase, pos + 1);
  }
  
  return count;
}

/**
 * Escape special characters for use in regular expressions
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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