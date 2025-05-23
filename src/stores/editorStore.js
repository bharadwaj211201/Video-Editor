import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  // Video state
  videoFile: null,
  videoUrl: null,
  videoDuration: 0,
  currentTime: 0,
  isPlaying: false,
  
  // FFmpeg state
  ffmpegStatus: 'idle', // 'idle' | 'initializing' | 'ready' | 'error'
  
  // Timeline state
  trimStart: 0,
  trimEnd: 0,
  isTrimming: false,
  isProcessing: false,
  trimError: null,

  // Actions
  setVideoFile: (file, url) => set({ videoFile: file, videoUrl: url }),
  setVideoDuration: (duration) => set({ 
    videoDuration: duration,
    trimEnd: duration 
  }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  // Timeline actions
  startTrimming: () => set({ isTrimming: true, trimError: null }),
  stopTrimming: () => set({ isTrimming: false }),
  setTrimPoints: (start, end) => set({ 
    trimStart: Math.max(0, start),
    trimEnd: Math.min(get().videoDuration, end)
  }),
  
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
        trimError: error.message.includes('sharedArrayBuffer')
          ? 'Video processor requires secure context (HTTPS)'
          : 'Failed to initialize video processor'
      });
    }
  },
  
  // Video processing
  trimVideo: async () => {
    const { videoFile, trimStart, trimEnd} = get();
    
    if (!videoFile) {
      set({ trimError: 'No video selected' });
      return false;
    }
    
    if (trimStart >= trimEnd) {
      set({ trimError: 'Invalid trim range' });
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
        // Keep trimStart and trimEnd as is to reflect trimmed segment playback
        // trimStart: 0,
        // trimEnd: videoDuration
      });
      
      return true;
    } catch (error) {
      console.error('Trim error:', error);
      set({
        isProcessing: false,
        trimError: error.message || 'Video processing failed'
      });
      return false;
    }
  },
  
  reset: () => set({
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
    ffmpegStatus: 'idle'
  })
}));