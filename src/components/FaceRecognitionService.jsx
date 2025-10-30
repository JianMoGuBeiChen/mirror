// src/components/FaceRecognitionService.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const PREVIEW_APP_ID = 'facerecognition_preview';

const FaceRecognitionService = ({ onFaceDetected, settings = {}, enabled }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(enabled ?? settings.enabled ?? false);
  const [showPreview, setShowPreview] = useState(settings.showPreview || false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 16, y: 300 }); // Default position
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    setIsEnabled(enabled ?? settings.enabled ?? false);
    setShowPreview(settings.showPreview || false);
  }, [enabled, settings]);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // For loading reference image
        ]);
        setModelsLoaded(true);
        console.log('FaceAPI models loaded');
      } catch (e) {
        console.error('Error loading face-api models:', e);
      }
    };
    loadModels();
  }, []);

  // This function sets up the "known faces".
  // In a real app, this would be dynamic, but here we'll hardcode one profile.
  useEffect(() => {
    if (!modelsLoaded) return;

    const setupMatcher = async () => {
      try {
        // --- THIS IS THE "ENROLLMENT" STEP ---
        // 1. Add a photo of yourself to the /public folder (e.g., /public/profile.jpg)
        // 2. Give your name here
        const name = 'Manan';
        const referenceImage = await faceapi.fetchImage('/profile.jpg');

        const detection = await faceapi
          .detectSingleFace(referenceImage)
          .withFaceLandmarks()
          .withFaceDescriptor();
          
        if (!detection) {
          console.error('Could not find a face in /profile.jpg. Enrollment failed.');
          return;
        }

        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
          name,
          [detection.descriptor]
        );
        
        // This matcher will be used to compare against the live video
        setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptor, 0.6)); // 0.6 is the distance threshold
        console.log('Face matcher created for:', name);

      } catch (e) {
        console.error('Error creating face matcher:', e);
      }
    };

    setupMatcher();
  }, [modelsLoaded]);

  // Start/stop camera
  useEffect(() => {
    if (!isEnabled || !modelsLoaded) {
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onFaceDetected({ detected: false, name: null });
      return;
    }

    // Start video stream
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error starting video stream:', err);
      }
    };

    startVideo();

    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, modelsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVideoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Start detection loop
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !faceMatcher) return;

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showPreview) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

      let detectedUser = null;
      if (results.length > 0 && results[0].label !== 'unknown') {
        detectedUser = results[0].label;
        if (showPreview) {
          // Draw the name
          new faceapi.draw.DrawBox(resizedDetections[0].detection.box, {
            label: detectedUser,
            boxColor: 'rgba(0, 255, 0, 1)'
          }).draw(canvas);
        }
      }

      if (detectedUser) {
        onFaceDetected({ detected: true, name: detectedUser });
      } else {
        onFaceDetected({ detected: false, name: null });
      }

    }, 500); // Run detection every 500ms
  };
  
  // --- Drag handlers (copied from HandTrackingService) ---
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
      const maxX = window.innerWidth - 272;
      const maxY = window.innerHeight - 200;
      setPreviewPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDraggingPreview, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPreview(false);
    try {
      const size = { width: 256, height: 192 };
      const layout = { position: { ...previewPosition }, size };
      localStorage.setItem(`smartMirror_${PREVIEW_APP_ID}_layout`, JSON.stringify(layout));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}
  }, [previewPosition]);

  useEffect(() => {
    if (!isDraggingPreview) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPreview, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`smartMirror_${PREVIEW_APP_ID}_layout`) || 'null');
      if (saved?.position) {
        setPreviewPosition(saved.position);
      }
    } catch (_) {}
  }, []);
  // --- End of drag handlers ---


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
        <div className="text-white text-xs mb-2 text-center">Face Recognition Preview</div>
        <div className="relative">
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            autoPlay
            muted
            onPlay={handleVideoPlay}
            width="640"
            height="480"
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

export default FaceRecognitionService;