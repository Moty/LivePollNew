/**
 * Content Filtering Utility
 * Provides profanity filtering and content moderation for user-generated content
 */

const logger = require('./logger');

// Profanity word list - common English profanity and offensive terms
// This list is intentionally limited but covers common cases
// For production, consider using a library like 'bad-words' or an API service
const PROFANITY_LIST = [
  // Common profanity (keeping this list relatively clean but functional)
  'fuck', 'shit', 'ass', 'damn', 'hell', 'bitch', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'asshole', 'bullshit', 'goddamn',
  'motherfucker', 'fucker', 'fucking', 'shitty', 'bitchy', 'dammit',
  'cunt', 'twat', 'wanker', 'bollocks', 'bugger', 'arse', 'arsehole',
  'feck', 'bloody', 'sodding', 'blimey', 'crikey'
];

// Slurs and hate speech - extremely offensive terms that should always be filtered
const SLURS_LIST = [
  // Racial slurs (abbreviated/partial to avoid full reproduction)
  'nigger', 'nigga', 'chink', 'spic', 'wetback', 'beaner', 'gook',
  'kike', 'hymie', 'jap', 'cracker', 'honky', 'gringo', 'paki',
  'raghead', 'towelhead', 'camel jockey', 'sand nigger',
  // Homophobic slurs
  'fag', 'faggot', 'dyke', 'homo', 'queer', 'tranny',
  // Other hate terms
  'retard', 'retarded', 'spaz', 'spastic', 'cripple',
  'nazi', 'fascist'
];

// Sexual/adult content terms
const SEXUAL_CONTENT_LIST = [
  'porn', 'xxx', 'sex', 'nude', 'naked', 'boobs', 'tits', 'penis',
  'vagina', 'orgasm', 'masturbate', 'dildo', 'vibrator', 'blowjob',
  'handjob', 'anal', 'oral', 'fetish', 'bdsm', 'bondage'
];

// Spam/scam indicators
const SPAM_INDICATORS = [
  'buy now', 'click here', 'free money', 'make money fast', 'work from home',
  'limited time', 'act now', 'bitcoin', 'crypto', 'investment opportunity',
  'nigerian prince', 'lottery winner', 'you won', 'congratulations',
  'viagra', 'cialis', 'pills', 'weight loss', 'diet pills'
];

// Common leetspeak substitutions for bypassing filters
const LEETSPEAK_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
  '+': 't'
};

/**
 * Normalize text by converting leetspeak and removing special characters
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  let normalized = text.toLowerCase();

  // Convert leetspeak
  for (const [leet, normal] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(normal);
  }

  // Remove repeated characters (e.g., "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

  // Remove spaces and special chars between letters (e.g., "f.u.c.k" -> "fuck")
  normalized = normalized.replace(/[^a-z]/g, '');

  return normalized;
};

/**
 * Check if text contains any word from a list
 */
const containsWord = (text, wordList) => {
  const normalized = normalizeText(text);
  const words = text.toLowerCase().split(/\s+/);

  for (const badWord of wordList) {
    // Check normalized version for obfuscation bypass
    if (normalized.includes(badWord.replace(/\s+/g, ''))) {
      return { found: true, word: badWord };
    }

    // Check individual words
    for (const word of words) {
      const normalizedWord = normalizeText(word);
      if (normalizedWord === badWord || normalizedWord.includes(badWord)) {
        return { found: true, word: badWord };
      }
    }
  }

  return { found: false };
};

/**
 * Filter severity levels
 */
const FilterLevel = {
  STRICT: 'strict',     // Block profanity, slurs, sexual content, spam
  MODERATE: 'moderate', // Block slurs, sexual content, spam (allow mild profanity)
  MINIMAL: 'minimal',   // Block only slurs and hate speech
  NONE: 'none'          // No filtering
};

/**
 * Content filter class
 */
class ContentFilter {
  constructor(options = {}) {
    this.level = options.level || FilterLevel.STRICT;
    this.customBlockList = options.customBlockList || [];
    this.customAllowList = options.customAllowList || [];
    this.logBlocked = options.logBlocked !== false;
  }

