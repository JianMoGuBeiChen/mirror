import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DraggableApp from '../components/DraggableApp';
import CursorOverlay from '../components/CursorOverlay';
import HandTrackingService from '../components/HandTrackingService';
import { apps, getAppSettings } from '../data/apps';
import { getGeneralSettings } from '../data/general';

// Import all app components
import ClockApp from '../apps/ClockApp';
import DateApp from '../apps/DateApp';
import WeatherApp from '../apps/WeatherApp';
import NewsApp from '../apps/NewsApp';
import SpotifyApp from '../apps/SpotifyApp';

const SmartMirror = () => {
  const [enabledApps, setEnabledApps] = useState([]);
  const containerRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, detected: false });
  const [handTrackingEnabled, setHandTrackingEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState(null);
  const dragTargetRef = useRef(null); // Immediate reference for drag logic
  const [appPositions, setAppPositions] = useState({}); // Track positions for each app
  const [focusedAppId, setFocusedAppId] = useState(null);
  const [mirrorEnabled, setMirrorEnabled] = useState(getGeneralSettings().mirrorEnabled);

  const clearDragState = () => {
    // Clear all app highlights first
    const allApps = document.querySelectorAll('[data-app-id]');
    allApps.forEach(app => {
      app.style.transition = '';
      app.style.boxShadow = '';
      app.style.transform = '';
      app.style.zIndex = '';
      app.style.pointerEvents = '';
    });
    
    setIsDragging(false);
    setDragTarget(null);
    dragTargetRef.current = null; // Clear ref immediately
    // Don't clear appPositions here as they need to persist for the final save
  };

  useEffect(() => {
    // Get enabled apps that are not background services
    const getVisibleApps = () => {
      const settings = JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
      return apps.filter(app => 
        !app.isBackgroundService && // Filter out background services
        settings[app.id]?.enabled !== false
      );
    };
    
    setEnabledApps(getVisibleApps());
    
    // Check if hand tracking is enabled
    const handTrackingSettings = getAppSettings('handtracking');
    
    // TEMPORARY: Force enable hand tracking for debugging
    const forceEnabled = true; // Set this to false when done debugging
    setHandTrackingEnabled(forceEnabled || handTrackingSettings.enabled || false);
    
    // Listen for settings changes
    const handleStorageChange = () => {
      setEnabledApps(getVisibleApps());
      const updatedHandTrackingSettings = getAppSettings('handtracking');
      setHandTrackingEnabled(updatedHandTrackingSettings.enabled || false);
    };
    
    window.addEventListener('storage', handleStorageChange);
    const handleGeneral = () => setMirrorEnabled(getGeneralSettings().mirrorEnabled);
    window.addEventListener('storage', handleGeneral);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', handleGeneral);
      // Clean up any drag state on unmount
      clearDragState();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHandPosition = (position) => {
    setCursorPosition(position);
    
    // Always clear highlights when not pinching or hand not detected
    if ((!position.isPinching || !position.detected) && !isDragging) {
      clearDragState();
    }
    
    // Update hover focus for hand cursor
    if (position.detected) {
      const allApps = document.querySelectorAll('[data-app-id]');
      let hoverAppId = null;
      allApps.forEach(app => {
        const rect = app.getBoundingClientRect();
        const isUnderCursor = position.x >= rect.left && 
                              position.x <= rect.right && 
                              position.y >= rect.top && 
                              position.y <= rect.bottom;
        if (isUnderCursor) hoverAppId = app.dataset.appId;
      });
      setFocusedAppId(hoverAppId);
    } else {
      setFocusedAppId(null);
    }

    // Handle pinch-to-drag functionality
    if (position.detected && position.isPinching) {
      if (!dragTargetRef.current) {
        // Start dragging - find all apps and check which one is under cursor
        const allApps = document.querySelectorAll('[data-app-id]');
        let targetApp = null;
        let highestZIndex = -1;
        
        allApps.forEach(app => {
          const rect = app.getBoundingClientRect();
          const isUnderCursor = position.x >= rect.left && 
                               position.x <= rect.right && 
                               position.y >= rect.top && 
                               position.y <= rect.bottom;
          
          if (isUnderCursor) {
            const zIndex = parseInt(window.getComputedStyle(app).zIndex) || 0;
            if (zIndex >= highestZIndex) {
              highestZIndex = zIndex;
              targetApp = app;
            }
          }
        });
        
        if (targetApp) {
          // Clear any existing highlights
          clearDragState();
          
          setIsDragging(true);
          const rect = targetApp.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          
          const dragTargetData = {
            appId: targetApp.dataset.appId,
            element: targetApp,
            startX: position.x,
            startY: position.y,
            offsetX: position.x - rect.left,
            offsetY: position.y - rect.top,
            initialPosition: {
              x: containerRect ? rect.left - containerRect.left : rect.left,
              y: containerRect ? rect.top - containerRect.top : rect.top
            }
          };
          
          setDragTarget(dragTargetData);
          dragTargetRef.current = dragTargetData; // Set ref immediately
          
          // Add visual feedback with lower z-index than cursor
          targetApp.style.transition = 'none';
          targetApp.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
          targetApp.style.transform = 'none'; // NO TRANSFORM DURING DRAG - interferes with positioning
          targetApp.style.zIndex = '1000'; // Still below cursor at 9999
          
          // Force immediate position update to prevent lag
          targetApp.style.pointerEvents = 'none';
        }
      } else {
        const currentDragTarget = dragTargetRef.current;
        // Continue dragging - calculate new position using React state
        const containerRect = containerRef.current?.getBoundingClientRect();
        const appWidth = currentDragTarget.element?.offsetWidth || 300;
        const appHeight = currentDragTarget.element?.offsetHeight || 200;
        const containerWidth = containerRect?.width || window.innerWidth;
        const containerHeight = containerRect?.height || window.innerHeight;

        // Calculate new position relative to the initial drag start
        const deltaX = position.x - currentDragTarget.startX;
        const deltaY = position.y - currentDragTarget.startY;
        
        const newLeft = Math.max(0, Math.min(containerWidth - appWidth, currentDragTarget.initialPosition.x + deltaX));
        const newTop = Math.max(0, Math.min(containerHeight - appHeight, currentDragTarget.initialPosition.y + deltaY));
        
        // Update position in React state and force immediate DOM update
        const newPosition = { x: newLeft, y: newTop };
        
        setAppPositions(prev => ({
          ...prev,
          [currentDragTarget.appId]: newPosition
        }));
        
        // Force immediate visual update to the DOM element for smoother dragging
        if (currentDragTarget.element) {
          currentDragTarget.element.style.left = `${newLeft}px`;
          currentDragTarget.element.style.top = `${newTop}px`;
        }
      }
    } else if (isDragging && dragTarget) {
      // Stop dragging
      
      // Get final position from state
      const finalPosition = appPositions[dragTarget.appId] || dragTarget.initialPosition;
      
      // Save final position using the same key as DraggableApp
      const layout = {
        position: { x: finalPosition.x, y: finalPosition.y },
        size: { 
          width: dragTarget.element?.offsetWidth || 300, 
          height: dragTarget.element?.offsetHeight || 200
        }
      };
      localStorage.setItem(`smartMirror_${dragTarget.appId}_layout`, JSON.stringify(layout));
      // Notify listeners in this tab
      try { window.dispatchEvent(new Event('storage')); } catch (_) {}
      
      // Clean up and reset state
      clearDragState();
    }
  };

  // Component mapping
  const componentMap = {
    ClockApp,
    DateApp,
    WeatherApp,
    NewsApp,
    SpotifyApp
  };

  const renderApp = (app) => {
    const AppComponent = componentMap[app.componentPath];
    
    if (!AppComponent) {
      console.error(`Component not found: ${app.componentPath}`);
      return null;
    }

    const isBeingDragged = isDragging && dragTarget?.appId === app.id;
    const externalPosition = appPositions[app.id];

    return (
      <DraggableApp
        key={app.id}
        appId={app.id}
        initialPosition={app.defaultPosition}
        initialSize={app.defaultSize}
        externalPosition={externalPosition}
        isExternallyDragged={isBeingDragged}
        isFocused={focusedAppId === app.id}
      >
        <AppComponent appId={app.id} />
      </DraggableApp>
    );
  };

  return (
    <div ref={containerRef} className={`w-screen h-screen bg-black overflow-hidden relative`}>
      {/* Settings Button */}
      <Link 
        to="/settings"
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>

      {/* Background Hand Tracking Service */}
      <HandTrackingService 
        onHandPosition={handleHandPosition}
        settings={getAppSettings('handtracking')}
        enabled={handTrackingEnabled}
      />
      


      {/* Render enabled apps or black screen when mirror disabled */}
      {mirrorEnabled ? enabledApps.map(renderApp) : null}

      {/* Hand tracking cursor overlay */}
      <CursorOverlay 
        position={cursorPosition} 
        isVisible={handTrackingEnabled && cursorPosition.detected}
        isDragging={isDragging}
      />

      {/* Instructions overlay (only show if no apps are enabled) */}
      {enabledApps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/70">
            <div className="text-6xl mb-4">🪟</div>
            <div className="text-2xl mb-2">Smart Mirror</div>
            <div className="text-lg mb-4">No apps enabled</div>
            <Link 
              to="/settings"
              className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-colors"
            >
              Go to Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartMirror;
