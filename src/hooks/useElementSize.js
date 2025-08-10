import { useCallback, useEffect, useRef, useState } from 'react';

export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleResize = useCallback((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect || {};
      if (typeof width === 'number' && typeof height === 'number') {
        setSize({ width, height });
      }
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(handleResize);
    observer.observe(ref.current);
    // Initialize once
    const rect = ref.current.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, [handleResize]);

  return { ref, width: size.width, height: size.height };
}


