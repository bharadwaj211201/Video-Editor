// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { useEditorStore } from '../stores/editorStore';

// export default function ExportPanel({ onBack }) {
//   const [exportProgress, setExportProgress] = useState(0);
//   const [isExporting, setIsExporting] = useState(false);
//   const [exportError, setExportError] = useState(null);
//   const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  
//   const {
//     videoFile,
//     videoUrl,
//     trimStart,
//     trimEnd
//   } = useEditorStore();
  
//   let end = trimEnd + 10;

//   const handleExport = async () => {
//     if (!videoFile) {
//       setExportError("No video file selected.");
//       return;
//     }

//     console.log('Exporting with trimStart:', trimStart, 'trimEnd:', end);

//     const start = parseFloat(trimStart);
//     const endtime = parseFloat(end);

//     if (isNaN(start) || isNaN(endtime)) {
//       setExportError("Invalid trim time values.");
//       return;
//     }

//     if (start >= endtime) {
//       setExportError("Start time must be less than end time.");
//       return;
//     }
    
//     setIsExporting(true);
//     setExportError(null);
    
//     try {
//       // Simulate export process (replace with actual FFmpeg processing)
//       const { initializeFFmpeg, trimVideoWithFFmpeg } = await import ('../stores/ffmpegClient.js');
//       await initializeFFmpeg();

//       const result = await trimVideoWithFFmpeg(
//         videoFile,
//         start,
//         endtime,
//         (progress) => setExportProgress(Math.floor(progress * 100))
//       );

//       setExportedVideoUrl(result.url)
      
//       // Here you would use FFmpeg to:
//       // 1. Trim the video
//       // 2. Apply overlays from canvasObjects
//       // 3. Mix audio tracks
//       // 4. Export final video
      
//       // For now, we'll just create a download link to the original video
//       const a = document.createElement('a');
//       a.href = result.url;
//       a.download = 'edited-video.mp4';
//       a.click();
      
//     } catch (error) {
//       console.error('Export failed:', error);
//       setExportError(error.message || 'Export failed. Please try again.');
//     } finally {
//       setIsExporting(false);
//     }
//   };
  


//   return (
//     <div className="p-4">
//       <button 
//         onClick={onBack}
//         className="flex items-center text-blue-400 hover:text-blue-300 mb-4"
//       >
//         <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//         </svg>
//         Back to Editor
//       </button>
      
//       <h3 className="text-lg font-semibold mb-4">Export Video</h3>
      
//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">Format</label>
//           <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
//             <option>MP4</option>
//             <option>GIF</option>
//             <option>WebM</option>
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1">Quality</label>
//           <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
//             <option>High</option>
//             <option>Medium</option>
//             <option>Low</option>
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1">Resolution</label>
//           <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
//             <option>Original</option>
//             <option>1080p</option>
//             <option>720p</option>
//             <option>480p</option>
//           </select>
//         </div>
        
//         {isExporting ? (
//           <div className="pt-2">
//             <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
//               <motion.div 
//                 className="h-full bg-blue-500"
//                 initial={{ width: '0%' }}
//                 animate={{ width: `${exportProgress}%` }}
//                 transition={{ duration: 0.3 }}
//               />
//             </div>
//             <p className="text-center text-sm mt-2">Exporting... {exportProgress}%</p>
//           </div>
//         ) : (
//           <button
//             onClick={handleExport}
//             disabled={isExporting}
//             className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
//           >
//             Export Video
//           </button>
//         )}
        
//         {exportError && (
//           <div className="text-red-400 text-sm mt-2">{exportError}</div>
//         )}
//       </div>
//     </div>
//   );
// }
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '../stores/editorStore';

export default function ExportPanel({ onBack }) {
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);

  const {
    videoFile,
    videoUrl,
    trimStart,
    trimEnd
  } = useEditorStore();

  const handleExport = async () => {
    if (!videoFile) {
      setExportError("No video file selected.");
      return;
    }

    const start = parseFloat(trimStart);
    const endtime = parseFloat(trimEnd) + 10; // Correctly parse before adding

    console.log('Exporting with trimStart:', start, 'trimEnd:', endtime);

    if (isNaN(start) || isNaN(endtime)) {
      setExportError("Invalid trim time values.");
      return;
    }

    if (start >= endtime) {
      setExportError("Start time must be less than end time.");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      // Simulate export process (replace with actual FFmpeg processing)
      const { initializeFFmpeg, trimVideoWithFFmpeg } = await import('../stores/ffmpegClient.js');
      await initializeFFmpeg();

      const result = await trimVideoWithFFmpeg(
        videoFile,
        start,
        endtime,
        (progress) => setExportProgress(Math.floor(progress * 100))
      );

      setExportedVideoUrl(result.url);

      // Create download link
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.file.name;
      a.click();

    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={onBack}
        className="flex items-center text-blue-400 hover:text-blue-300 mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Editor
      </button>

      <h3 className="text-lg font-semibold mb-4">Export Video</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Format</label>
          <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
            <option>MP4</option>
            <option>GIF</option>
            <option>WebM</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quality</label>
          <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Resolution</label>
          <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
            <option>Original</option>
            <option>1080p</option>
            <option>720p</option>
            <option>480p</option>
          </select>
        </div>

        {isExporting ? (
          <div className="pt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: `${exportProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-center text-sm mt-2">Exporting... {exportProgress}%</p>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
          >
            Export Video
          </button>
        )}

        {exportError && (
          <div className="text-red-400 text-sm mt-2">{exportError}</div>
        )}
      </div>
    </div>
  );
}
