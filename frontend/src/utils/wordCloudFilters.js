/**
 * Word Cloud Filtering Utilities
 * 
 * This module provides functions for filtering inappropriate words and handling
 * customization of word clouds
 */

// Common inappropriate words to filter by default
const DEFAULT_INAPPROPRIATE_WORDS = [
  // Profanity and obscenities (partial list for demonstration)
  'profanity1', 'profanity2', 'profanity3',
  
  // Slurs and offensive terms (placeholders - in a real implementation, these would be actual terms)
  'slur1', 'slur2', 'slur3',
  
  // Inappropriate content (placeholders)
  'inappropriate1', 'inappropriate2'
];

// Common filler words to optionally filter
const FILLER_WORDS = [
  'the', 'and', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'with', 
  'by', 'at', 'from', 'but', 'or', 'as', 'if', 'so', 'than',
  'this', 'that', 'these', 'those', 'it', 'its'
];

/**
 * Check if a word is inappropriate based on the provided filter list
 * @param {string} word - Word to check
 * @param {Array} filterList - List of words to filter against
 * @returns {boolean} - True if the word is inappropriate, false otherwise
 */
export const isInappropriateWord = (word, filterList = DEFAULT_INAPPROPRIATE_WORDS) => {
  const normalizedWord = word.toLowerCase().trim();
  return filterList.some(filterWord => 
    normalizedWord === filterWord.toLowerCase() || 
    normalizedWord.includes(filterWord.toLowerCase())
  );
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
  
  return words.filter(word => !isInappropriateWord(word.text, filterList));
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

export default {
  filterInappropriateWords,
  isAppropriateWordForSubmission,
  getInappropriateWordMessage,
  DEFAULT_INAPPROPRIATE_WORDS,
  FILLER_WORDS
};