  /**
   * Get word lists based on filter level
   */
  getWordLists() {
    switch (this.level) {
      case FilterLevel.STRICT:
        return [...PROFANITY_LIST, ...SLURS_LIST, ...SEXUAL_CONTENT_LIST, ...this.customBlockList];
      case FilterLevel.MODERATE:
        return [...SLURS_LIST, ...SEXUAL_CONTENT_LIST, ...this.customBlockList];
      case FilterLevel.MINIMAL:
        return [...SLURS_LIST, ...this.customBlockList];
      case FilterLevel.NONE:
        return this.customBlockList;
      default:
        return [...PROFANITY_LIST, ...SLURS_LIST, ...SEXUAL_CONTENT_LIST, ...this.customBlockList];
    }
  }

  /**
   * Check if text is appropriate
   * @param {string} text - Text to check
   * @returns {Object} - { appropriate: boolean, reason?: string }
   */
  isAppropriate(text) {
    if (!text || typeof text !== 'string') {
      return { appropriate: true };
    }

    // Check custom allow list first
    const normalizedText = text.toLowerCase().trim();
    if (this.customAllowList.some(word => normalizedText === word.toLowerCase())) {
      return { appropriate: true };
    }

    // Check for blocked words
    const wordLists = this.getWordLists();
    const result = containsWord(text, wordLists);

    if (result.found) {
      if (this.logBlocked) {
        logger.debug('Content blocked by filter', {
          textLength: text.length,
          reason: 'inappropriate_word'
        });
      }
      return {
        appropriate: false,
        reason: 'inappropriate_content'
      };
    }

    // Check for spam (only in strict mode)
    if (this.level === FilterLevel.STRICT) {
      const spamResult = containsWord(text, SPAM_INDICATORS);
      if (spamResult.found) {
        return {
          appropriate: false,
          reason: 'spam_detected'
        };
      }
    }

    return { appropriate: true };
  }

  /**
   * Filter/censor inappropriate content
   * @param {string} text - Text to filter
   * @param {string} replacement - Character to use for censoring (default: '*')
   * @returns {string} - Filtered text
   */
  filter(text, replacement = '*') {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let filtered = text;
    const wordLists = this.getWordLists();

    for (const badWord of wordLists) {
      // Create regex that matches word boundaries
      const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
      filtered = filtered.replace(regex, replacement.repeat(badWord.length));
    }

    return filtered;
  }

  /**
   * Validate and potentially clean user input
   * @param {string} text - Text to validate
   * @param {Object} options - Options
   * @returns {Object} - { valid: boolean, cleaned?: string, error?: string }
   */
  validate(text, options = {}) {
    const { maxLength = 500, minLength = 1, allowEmpty = false } = options;

    // Check empty
    if (!text || text.trim().length === 0) {
      if (allowEmpty) {
        return { valid: true, cleaned: '' };
      }
      return { valid: false, error: 'Text cannot be empty' };
    }

    // Check length
    const trimmed = text.trim();
    if (trimmed.length < minLength) {
      return { valid: false, error: `Text must be at least ${minLength} characters` };
    }
    if (trimmed.length > maxLength) {
      return { valid: false, error: `Text cannot exceed ${maxLength} characters` };
    }

    // Check appropriateness
    const appropriateCheck = this.isAppropriate(trimmed);
    if (!appropriateCheck.appropriate) {
      return {
        valid: false,
        error: 'Your submission contains inappropriate content'
      };
    }

    return { valid: true, cleaned: trimmed };
  }
}

// Default filter instance (strict mode)
const defaultFilter = new ContentFilter({ level: FilterLevel.STRICT });

// Export convenience functions using default filter
module.exports = {
  ContentFilter,
  FilterLevel,

  // Default filter methods
  isAppropriate: (text) => defaultFilter.isAppropriate(text),
  filter: (text, replacement) => defaultFilter.filter(text, replacement),
  validate: (text, options) => defaultFilter.validate(text, options),

  // Word lists for external use (e.g., frontend)
  getProfanityList: () => [...PROFANITY_LIST],
  getSlursList: () => [...SLURS_LIST],

  // Create custom filter
  createFilter: (options) => new ContentFilter(options)
};
