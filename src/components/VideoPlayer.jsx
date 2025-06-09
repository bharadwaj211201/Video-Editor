// import { useEffect, useRef, useState } from 'react';
// import { useEditorStore } from '../stores/editorStore';

// export default function VideoPlayer() {
//   const {
//     videoUrl,
//     currentTime,
//     setCurrentTime,
//     setVideoDuration,
//     isPlaying,
//     isMuted,
//     trimStart,
//     trimEnd,
//     setIsPlaying
//   } = useEditorStore();
  
//   const videoRef = useRef(null);
//   const isSeeking = useRef(false);
//   const [isVideoReady, setIsVideoReady] = useState(false);

//   // Handle playback and trim boundaries
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//       const handleTimeUpdate = () => {
//       if (isSeeking.current) return;
      
//       const current = video.currentTime;
//       setCurrentTime(current);
      
//       // Enforce trim end boundary
//       if (current >= trimEnd) {
//         video.pause();
//         setIsPlaying(false);
//         video.currentTime = trimStart;
//       }
//     };
    
//     const handleLoadedMetadata = () => {
//       const duration = video.duration;
//       if (duration && !isNaN(duration)) {
//         setVideoDuration(duration);
//       }
//       setIsVideoReady(true);
//     };

//     const handleSeeked = () => {
//       isSeeking.current = false;
//     };

//     video.addEventListener('timeupdate', handleTimeUpdate);
//     video.addEventListener('loadedmetadata', handleLoadedMetadata);
//     video.addEventListener('seeked', handleSeeked);
    
//     return () => {
//       video.removeEventListener('timeupdate', handleTimeUpdate);
//       video.removeEventListener('loadedmetadata', handleLoadedMetadata);
//       video.removeEventListener('seeked', handleSeeked);
//     };
//   }, [setCurrentTime, setVideoDuration, trimStart, trimEnd, setIsPlaying]);

//   // Handle play/pause state
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;
    
//     if (isPlaying) {
//       // Reset to start if beyond trim end
//       if (video.currentTime >= trimEnd) {
//         video.currentTime = trimStart;
//       }
//       video.play().catch(e => console.error('Playback failed:', e));
//     } else {
//       video.pause();
//     }
//   }, [isPlaying, trimStart, trimEnd]);

//   // Handle mute state
//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.muted = isMuted;
//     }
//   }, [isMuted]);
  
//   // Handle seeking
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video || isSeeking.current) return;
    
//     if (Math.abs(video.currentTime - currentTime) > 0.1) {
//       isSeeking.current = true;
//       video.currentTime = currentTime;
//     }
//   }, [currentTime]);

//   return (
//     <div className="relative w-full h-full bg-black">
//       <video
//         ref={videoRef}
//         src={videoUrl}
//         className="w-full h-full object-contain"
//         controls={false}
//       onLoadedMetadata={() => {
//           // Initialize to trim start always (including 0)
//           if (videoRef.current) {
//             videoRef.current.currentTime = trimStart;
//           }
//         }}
//       />
//     </div>
//   );
// }

import { useEffect, useRef, useState } from 'react';
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
    setIsPlaying,
    restoreVideo,
    videoData
  } = useEditorStore();
  
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const isSeeking = useRef(false);
  const wasPlayingBeforeSeek = useRef(false);

  // Initialize and restore video
  useEffect(() => {
    const initVideo = async () => {
      if (!videoData) return;

      setIsRestoring(true);
      try {
        // For blob URLs, ensure they're properly restored
        await restoreVideo();
      } catch (err) {
        console.error('Video restoration failed:', err);
        setError('Failed to restore video. Please re-upload.');
      } finally {
        setIsRestoring(false);
      }
    };

    initVideo();

    return () => {
      // Clean up video element
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [restoreVideo, videoData]);

  // Handle playback state and trim boundaries
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleTimeUpdate = () => {
      if (isSeeking.current) return;
      const currentVideoTime = video.currentTime;
      setCurrentTime(currentVideoTime);
      
      // Handle end of trim range
      if (currentVideoTime >= trimEnd) {
        // if (isPlaying) {
        //   video.currentTime = trimStart;
        //   video.play().catch(e => console.error('Playback error:', e));
        // } else {
        //   video.pause();
        //   video.currentTime = trimStart;
        // }
        video.pause();
        setIsPlaying(false);
        video.currentTime = trimStart;
        // Update the current time after resetting
        setCurrentTime(trimStart);
      }
    };
    
    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
      video.currentTime = Math.min(trimStart, video.duration);
      setIsVideoReady(true);
      setError(null);
    };

    const handleError = () => {
      setError('Video playback failed. The file may be corrupted.');
      setIsPlaying(false);
    };

    const handleSeeking = () => {
      isSeeking.current = true;
    };

    const handleSeeked = () => {
      isSeeking.current = false;
      if (wasPlayingBeforeSeek.current) {
        video.play().catch(e => console.error('Playback error:', e));
        wasPlayingBeforeSeek.current = false;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [videoUrl, setVideoDuration, trimStart, isPlaying, setCurrentTime, setIsPlaying]);

  // Handle play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    const handlePlayback = async () => {
      try {
        if (isPlaying) {
          if (video.currentTime >= trimEnd) {
            video.currentTime = trimStart;
          }
          await video.play();
        } else {
          video.pause();
        }
      } catch (err) {
        console.error('Playback error:', err);
        setError('Playback failed. Please try again.');
        setIsPlaying(false);
      }
    };

    handlePlayback();
  }, [isPlaying, trimStart, trimEnd, videoUrl, isVideoReady]);

  // Handle mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // Handle seeking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || isSeeking.current) return;

    const timeDifference = Math.abs(video.currentTime - currentTime);
    if (timeDifference > 0.1) {
      isSeeking.current = true;
      wasPlayingBeforeSeek.current = isPlaying;
      if (isPlaying) {
        video.pause();
      }
      video.currentTime = currentTime;
    }
  }, [currentTime, videoUrl]);

  return (
    <div className="relative w-full h-full bg-black">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Reload Editor
          </button>
        </div>
      ) : !videoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          {videoData ? 'Loading video...' : 'Upload a video to begin editing'}
        </div>
      ) : (
        <>
          {isRestoring && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-70">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            controls={false}
            preload="auto"
            playsInline
          />
        </>
      )}
    </div>
  );
}