import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../stores/editorStore';

export default function Timeline() {
  const {
    videoDuration,
    currentTime,
    setCurrentTime,
    trimStart,
    trimEnd,
    setTrimPoints,
    isTrimming,
    startTrimming,
    stopTrimming,
    videoUrl,
    trimVideo,
    isProcessing,
    trimError,
    ffmpegStatus,
    initializeFFmpeg
  } = useEditorStore();
  
  const timelineRef = useRef(null);
  const scrubberRef = useRef(null);
  const trimStartRef = useRef(null);
  const trimEndRef = useRef(null);
  const isDragging = useRef(false);
  const dragTarget = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize FFmpeg when video loads
  useEffect(() => {
    if (videoUrl && ffmpegStatus === 'idle') {
      initializeFFmpeg();
    }
  }, [videoUrl, ffmpegStatus, initializeFFmpeg]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMouseDown = (e, target) => {
    isDragging.current = true;
    dragTarget.current = target;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    if (target !== 'scrubber') startTrimming();
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (position / rect.width) * videoDuration;

    switch (dragTarget.current) {
      case 'scrubber':
        setCurrentTime(newTime);
        break;
      case 'trimStart':
        setTrimPoints(newTime, trimEnd);
        break;
      case 'trimEnd':
        setTrimPoints(trimStart, newTime);
        break;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    if (dragTarget.current !== 'scrubber') stopTrimming();
    dragTarget.current = null;
  };

  const handleTimelineClick = (e) => {
    if (isDragging.current || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const newTime = (clickPosition / rect.width) * videoDuration;
    setCurrentTime(newTime);
  };

  const handleTrimVideo = async () => {
    console.log('Trim button clicked');
    console.log('ffmpegStatus:', ffmpegStatus);
    console.log('trimStart:', trimStart, 'trimEnd:', trimEnd);
    if (ffmpegStatus !== 'ready') return;
    
    setShowSuccess(false);
    const success = await trimVideo();
    console.log('Trim success:', success);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  // Update timeline elements position
  useEffect(() => {
    if (!timelineRef.current || !videoDuration) return;
    
    const updatePosition = (ref, value) => {
      if (ref.current) {
        ref.current.style.left = `${(value / videoDuration) * 100}%`;
      }
    };

    updatePosition(scrubberRef, currentTime);
    updatePosition(trimStartRef, trimStart);
    updatePosition(trimEndRef, trimEnd);
  }, [currentTime, trimStart, trimEnd, videoDuration]);

  return (
    <div className="h-24 bg-gray-800 border-t border-gray-700 p-2 flex flex-col">
      {/* Status messages */}
      {trimError && (
        <div className="text-red-500 text-sm mb-1 text-center">
          {trimError}
        </div>
      )}
      {showSuccess && (
        <div className="text-green-500 text-sm mb-1 text-center">
          Video trimmed successfully!
        </div>
      )}
      {ffmpegStatus === 'initializing' && (
        <div className="text-yellow-500 text-sm mb-1 text-center">
          Initializing video processor...
        </div>
      )}

      <div className="relative h-12 flex-1">
        <div
          ref={timelineRef}
          className="absolute top-1/2 left-0 right-0 h-2 bg-gray-700 rounded-full transform -translate-y-1/2 cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Trim range highlight */}
          {isTrimming && (
            <div 
              className="absolute h-full bg-blue-900 opacity-30"
              style={{
                left: `${(trimStart / videoDuration) * 100}%`,
                width: `${((trimEnd - trimStart) / videoDuration) * 100}%`
              }}
            />
          )}
          
          {/* Trim handles */}
          <div
            ref={trimStartRef}
            className="absolute w-3 h-6 bg-blue-500 rounded-sm -top-2 -ml-1.5 cursor-ew-resize"
            onMouseDown={(e) => handleMouseDown(e, 'trimStart')}
          />
          <div
            ref={trimEndRef}
            className="absolute w-3 h-6 bg-blue-500 rounded-sm -top-2 -ml-1.5 cursor-ew-resize"
            onMouseDown={(e) => handleMouseDown(e, 'trimEnd')}
          />
          
          {/* Scrubber */}
          <div
            ref={scrubberRef}
            className="absolute w-2 h-6 bg-white rounded-sm -top-2 -ml-1 pointer-events-none"
          />
        </div>
        
        {/* Time indicators */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-400">
          <span>{formatTime(trimStart)}</span>
          <span>{formatTime(trimEnd)}</span>
        </div>
      </div>
      
      {/* Trim button */}
      <div className="flex justify-center mt-2">
        <button
          onClick={handleTrimVideo}
          disabled={!videoUrl || trimStart >= trimEnd || isProcessing || ffmpegStatus !== 'ready'}
          className={`px-4 py-2 rounded flex items-center justify-center min-w-32 ${
            isProcessing || ffmpegStatus !== 'ready'
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Trim Video'}
        </button>
      </div>
    </div>
  );
}
