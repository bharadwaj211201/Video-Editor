import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';

export default function VideoPlayer() {
  const {
    videoUrl,
    currentTime,
    setCurrentTime,
    setVideoDuration,
    isPlaying,
    isMuted,
    trimStart,
    trimEnd,
    setIsPlaying
  } = useEditorStore();
  
  const videoRef = useRef(null);
  const isSeeking = useRef(false);

  // Handle playback and trim boundaries
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

      const handleTimeUpdate = () => {
      if (isSeeking.current) return;
      
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Enforce trim end boundary
      if (current >= trimEnd) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = trimStart;
      }
    };
    
    const handleLoadedMetadata = () => {
      const duration = video.duration;
      if (duration && !isNaN(duration)) {
        setVideoDuration(duration);
      }
    };

    const handleSeeked = () => {
      isSeeking.current = false;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [setCurrentTime, setVideoDuration, trimStart, trimEnd, setIsPlaying]);

  // Handle play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      // Reset to start if beyond trim end
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.play().catch(e => console.error('Playback failed:', e));
    } else {
      video.pause();
    }
  }, [isPlaying, trimStart, trimEnd]);

  // Handle mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // Handle seeking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isSeeking.current) return;
    
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      isSeeking.current = true;
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        controls={false}
      onLoadedMetadata={() => {
          // Initialize to trim start always (including 0)
          if (videoRef.current) {
            videoRef.current.currentTime = trimStart;
          }
        }}
      />
    </div>
  );
}