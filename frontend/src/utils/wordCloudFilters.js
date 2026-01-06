/**
 * Word Cloud Filtering Utilities
 *
 * This module provides functions for filtering inappropriate words and handling
 * customization of word clouds
 */

// Profanity word list - common English profanity
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'damn', 'hell', 'bitch', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'asshole', 'bullshit', 'goddamn',
  'motherfucker', 'fucker', 'fucking', 'shitty', 'bitchy', 'dammit',
  'cunt', 'twat', 'wanker', 'bollocks', 'bugger', 'arse', 'arsehole'
];

// Slurs and hate speech
const SLURS_LIST = [
  'nigger', 'nigga', 'chink', 'spic', 'wetback', 'beaner', 'gook',
  'kike', 'jap', 'cracker', 'honky', 'paki', 'raghead', 'towelhead',
  'fag', 'faggot', 'dyke', 'homo', 'tranny',
  'retard', 'retarded', 'spaz', 'spastic'
];

// Sexual content terms
const SEXUAL_CONTENT_LIST = [
  'porn', 'xxx', 'sex', 'nude', 'naked', 'boobs', 'tits', 'penis',
  'vagina', 'orgasm', 'masturbate', 'dildo', 'blowjob', 'handjob'
];

// Combined default inappropriate words list
const DEFAULT_INAPPROPRIATE_WORDS = [
  ...PROFANITY_LIST,
  ...SLURS_LIST,
  ...SEXUAL_CONTENT_LIST
];

// Common filler words to optionally filter
const FILLER_WORDS = [
  'the', 'and', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'with',
  'by', 'at', 'from', 'but', 'or', 'as', 'if', 'so', 'than',
  'this', 'that', 'these', 'those', 'it', 'its', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'just', 'very', 'really', 'also', 'only', 'even', 'still'
];

// Leetspeak substitutions
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
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  let normalized = text.toLowerCase();

  // Convert leetspeak
  for (const [leet, normal] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(normal);
  }

  // Remove repeated characters
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

  // Remove non-alphanumeric
  normalized = normalized.replace(/[^a-z]/g, '');

  return normalized;
};

/**
 * Check if a word is inappropriate based on the provided filter list
 * @param {string} word - Word to check
 * @param {Array} filterList - List of words to filter against
 * @returns {boolean} - True if the word is inappropriate, false otherwise
 */
export const isInappropriateWord = (word, filterList = DEFAULT_INAPPROPRIATE_WORDS) => {
  if (!word || typeof word !== 'string') return false;

  const normalizedWord = normalizeText(word);
  const originalLower = word.toLowerCase().trim();

  return filterList.some(filterWord => {
    const normalizedFilter = filterWord.toLowerCase();
    // Check exact match
    if (originalLower === normalizedFilter) return true;
    // Check normalized (catches leetspeak)
    if (normalizedWord === normalizedFilter.replace(/[^a-z]/g, '')) return true;
    // Check contains
    if (normalizedWord.includes(normalizedFilter.replace(/[^a-z]/g, ''))) return true;
    return false;
  });
};

/**
 * Filter out inappropriate words from an array of word objects
 * @param {Array} words - Array of word objects with text property
 * @param {Array} customFilterList - Custom list of words to filter
 * @param {boolean} includeDefaultFilters - Whether to include default filters
 * @param {boolean} filterFillerWords - Whether to filter common filler words
 * @returns {Array} - Filtered array of word objects
 */
export const filterInappropriateWords = (
  words,
  customFilterList = [],
  includeDefaultFilters = true,
  filterFillerWords = false
) => {
  const filterList = [
    ...(includeDefaultFilters ? DEFAULT_INAPPROPRIATE_WORDS : []),
    ...customFilterList,
    ...(filterFillerWords ? FILLER_WORDS : [])
  ];

  return words.filter(word => {
    const text = typeof word === 'string' ? word : word.text;
    return !isInappropriateWord(text, filterList);
  });
};

/**
 * Check if a word contains inappropriate content before submission
 * @param {string} word - Word to check
 * @param {Array} customFilterList - Custom list of words to filter
 * @param {boolean} includeDefaultFilters - Whether to include default filters
 * @returns {boolean} - True if the word is appropriate, false otherwise
 */
export const isAppropriateWordForSubmission = (
  word,
  customFilterList = [],
  includeDefaultFilters = true
) => {
  const filterList = [
    ...(includeDefaultFilters ? DEFAULT_INAPPROPRIATE_WORDS : []),
    ...customFilterList
  ];

  return !isInappropriateWord(word, filterList);
};

/**
 * Get a friendly message explaining why a word was rejected
 * @param {string} word - The rejected word
 * @returns {string} - User-friendly rejection message
 */
export const getInappropriateWordMessage = (word) => {
  return "Sorry, that word can't be included in the word cloud. Please try a different word.";
};

/**
 * Censor inappropriate words in text
 * @param {string} text - Text to censor
 * @param {string} replacement - Character to use for censoring
 * @returns {string} - Censored text
 */
export const censorText = (text, replacement = '*') => {
  if (!text || typeof text !== 'string') return text;

  let censored = text;
  DEFAULT_INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, replacement.repeat(word.length));
  });

  return censored;
};

/**
 * Validate a word for word cloud submission
 * @param {string} word - Word to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateWordSubmission = (word, options = {}) => {
  const {
    maxLength = 50,
    minLength = 1,
    customFilterList = [],
    includeDefaultFilters = true
  } = options;

  if (!word || typeof word !== 'string') {
    return { valid: false, error: 'Word is required' };
  }

  const trimmed = word.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `Word must be at least ${minLength} character(s)` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Word cannot exceed ${maxLength} characters` };
  }

  if (!isAppropriateWordForSubmission(trimmed, customFilterList, includeDefaultFilters)) {
    return { valid: false, error: getInappropriateWordMessage(trimmed) };
  }

  return { valid: true, cleaned: trimmed };
};

export default {
  filterInappropriateWords,
  isAppropriateWordForSubmission,
  getInappropriateWordMessage,
  isInappropriateWord,
  censorText,
  validateWordSubmission,
  DEFAULT_INAPPROPRIATE_WORDS,
  FILLER_WORDS,
  PROFANITY_LIST,
  SLURS_LIST
};
