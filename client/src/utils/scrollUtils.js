// Utility functions for scroll management

/**
 * Save scroll position for a specific path
 * @param {string} path - The path to save scroll position for
 * @param {number} position - The scroll position to save
 */
export const saveScrollPosition = (path, position) => {
  try {
    const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    savedPositions[path] = position;
    sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
  } catch (error) {
    console.warn('Failed to save scroll position:', error);
  }
};

/**
 * Get saved scroll position for a specific path
 * @param {string} path - The path to get scroll position for
 * @returns {number|null} - The saved scroll position or null if not found
 */
export const getScrollPosition = (path) => {
  try {
    const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    return savedPositions[path] || null;
  } catch (error) {
    console.warn('Failed to get scroll position:', error);
    return null;
  }
};

/**
 * Clear scroll position for a specific path
 * @param {string} path - The path to clear scroll position for
 */
export const clearScrollPosition = (path) => {
  try {
    const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    delete savedPositions[path];
    sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
  } catch (error) {
    console.warn('Failed to clear scroll position:', error);
  }
};

/**
 * Clear all saved scroll positions
 */
export const clearAllScrollPositions = () => {
  try {
    sessionStorage.removeItem('scrollPositions');
  } catch (error) {
    console.warn('Failed to clear all scroll positions:', error);
  }
};

/**
 * Scroll to top with smooth behavior
 */
export const scrollToTop = () => {
  // Use multiple methods to ensure compatibility across browsers
  try {
    // Method 1: Modern browsers with smooth scrolling
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } catch (error) {
    // Method 2: Fallback for older browsers
    window.scrollTo(0, 0);
  }
  
  // Method 3: Also scroll the document element for better compatibility
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  
  // Method 4: Scroll the body element as well
  if (document.body) {
    document.body.scrollTop = 0;
  }
};

/**
 * Scroll to a specific element with smooth behavior
 * @param {string} elementId - The ID of the element to scroll to
 * @param {number} offset - Optional offset from the top
 */
export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * Save current scroll position for the current path
 */
export const saveCurrentScrollPosition = () => {
  const currentPath = window.location.pathname;
  const currentPosition = window.scrollY;
  saveScrollPosition(currentPath, currentPosition);
};

/**
 * Restore scroll position for the current path
 */
export const restoreScrollPosition = () => {
  const currentPath = window.location.pathname;
  const savedPosition = getScrollPosition(currentPath);
  
  if (savedPosition !== null) {
    setTimeout(() => {
      window.scrollTo({
        top: savedPosition,
        behavior: 'smooth'
      });
    }, 100);
  } else {
    scrollToTop();
  }
}; 