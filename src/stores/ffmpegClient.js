// import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// let ffmpegInstance = null;
// let isInitializing = false;

// export const initializeFFmpeg = async () => {
//   if (ffmpegInstance) return ffmpegInstance;
//   if (isInitializing) {
//     return new Promise((resolve) => {
//       const checkInitialized = setInterval(() => {
//         if (ffmpegInstance) {
//           clearInterval(checkInitialized);
//           resolve(ffmpegInstance);
//         }
//       }, 100);
//     });
//   }

//   isInitializing = true;
//   try {
//     // Check for cross-origin isolation
//     const hasSharedArrayBuffer = typeof window !== 'undefined' && typeof window.SharedArrayBuffer !== 'undefined';
//     const isCrossOriginIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
//     if (!hasSharedArrayBuffer || !isCrossOriginIsolated) {
//       console.warn('Using single-threaded FFmpeg due to missing SharedArrayBuffer or cross-origin isolation');
//       ffmpegInstance = createFFmpeg({
//         log: true,
//         corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
//         wasmPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm',
//         coreOptions: { noThreading: true }
//       });
//     } else {
//       ffmpegInstance = createFFmpeg({
//         log: true,
//         corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
//         wasmPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm'
//       });
//     }

//     await ffmpegInstance.load();
//     return ffmpegInstance;
//   } catch (error) {
//     console.error('FFmpeg initialization error:', error);
//     throw new Error(`FFmpeg failed to initialize: ${error.message}`);
//   } finally {
//     isInitializing = false;
//   }
// };

// export const trimVideoWithFFmpeg = async (file, startTime, endTime) => {
//   if (!file) throw new Error('No video file selected');
//   if (startTime >= endTime) throw new Error('Start time must be before end time');
//   if (endTime - startTime < 0.5) throw new Error('Minimum trim duration is 0.5 seconds');

//   const ffmpeg = await initializeFFmpeg();

//   try {
//     // Clear previous files
//     await Promise.all([
//       ffmpeg.FS('unlink', 'input.mp4').catch(() => {}),
//       ffmpeg.FS('unlink', 'output.mp4').catch(() => {})
//     ]);

//     // Write input file
//     const fileData = await fetchFile(file);
//     ffmpeg.FS('writeFile', 'input.mp4', fileData);

//     // Execute trim command
//     await ffmpeg.run(
//       '-i', 'input.mp4',
//       '-ss', startTime.toString(),
//       '-to', endTime.toString(),
//       '-c:v', 'copy', // No re-encoding
//       '-c:a', 'copy',
//       '-avoid_negative_ts', 'make_zero',
//       'output.mp4'
//     );

//     // Read output
//     const outputData = ffmpeg.FS('readFile', 'output.mp4');
//     if (outputData.length === 0) throw new Error('Processing failed: empty output file');

//     return {
//       url: URL.createObjectURL(new Blob([outputData.buffer], { type: 'video/mp4' })),
//       file: new File([outputData.buffer], `trimmed_${file.name}`, { type: 'video/mp4' })
//     };
//   } catch (error) {
//     console.error('FFmpeg processing error:', error);
//     throw new Error(`Video processing failed: ${error.message || 'Unknown error'}`);
//   } finally {
//     // Cleanup
//     await Promise.all([
//       ffmpeg.FS('unlink', 'input.mp4').catch(() => {}),
//       ffmpeg.FS('unlink', 'output.mp4').catch(() => {})
//     ]);
//   }
// };

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// Initialize FFmpeg with configuration
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
  progress: ({ ratio }) => {
    if (window.onFFmpegProgress) {
      window.onFFmpegProgress(ratio);
    }
  }
});

/**
 * Initializes FFmpeg with proper error handling for SharedArrayBuffer
 * @throws {Error} If initialization fails
 */

