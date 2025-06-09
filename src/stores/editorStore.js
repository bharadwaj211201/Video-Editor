// import { create } from 'zustand';

// export const useEditorStore = create((set, get) => ({
//   // Video state
//   videoFile: null,
//   videoUrl: null,
//   videoDuration: 0,
//   currentTime: 0,
//   isPlaying: false,
  
//   // FFmpeg state
//   ffmpegStatus: 'idle', // 'idle' | 'initializing' | 'ready' | 'error'
  
//   // Timeline state
//   trimStart: 0,
//   trimEnd: 0,
//   isTrimming: false,
//   isProcessing: false,
//   trimError: null,

//   // Actions
//   setVideoFile: (file, url) => set({ videoFile: file, videoUrl: url }),
//   setVideoDuration: (duration) => set({ 
//     videoDuration: duration,
//     trimEnd: duration 
//   }),
//   setCurrentTime: (time) => set({ currentTime: time }),
//   setIsPlaying: (isPlaying) => set({ isPlaying }),
  
//   // Timeline actions
//   startTrimming: () => set({ isTrimming: true, trimError: null }),
//   stopTrimming: () => set({ isTrimming: false }),
//   setTrimPoints: (start, end) => set({ 
//     trimStart: Math.max(0, start),
//     trimEnd: Math.min(get().videoDuration, end)
//   }),
  
//   // FFmpeg actions
//   initializeFFmpeg: async () => {
//     try {
//       set({ ffmpegStatus: 'initializing' });
//       const { initializeFFmpeg } = await import('./ffmpegClient');
//       await initializeFFmpeg();
//       set({ ffmpegStatus: 'ready' });
//     } catch (error) {
//       console.error('FFmpeg init error:', error);
//       set({ 
//         ffmpegStatus: 'error',
//         trimError: error.message.includes('sharedArrayBuffer')
//           ? 'Video processor requires secure context (HTTPS)'
//           : 'Failed to initialize video processor'
//       });
//     }
//   },
  
//   // Video processing
//   trimVideo: async () => {
//     const { videoFile, trimStart, trimEnd} = get();
    
//     if (!videoFile) {
//       set({ trimError: 'No video selected' });
//       return false;
//     }
    
//     if (trimStart >= trimEnd) {
//       set({ trimError: 'Invalid trim range' });
//       return false;
//     }

//     set({ isProcessing: true, trimError: null });
    
//     try {
//       const { trimVideoWithFFmpeg } = await import('./ffmpegClient');
//       const result = await trimVideoWithFFmpeg(videoFile, trimStart, trimEnd);
      
//       set({
//         videoFile: result.file,
//         videoUrl: result.url,
//         isProcessing: false,
//         // Keep trimStart and trimEnd as is to reflect trimmed segment playback
//         // trimStart: 0,
//         // trimEnd: videoDuration
//       });
      
//       return true;
//     } catch (error) {
//       console.error('Trim error:', error);
//       set({
//         isProcessing: false,
//         trimError: error.message || 'Video processing failed'
//       });
//       return false;
//     }
//   },
  
//   reset: () => set({
//     videoFile: null,
//     videoUrl: null,
//     videoDuration: 0,
//     currentTime: 0,
//     isPlaying: false,
//     trimStart: 0,
//     trimEnd: 0,
//     isTrimming: false,
//     isProcessing: false,
//     trimError: null,
//     ffmpegStatus: 'idle'
//   })
// }));

// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// export const useEditorStore = create(
//   persist(
//   (set, get) => ({
//   // Video state
//   videoFile: null,
//   videoUrl: null,
//   videoDuration: 0,
//   currentTime: 0,
//   isPlaying: false,
  
//   // FFmpeg state
//   ffmpegStatus: 'idle', // 'idle' | 'initializing' | 'ready' | 'error'
  
//   // Timeline state
//   trimStart: 0,
//   trimEnd: 0,
//   isTrimming: false,
//   isProcessing: false,
//   trimError: null,

//   // Actions
//   setVideoFile: (file, url) => set({ videoFile: file, videoUrl: url }),
//   setVideoDuration: (duration) => set({ 
//     videoDuration: duration,
//     trimEnd: duration 
//   }),
//   setCurrentTime: (time) => set({ currentTime: time }),
//   setIsPlaying: (isPlaying) => set({ isPlaying }),
  
//   // Timeline actions
//   startTrimming: () => set({ isTrimming: true, trimError: null }),
//   stopTrimming: () => set({ isTrimming: false }),
//   setTrimPoints: (start, end) => {
//     const videoDuration = get().videoDuration;

