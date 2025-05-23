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

import { createFFmpeg } from '@ffmpeg/ffmpeg';

// Initialize FFmpeg with configuration
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
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

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    return ffmpeg;
  } catch (error) {
    console.error('FFmpeg initialization error:', error);
    throw error;
  }
}

/**
 * Trims a video file using FFmpeg
 * @param {File} file - Video file to trim
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<{file: File, url: string}>} Trimmed video file and URL
 */
export async function trimVideoWithFFmpeg(file, startTime, endTime) {
  if (!ffmpeg.isLoaded()) {
    await initializeFFmpeg();
  }

  try {
    // Read the file
    const fileData = await readFileAsArrayBuffer(file);
    const fileName = file.name;
    const outputName = `trimmed_${fileName}`;
    
    // Write file to FFmpeg's virtual file system
    ffmpeg.FS('writeFile', fileName, new Uint8Array(fileData));
    
    // Run FFmpeg command to trim video
    await ffmpeg.run(
      '-i', fileName,
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy',
      outputName
    );
    
    // Read the result
    const data = ffmpeg.FS('readFile', outputName);
    
    // Create a new File object
    const trimmedFile = new File([data.buffer], outputName, { type: file.type });
    const url = URL.createObjectURL(trimmedFile);
    
    return { file: trimmedFile, url };
  } catch (error) {
    console.error('Video trimming error:', error);
    throw new Error('Failed to trim video: ' + error.message);
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