export async function initializeFFmpeg() {
  try {
    // Check for SharedArrayBuffer support
    if (typeof SharedArrayBuffer === 'undefined') {
      const error = new Error(
        'SharedArrayBuffer not available. The server needs Cross-Origin-Isolation headers.'
      );
      error.isSharedArrayBufferError = true;
      throw error;
    }

    // Set logger to debug FFmpeg output
    ffmpeg.setLogger(({ type, message }) => {
      console.log(`[FFmpeg ${type}] ${message}`);
    });

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    return ffmpeg;
  } catch (error) {
    console.error('FFmpeg initialization error:', error);
    throw error;
  }
}

async function verifyVideoFile(data, filename) {
  return new Promise((resolve) => {
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      // Don't reject here - we'll let FFmpeg handle the error
      resolve(blob);
    };
    video.src = url;
  });
}

/**
 * Trims a video file using FFmpeg
 * @param {File} file - Video file to trim
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {Function} progressCallback - Optional callback for progress updates
 * @param {Object} options - Optional codec/preset overrides
 * @returns {Promise<{file: File, url: string}>} Trimmed video file and URL
 */
export async function trimVideoWithFFmpeg(file, startTime, endTime, progressCallback, options = {}) {
  // Add right after the existing validations
  if (endTime - startTime < 0.5) {  // Minimum 0.5 second duration
    throw new Error('Trim duration must be at least 0.5 seconds');
  }

  if (!ffmpeg.isLoaded()) {
    await initializeFFmpeg();
  }

  let inputName, outputName;

  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid or empty file provided');
    }

    if (startTime >= endTime) {
      throw new Error('Start time must be less than end time');
    }

    // Register progress callback if provided
    if (progressCallback) {
      window.onFFmpegProgress = progressCallback;
    }

    // Generate unique filename to prevent conflicts
    const videoCodec = options.videoCodec || 'libx264';
    const audioCodec = options.audioCodec || 'aac';
    const preset = options.preset || 'ultrafast';

    inputName = `input_${Date.now()}.mp4`;
    outputName = `output_${Date.now()}.mp4`;

    // Use fetchFile instead of FileReader for better reliability
    const fileData = await fetchFile(file);


    // Write input file
    ffmpeg.FS('writeFile', inputName, fileData);
    
    // Run FFmpeg command to trim video
    console.log('Running FFmpeg trim command...');
    await ffmpeg.run(
      '-y', 
      '-ss', startTime.toString(),
      '-i', inputName,
      '-to', endTime.toString(),
      '-c:v', videoCodec,
      '-preset', preset,
      '-movflags', '+faststart',
      '-avoid_negative_ts', 'make_zero',
      '-c:a', audioCodec,
      '-strict', 'experimental',
      '-f', 'mp4', // Force MP4 container format
      '-pix_fmt', 'yuv420p', // Add this
      outputName
    );
    console.log('FFmpeg command complete.');
    console.log('FFmpeg FS contents:', ffmpeg.FS('readdir', '/'));
    
    //Verify the file exists before reading
    const files = ffmpeg.FS('readdir', '/');
    if (!files.includes(outputName)) {
      throw new Error(`Output file ${outputName} not found in FFmpeg FS`);
    }

    // Read the result
    const data = ffmpeg.FS('readFile', outputName);

    // // Clean up files from FFmpeg's virtual FS
    // ffmpeg.FS('unlink', inputName);
    // ffmpeg.FS('unlink', outputName);
    
    // Create a new File object
    const blob = await verifyVideoFile(data, outputName);
    const url = URL.createObjectURL(blob);
    const trimmedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '_trimmed.mp4', {
      type: 'video/mp4',
      lastModified: Date.now()
    });

    if (data.length < 102400) {  // 100KB minimum size
      console.error('Output file too small. Filesize:', data.length);
      throw new Error('Processing failed - output video is too small');
    }
    
    return { file: trimmedFile, url };
  } catch (error) {
    console.error('Video trimming error:', error);
    throw new Error('Failed to trim video: ' + error.message);
  } finally {
    // Clean up progress callback
    if (inputName) {
      try { ffmpeg.FS('unlink', inputName); } catch (e) {}
    }
    if (outputName) {
      try { ffmpeg.FS('unlink', outputName); } catch (e) {}
    }
    window.onFFmpegProgress = null;
  }
}

// Helper function to read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}