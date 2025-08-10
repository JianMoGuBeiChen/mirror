import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// Define hand connections manually if import fails
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17]             // Palm connections
];

const PREVIEW_APP_ID = 'handtracking_preview';

const HandTrackingService = ({ onHandPosition, settings = {}, enabled }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hands, setHands] = useState(null); // eslint-disable-line no-unused-vars
  const [camera, setCamera] = useState(null);
  const [isEnabled, setIsEnabled] = useState(enabled ?? settings.enabled ?? false);
  const [showPreview, setShowPreview] = useState(settings.showPreview || false);
  const [previewPosition, setPreviewPosition] = useState({ x: 16, y: 16 }); // Default position (top-4 left-4 = 16px)
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsEnabled(enabled ?? settings.enabled ?? false);
    setShowPreview(settings.showPreview || false);
  }, [enabled, settings]);

  // Load saved preview position (from hand or mouse drags)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`smartMirror_${PREVIEW_APP_ID}_layout`) || 'null');
      if (saved?.position) {
        setPreviewPosition(saved.position);
      }
    } catch (_) {}
  }, []);

  // React to storage updates (e.g., pinch-drag end in SmartMirror)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(`smartMirror_${PREVIEW_APP_ID}_layout`) || 'null');
        if (saved?.position) {
          setPreviewPosition(saved.position);
        }
      } catch (_) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      // Clean up when disabled
      if (camera) {
        camera.stop();
        setCamera(null);
      }
      if (onHandPosition) {
        onHandPosition({ detected: false });
      }
      return;
    }

    const initializeHandTracking = async () => {
      try {
        // Initialize MediaPipe Hands
        const handsInstance = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsInstance.onResults(onResults);
        setHands(handsInstance);

        // Initialize camera
        if (videoRef.current) {
          const cameraInstance = new Camera(videoRef.current, {
            onFrame: async () => {
              await handsInstance.send({ image: videoRef.current });
            },
            width: 640,
            height: 480
          });
          
          await cameraInstance.start();
          setCamera(cameraInstance);
        }
      } catch (error) {
        console.error('Error initializing hand tracking:', error);
      }
    };

    initializeHandTracking();

    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, [isEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width = video.videoWidth;
    const h = canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw the video frame if preview is enabled
    if (showPreview) {
      ctx.drawImage(video, 0, 0, w, h);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const hand = results.multiHandLandmarks[0];
      
      // Get thumb tip (landmark 4) and index tip (landmark 8)
      const thumbTip = hand[4];
      const indexTip = hand[8];
      
      if (showPreview) {
        // Draw hand connections
        drawConnectors(ctx, hand, HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
        
        // Draw all landmarks
        drawLandmarks(ctx, hand, {
          color: '#FF0000',
          lineWidth: 1
        });
        
        // Highlight thumb tip and index finger tip
        const tx = thumbTip.x * w;
        const ty = thumbTip.y * h;
        const ix = indexTip.x * w;
        const iy = indexTip.y * h;
        
        // Draw thumb tip
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF00FF'; // Magenta for thumb
        ctx.fill();
        
        // Draw index tip
        ctx.beginPath();
        ctx.arc(ix, iy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF00'; // Green for index
        ctx.fill();
        
        // Draw midpoint
        const midX = (tx + ix) / 2;
        const midY = (ty + iy) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FFFF'; // Cyan for midpoint
        ctx.fill();
      }

      // Calculate pinch detection
      const tx = thumbTip.x * w;
      const ty = thumbTip.y * h;
      const ix = indexTip.x * w;
      const iy = indexTip.y * h;
      
      // Calculate pinch distance
      const pinchDistance = Math.hypot(tx - ix, ty - iy);
      
      // Calculate average distance of all hand connections for normalization
      let totalDistance = 0;
      let connectionCount = 0;
      for (const [a, b] of HAND_CONNECTIONS) {
        const sx = hand[a].x * w;
        const sy = hand[a].y * h;
        const ex = hand[b].x * w;
        const ey = hand[b].y * h;
        totalDistance += Math.hypot(sx - ex, sy - ey);
        connectionCount++;
      }
      const avgConnectionDistance = connectionCount ? totalDistance / connectionCount : 1;
      
      // Calculate pinch strength (0-1, normalized by hand scale)
      const pinchThreshold = settings.pinchSensitivity || 0.2; // Default 20%
      const normalizedPinchDistance = Math.min(Math.max((pinchDistance - 10) / (avgConnectionDistance * 4.5), 0), 1);
      const pinchStrength = Math.max(0, 1 - (normalizedPinchDistance / pinchThreshold));
      const isPinching = normalizedPinchDistance < pinchThreshold;

      // Calculate midpoint between thumb and index finger
      const midpointX = (thumbTip.x + indexTip.x) / 2;
      const midpointY = (thumbTip.y + indexTip.y) / 2;
      
      // Convert to screen coordinates
      const screenX = (1 - midpointX) * window.innerWidth; // Mirror the X coordinate
      const screenY = midpointY * window.innerHeight;
      
      // Send position and pinch data to parent component
      if (onHandPosition) {
        onHandPosition({
          x: screenX,
          y: screenY,
          detected: true,
          isPinching,
          pinchStrength: Math.min(pinchStrength, 1), // Clamp to 0-1
          pinchDistance: normalizedPinchDistance
        });
      }
    } else {
      // No hand detected
      if (onHandPosition) {
        onHandPosition({ detected: false });
      }
    }
  };

  const handleMouseDown = (e) => {
    setIsDraggingPreview(true);
    setDragStart({
      x: e.clientX - previewPosition.x,
      y: e.clientY - previewPosition.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (isDraggingPreview) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep preview within viewport bounds
      const maxX = window.innerWidth - 272; // 256px width + 16px padding
      const maxY = window.innerHeight - 200; // 192px height + 8px padding
      
      setPreviewPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDraggingPreview, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPreview(false);
    // Persist new position so other logic (and sessions) can pick it up
    try {
      const size = { width: 256, height: 192 }; // matches w-64 h-48
      const layout = { position: { ...previewPosition }, size };
      localStorage.setItem(`smartMirror_${PREVIEW_APP_ID}_layout`, JSON.stringify(layout));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}
  }, [previewPosition]);

  // Add global mouse event listeners
  useEffect(() => {
    if (!isDraggingPreview) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPreview, handleMouseMove, handleMouseUp]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div 
      className={`absolute z-40 ${showPreview ? 'block' : 'hidden'}`}
      style={{
        left: `${previewPosition.x}px`,
        top: `${previewPosition.y}px`
      }}
      data-app-id={PREVIEW_APP_ID}
    >
      <div 
        className="bg-black/80 backdrop-blur-sm rounded-lg p-2 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="text-white text-xs mb-2 text-center">Hand Tracking Preview</div>
        <div className="relative">
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            className="w-64 h-48 object-contain bg-black rounded"
            style={{ 
              transform: 'scaleX(-1)', // Mirror the camera view
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HandTrackingService;
