import { useState, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export default function useFFmpeg() {
  const [ffmpeg, setFFmpeg] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpegInstance = createFFmpeg({ 
          log: true,
          corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
        });
        
        ffmpegInstance.setProgress(({ ratio }) => {
          setProgress(Math.round(ratio * 100));
        });
        
        await ffmpegInstance.load();
        setFFmpeg(ffmpegInstance);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
      }
    };
    
    loadFFmpeg();
    
    return () => {
      if (ffmpeg) {
        // Clean up if needed
      }
    };
  }, []);
  
  const trimVideo = async (inputFile, startTime, endTime) => {
    if (!ffmpeg || !isLoaded) {
      throw new Error('FFmpeg not loaded');
    }
    
    // Write the file to FFmpeg's file system
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(inputFile));
    
    // Run the FFmpeg command to trim the video
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy',
      'output.mp4'
    );
    
    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');
    
    // Create a URL for the output file
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'video/mp4' })
    );
    
    return url;
  };
  
  const addOverlay = async (videoFile, canvasDataUrl) => {
    if (!ffmpeg || !isLoaded) {
      throw new Error('FFmpeg not loaded');
    }
    
    // Write files to FFmpeg's file system
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
    ffmpeg.FS('writeFile', 'overlay.png', await fetchFile(canvasDataUrl));
    
    // Run FFmpeg command to add overlay
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-i', 'overlay.png',
      '-filter_complex', '[0:v][1:v]overlay=0:0',
      '-c:a', 'copy',
      'output.mp4'
    );
    
    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');
    
    // Create a URL for the output file
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'video/mp4' })
    );
    
    return url;
  };
  
  return {
    isLoaded,
    progress,
    trimVideo,
    addOverlay
  };
}