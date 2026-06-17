/**
 * Utility functions for text processing.
 */

/**
 * Splits input text into an array of non-empty words.
 * @param {string} text - The input text to split.
 * @returns {string[]} Array of words.
 */
export const splitIntoWords = (text) =>
  text.split(/\s+/).filter((word) => word.length > 0);

/**
 * Calculates playback progress as a percentage.
 * @param {number} currentIndex - Current word index (0-based, -1 = not started).
 * @param {number} totalWords - Total number of words.
 * @returns {number} Progress percentage (0-100).
 */
export const calculateProgress = (currentIndex, totalWords) => {
  if (totalWords <= 0 || currentIndex < 0) return 0;
  return ((currentIndex + 1) / totalWords) * 100;
};
