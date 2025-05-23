import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

let ffmpegInstance = null;
let isInitializing = false;

export const initializeFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;
  if (isInitializing) {
    return new Promise((resolve) => {
      const checkInitialized = setInterval(() => {
        if (ffmpegInstance) {
          clearInterval(checkInitialized);
          resolve(ffmpegInstance);
        }
      }, 100);
    });
  }

  isInitializing = true;
  try {
    // Check for cross-origin isolation
    const hasSharedArrayBuffer = typeof window !== 'undefined' && typeof window.SharedArrayBuffer !== 'undefined';
    const isCrossOriginIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
    if (!hasSharedArrayBuffer || !isCrossOriginIsolated) {
      console.warn('Using single-threaded FFmpeg due to missing SharedArrayBuffer or cross-origin isolation');
      ffmpegInstance = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        wasmPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm',
        coreOptions: { noThreading: true }
      });
    } else {
      ffmpegInstance = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        wasmPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm'
      });
    }

    await ffmpegInstance.load();
    return ffmpegInstance;
  } catch (error) {
    console.error('FFmpeg initialization error:', error);
    throw new Error(`FFmpeg failed to initialize: ${error.message}`);
  } finally {
    isInitializing = false;
  }
};

export const trimVideoWithFFmpeg = async (file, startTime, endTime) => {
  if (!file) throw new Error('No video file selected');
  if (startTime >= endTime) throw new Error('Start time must be before end time');
  if (endTime - startTime < 0.5) throw new Error('Minimum trim duration is 0.5 seconds');

  const ffmpeg = await initializeFFmpeg();

  try {
    // Clear previous files
    await Promise.all([
      ffmpeg.FS('unlink', 'input.mp4').catch(() => {}),
      ffmpeg.FS('unlink', 'output.mp4').catch(() => {})
    ]);

    // Write input file
    const fileData = await fetchFile(file);
    ffmpeg.FS('writeFile', 'input.mp4', fileData);

    // Execute trim command
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c:v', 'copy', // No re-encoding
      '-c:a', 'copy',
      '-avoid_negative_ts', 'make_zero',
      'output.mp4'
    );

    // Read output
    const outputData = ffmpeg.FS('readFile', 'output.mp4');
    if (outputData.length === 0) throw new Error('Processing failed: empty output file');

    return {
      url: URL.createObjectURL(new Blob([outputData.buffer], { type: 'video/mp4' })),
      file: new File([outputData.buffer], `trimmed_${file.name}`, { type: 'video/mp4' })
    };
  } catch (error) {
    console.error('FFmpeg processing error:', error);
    throw new Error(`Video processing failed: ${error.message || 'Unknown error'}`);
  } finally {
    // Cleanup
    await Promise.all([
      ffmpeg.FS('unlink', 'input.mp4').catch(() => {}),
      ffmpeg.FS('unlink', 'output.mp4').catch(() => {})
    ]);
  }
};