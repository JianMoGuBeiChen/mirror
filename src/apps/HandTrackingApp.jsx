import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const HandTrackingApp = ({ onClose, onHandPosition, settings = {} }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hands, setHands] = useState(null); // eslint-disable-line no-unused-vars
  const [camera, setCamera] = useState(null);
  const [isEnabled, setIsEnabled] = useState(settings.enabled || false);
  const [showPreview, setShowPreview] = useState(settings.showPreview || false);

  useEffect(() => {
    if (!isEnabled) return;

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
            width: 320,
            height: 240
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
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video frame if preview is enabled
    if (showPreview) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const hand = results.multiHandLandmarks[0];
      
      if (showPreview) {
        // Draw hand connections
        drawConnectors(ctx, hand, Hands.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
        
        // Draw all landmarks
        drawLandmarks(ctx, hand, {
          color: '#FF0000',
          lineWidth: 1
        });
        
        // Highlight index finger tip (landmark 8)
        const indexTip = hand[8];
        ctx.beginPath();
        ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF00';
        ctx.fill();
      }

      // Send index finger position to parent component
      if (onHandPosition && hand[8]) {
        const indexTip = hand[8];
        // Convert from camera coordinates to screen coordinates
        const screenX = (1 - indexTip.x) * window.innerWidth; // Mirror the X coordinate
        const screenY = indexTip.y * window.innerHeight;
        
        onHandPosition({
          x: screenX,
          y: screenY,
          detected: true
        });
      }
    } else {
      // No hand detected
      if (onHandPosition) {
        onHandPosition({ detected: false });
      }
    }
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <h3 className="text-lg font-semibold">Hand Tracking</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span>Enable Tracking</span>
            <button
              onClick={toggleEnabled}
              className={`px-3 py-1 rounded text-sm ${
                isEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {isEnabled && (
            <div className="flex items-center justify-between">
              <span>Show Camera Preview</span>
              <button
                onClick={togglePreview}
                className={`px-3 py-1 rounded text-sm ${
                  showPreview ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {showPreview ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 p-4">
        {isEnabled ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="hidden"
              playsInline
            />
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-contain ${showPreview ? 'bg-black' : 'bg-transparent'}`}
              style={{ 
                transform: 'scaleX(-1)', // Mirror the camera view
                maxHeight: '200px'
              }}
            />
            <div className="mt-2 text-sm text-gray-400">
              {showPreview ? 'Camera preview with hand tracking overlay' : 'Hand tracking active (preview hidden)'}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👋</div>
              <p>Enable hand tracking to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandTrackingApp;
