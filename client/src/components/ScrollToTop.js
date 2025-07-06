import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Get the current path
    const currentPath = location.pathname;
    
    // Check if we have a saved scroll position for this path
    const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    const savedPosition = savedPositions[currentPath];

    console.log('🔄 ScrollToTop: Path changed to:', currentPath);
    console.log('🔄 ScrollToTop: Saved position:', savedPosition);

    // Don't restore position on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('🔄 ScrollToTop: Initial mount, scrolling to top');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    // Special handling for form pages (login, register) - always scroll to top
    const isFormPage = currentPath === '/login' || currentPath === '/register';
    
    if (isFormPage) {
      console.log('🔄 ScrollToTop: Form page detected, scrolling to top');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    if (savedPosition !== undefined && savedPosition > 0) {
      // Restore the saved position with smooth scrolling
      console.log('🔄 ScrollToTop: Restoring position to:', savedPosition);
      setTimeout(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      // New page or first visit - scroll to top smoothly
      console.log('🔄 ScrollToTop: New page, scrolling to top');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [location.pathname]);

  // Save scroll position when leaving the page
  useEffect(() => {
    const saveScrollPosition = () => {
      const currentPath = location.pathname;
      const scrollY = window.scrollY;
      
      // Don't save positions for form pages
      const isFormPage = currentPath === '/login' || currentPath === '/register';
      if (isFormPage) {
        console.log('💾 ScrollToTop: Form page detected, not saving position');
        return;
      }
      
      // Only save if we've scrolled down
      if (scrollY > 0) {
        console.log('💾 ScrollToTop: Saving position for', currentPath, 'at', scrollY);
        
        // Get existing saved positions
        const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
        
        // Save current position
        savedPositions[currentPath] = scrollY;
        
        // Store back to sessionStorage
        sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
      }
    };

    // Save position when component unmounts
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname]);

  // Handle scroll position saving on page unload and beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentPath = location.pathname;
      const scrollY = window.scrollY;
      
      // Don't save positions for form pages
      const isFormPage = currentPath === '/login' || currentPath === '/register';
      if (isFormPage) {
        return;
      }
      
      if (scrollY > 0) {
        const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
        savedPositions[currentPath] = scrollY;
        sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = location.pathname;
      const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      const savedPosition = savedPositions[currentPath];

      if (savedPosition !== undefined && savedPosition > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            behavior: 'smooth'
          });
        }, 100);
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  return null;
};

export default ScrollToTop; 