import React, { useState, useRef, useEffect } from 'react';

import { useTheme } from '../context/ThemeContext';
import { getGeneralSettings } from '../data/general';

const DraggableApp = ({ 
  children, 
  initialPosition = { x: 0, y: 0 }, 
  initialSize = { width: 200, height: 150 },
  appId,
  onPositionChange,
  onSizeChange,
  externalPosition = null, // New prop for external position updates
  isExternallyDragged = false, // Flag to indicate external dragging
  isFocused = false // Hand-cursor hover focus
}) => {
  const { theme } = useTheme();

  const accent = theme.accent;
  const hexToRgb = (hex) => {
    const s = hex.replace('#','');
    const bigint = parseInt(s, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  };
  const accentRgb = hexToRgb(accent);
  const general = getGeneralSettings();
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const appRef = useRef(null);

  // Load saved position and size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`smartMirror_${appId}_layout`);
    if (saved) {
      try {
        const { position: savedPos, size: savedSize } = JSON.parse(saved);
        if (savedPos) setPosition(savedPos);
        if (savedSize) setSize(savedSize);
      } catch (e) {
        console.error('Error loading saved layout:', e);
      }
    }
  }, [appId]);

  // Sync position with external position when provided (hand-tracking drag)
  useEffect(() => {
    if (externalPosition && isExternallyDragged) {
      setPosition(externalPosition);
    }
  }, [externalPosition, isExternallyDragged]);

  // When externally dragged, we render using the external position directly
  // to avoid conflicts with internal state updates.

  // Save position and size to localStorage
  const saveLayout = (newPosition, newSize) => {
    const layout = {
      position: newPosition || position,
      size: newSize || size
    };
    localStorage.setItem(`smartMirror_${appId}_layout`, JSON.stringify(layout));
  };

  // Mouse down handler for dragging
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) return;
    if (isExternallyDragged) return; // Don't handle mouse events when externally dragged
    
    setIsDragging(true);
    const rect = appRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  // Mouse down handler for resizing
  const handleResizeMouseDown = (e) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    e.preventDefault();
    e.stopPropagation();
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.y))
        };
        setPosition(newPosition);
        onPositionChange?.(newPosition);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newSize = {
          width: Math.max(150, Math.min(window.innerWidth - position.x, resizeStart.width + deltaX)),
          height: Math.max(100, Math.min(window.innerHeight - position.y, resizeStart.height + deltaY))
        };
        setSize(newSize);
        onSizeChange?.(newSize);
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        saveLayout(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, position, size, onPositionChange, onSizeChange]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={appRef}
      className="draggable-app absolute group"
      data-app-id={appId}
      style={{
        left: (externalPosition ? externalPosition.x : position.x),
        top: (externalPosition ? externalPosition.y : position.y),
        width: size.width,
        height: size.height,
        zIndex: (isExternallyDragged || isDragging || isResizing) ? 1000 : 'auto',
        transition: isExternallyDragged ? 'none' : undefined,
        willChange: isExternallyDragged ? 'left, top' : undefined
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          background: (() => {
            switch (general.backgroundStyle) {
              case 'frosted': return 'rgba(255,255,255,0.06)'; // Cloudy Glass
              case 'liquid': return 'rgba(255,255,255,0.1)';   // Liquid Glow
              case 'arctic': return 'rgba(173,216,230,0.08)';  // Arctic Haze (light blue)
              case 'ember':  return 'rgba(255,69,0,0.06)';     // Ember Mist (warm)
              case 'smoke':  return 'rgba(255,255,255,0.04)';  // Soft Smoke
              default: return 'rgba(0,0,0,0.8)';               // Night Velvet
            }
          })(),
          backdropFilter: (() => {
            switch (general.backgroundStyle) {
              case 'frosted': return 'blur(8px)';
              case 'liquid': return 'blur(14px)';
              case 'arctic': return 'blur(10px)';
              case 'ember': return 'blur(8px)';
              case 'smoke': return 'blur(6px)';
              default: return 'none';
            }
          })(),
          // Themed glow based on general setting
          boxShadow: (() => {
            if (general.glowMode === 'off') return 'none';
            const base = isDragging || isResizing
              ? `0 0 24px rgba(${accentRgb}, 0.35), 0 0 48px rgba(${accentRgb}, 0.2)`
              : `0 0 16px rgba(${accentRgb}, 0.18)`;
            if (general.glowMode === 'hover') return isFocused ? base : 'none';
            return base; // 'on'
          })(),
          // Border only on mouse hover or hand-cursor focus
          border: (isFocused ? `2px solid rgba(${accentRgb}, 0.7)` : '2px solid transparent'),
        }}
      >
        {children}
      </div>
      
      {/* Resize handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default DraggableApp;
