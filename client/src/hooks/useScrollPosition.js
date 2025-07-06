import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollPosition = () => {
  const location = useLocation();
  const scrollPositions = useRef(new Map());

  // Save scroll position before leaving a page
  useEffect(() => {
    const saveScrollPosition = () => {
      const currentPath = location.pathname;
      const scrollY = window.scrollY;
      scrollPositions.current.set(currentPath, scrollY);
    };

    // Save position when component unmounts (user navigates away)
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname]);

  // Restore scroll position when entering a page
  useEffect(() => {
    const currentPath = location.pathname;
    const savedPosition = scrollPositions.current.get(currentPath);

    if (savedPosition !== undefined) {
      // Use setTimeout to ensure the page has rendered
      setTimeout(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      // New page or first visit - scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [location.pathname]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = location.pathname;
      const savedPosition = scrollPositions.current.get(currentPath);

      if (savedPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  return {
    saveScrollPosition: () => {
      const currentPath = location.pathname;
      scrollPositions.current.set(currentPath, window.scrollY);
    },
    clearScrollPosition: (path) => {
      if (path) {
        scrollPositions.current.delete(path);
      } else {
        scrollPositions.current.delete(location.pathname);
      }
    }
  };
};

export default useScrollPosition; 