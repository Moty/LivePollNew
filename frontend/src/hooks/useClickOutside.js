import { useEffect, useRef } from 'react';

/**
 * Hook that handles clicks outside of the specified element
 * @param {Function} callback - Function to call when a click outside is detected
 * @returns {Object} Ref to attach to the element
 */
const useClickOutside = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
};

export default useClickOutside;