//     const clampedStart = Math.max(0, Math.min(start, videoDuration));
//     const clampedEnd = Math.max(0, Math.min(end, videoDuration));

//     if (clampedStart >= clampedEnd) {
//       console.warn('Invalid trim range - start >= end:', {
//         clampedStart,
//         clampedEnd,
//       });
//       return; // Prevent state update
//     }

//     console.log('Setting trim points:', { clampedStart, clampedEnd });

//     set({trimStart: clampedStart, trimEnd: clampedEnd });
//   },
  
//   // FFmpeg actions
//   initializeFFmpeg: async () => {
//     try {
//       set({ ffmpegStatus: 'initializing' });
//       const { initializeFFmpeg } = await import('./ffmpegClient');
//       await initializeFFmpeg();
//       set({ ffmpegStatus: 'ready' });
//     } catch (error) {
//       console.error('FFmpeg init error:', error);
//       let errorMessage = 'Failed to initialize video processor';
      
//       if (error.isSharedArrayBufferError || error.message.includes('SharedArrayBuffer')) {
//         errorMessage = `
//           Video processor requires secure context (HTTPS) with:
//           1. Cross-Origin-Embedder-Policy: require-corp
//           2. Cross-Origin-Opener-Policy: same-origin
          
//           If testing locally, try:
//           1. Using Chrome with --enable-features=SharedArrayBuffer flag
//           2. Serving over HTTPS with proper headers
//         `;
//       }
      
//       set({ 
//         ffmpegStatus: 'error',
//         trimError: errorMessage
//       });
//     }
//   },
  
//   // Video processing
//   trimVideo: async () => {
//     const { videoFile, trimStart, trimEnd, ffmpegStatus } = get();
    
//     if (!videoFile) {
//       set({ trimError: 'No video selected' });
//       return false;
//     }
    
//     if (trimStart >= trimEnd) {
//       set({ trimError: 'Invalid trim range' });
//       return false;
//     }

//     // Ensure FFmpeg is initialized
//     if (ffmpegStatus !== 'ready') {
//       try {
//         await get().initializeFFmpeg();
//       } catch (error) {
//         return false;
//       }
//     }

//     set({ isProcessing: true, trimError: null });
    
//     try {
//       const { trimVideoWithFFmpeg } = await import('./ffmpegClient');
//       const result = await trimVideoWithFFmpeg(videoFile, trimStart, trimEnd);
      
//       set({
//         videoFile: result.file,
//         videoUrl: result.url,
//         isProcessing: false,
//       });
      
//       return true;
//     } catch (error) {
//       console.error('Trim error:', error);
//       set({
//         isProcessing: false,
//         trimError: error.message || 'Video processing failed'
//       });
//       return false;
//     }
//   },
  
//   reset: () => set({
//     videoFile: null,
//     videoUrl: null,
//     videoDuration: 0,
//     currentTime: 0,
//     isPlaying: false,
//     trimStart: 0,
//     trimEnd: 0,
//     isTrimming: false,
//     isProcessing: false,
//     trimError: null,
//     ffmpegStatus: 'idle'
//   })
// }));


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useEditorStore = create(
  persist(
    (set, get) => ({
      // Video state
      videoData: null,
      videoFile: null,
      videoUrl: null,
      videoName: null,
      videoType: null,
      videoDuration: 0,
      currentTime: 0,
      isPlaying: false,
      
      // FFmpeg state
      ffmpegStatus: 'idle',
      
      // Timeline state
      trimStart: 0,
      trimEnd: 0,
      isTrimming: false,
      isProcessing: false,
      trimError: null,

      // Canvas state
      canvasObjects: [],
      activeTool: null,

      // Actions
      setVideoFile: async (file) => {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('Video file too large (max 50MB)');
        }

        try {
          set({
            videoFile: file,
            videoUrl: URL.createObjectURL(file),
            videoData: null,
            videoNme: file.name,
            videoType: file.type,
            videoDuration: 0,
            currentTime: 0
          });
        } catch (error) {
          console.error('Error processing video:', error);
          throw error;
        }
      },

      restoreVideo: async () => {
        const { videoData, videoName, videoType } = get();
        if (!videoData) return;

        try {
          // Convert base64 bacl to Blob
          const byteString = atob(videoData.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);

          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }

          const blob = new Blob([ab], { type: videoType });
          const videoUrl = URL.createObjectURL(blob);
          const videoFile = new File([blob], videoName, { type: videoType });

          set({
            videoFile,
            videoUrl,
            // Keep other video state like duration/currentTime from persistence
            // videoDuration,
            // currentTime
          });
        } catch (error) {
          console.error('Video restoration failed:', error);
          throw error;
        }
      },

      setVideoDuration: (duration) => set({ 
        videoDuration: duration,
        trimEnd: duration 
      }),

      setCurrentTime: (time) => set({ currentTime: time }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      // Timeline actions
      startTrimming: () => set({ isTrimming: true, trimError: null }),
      stopTrimming: () => set({ isTrimming: false }),
      setTrimPoints: (start, end) => {
        const { videoDuration } = get();
        const clampedStart = Math.max(0, Math.min(start, videoDuration));
        const clampedEnd = Math.max(0, Math.min(end, videoDuration));
        
        if (clampedStart >= clampedEnd) return;
        set({ trimStart: clampedStart, trimEnd: clampedEnd });
      },
      
      // Canvas actions
      setActiveTool: (tool) => set({ activeTool: tool }),
      addCanvasObject: (object) => 
        set(state => ({ canvasObjects: [...state.canvasObjects, object] })),
      updateCanvasObject: (id, updates) =>
        set(state => ({
          canvasObjects: state.canvasObjects.map(obj =>
            obj.id === id ? { ...obj, ...updates } : obj
          )
        })),
      removeCanvasObject: (id) =>
        set(state => ({
          canvasObjects: state.canvasObjects.filter(obj => obj.id !== id)
        })),
      
      // Video restoration
      initializeVideo: async () => {
        const { videoData } = get();
        if (!videoData) return null;

        try {
          // Recreate blob URL if it was lost
          const parts = videoData.split(',');
          const mimeType = parts[0].match(/:(.*?);/)[1];
          const byteString = atob(parts[1]);
          const buffer = new Uint8Array(byteString.length);

          for (let i = 0; i < byteString.length; i++) {
            buffer[i] = byteString.charCodeAt(i);
          }

          const blob = new Blob([buffer], { type: mimeType });
          const url = URL.createObjectURL(blob);
          
          set({ 
            videoUrl: url,
            videoFile: new File([blob], 'restored-video.mp4', { type: mimeType })
          });
          return url;
        } catch (error) {
          console.error('Video restoration failed:', error);
          throw new Error('Failed to restore video');
        }
      },
      
      // FFmpeg actions
      initializeFFmpeg: async () => {
        try {
          set({ ffmpegStatus: 'initializing' });
          const { initializeFFmpeg } = await import('./ffmpegClient');
          await initializeFFmpeg();
          set({ ffmpegStatus: 'ready' });
        } catch (error) {
          console.error('FFmpeg init error:', error);
          set({ 
            ffmpegStatus: 'error',
            trimError: error.isSharedArrayBufferError 
              ? 'Requires secure context (HTTPS)' 
              : 'Failed to initialize'
          });
        }
      },
      
      // Video processing
      trimVideo: async () => {
        const { videoFile, trimStart, trimEnd } = get();
        
        if (!videoFile || trimStart >= trimEnd) {
          set({ trimError: !videoFile ? 'No video selected' : 'Invalid trim range' });
          return false;
        }

        set({ isProcessing: true, trimError: null });
        
        try {
          const { trimVideoWithFFmpeg } = await import('./ffmpegClient');
          const result = await trimVideoWithFFmpeg(videoFile, trimStart, trimEnd);
          
          set({
            videoFile: result.file,
            videoUrl: result.url,
            isProcessing: false,
          });
          
          return true;
        } catch (error) {
          set({ isProcessing: false, trimError: error.message });
          return false;
        }
      },
      
      reset: () => {
        const { videoUrl } = get();
        if (videoUrl) URL.revokeObjectURL(videoUrl);

        set({
          videoFile: null,
          videoUrl: null,
          videoDuration: 0,
          currentTime: 0,
          isPlaying: false,
          trimStart: 0,
          trimEnd: 0,
          isTrimming: false,
          isProcessing: false,
          trimError: null,
          ffmpegStatus: 'idle',
          canvasObjects: [],
          activeTool: null
        })
      }
    }),
    {
      name: 'video-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these states
        // videoData: state.videoData,
        videoName: state.videoName,
        videoType: state.videoType,
        videoDuration: state.videoDuration,
        currentTime: state.currentTime,
        trimStart: state.trimStart,
        trimEnd: state.trimEnd,
        canvasObjects: state.canvasObjects
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        // Reset temporary states
        videoData: null,
        isProcessing: false,
        isTrimming: false,
        ffmpegStatus: 'idle',
        // These will be restored by restoreVideo()
        videoUrl: null, // Will be recreated in initializevideo
        videoFile: null // Will be recreated in initializeVideo
      })
    }
  )
);