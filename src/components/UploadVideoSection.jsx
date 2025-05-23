// import { useEditorStore } from '../stores/editorStore';

// export default function UploadVideoSection() {
//   const { setVideoFile, setVideoUrl } = useEditorStore();
  
//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const url = URL.createObjectURL(file);
//       setVideoFile(file, url);
//     }
//   };

//   return (
//     <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
//       <h2 className="text-xl mb-4">Upload a Video to Start Editing</h2>
//       <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg inline-block">
//         Select Video File
//         <input 
//           type="file" 
//           accept="video/*" 
//           onChange={handleFileChange} 
//           className="hidden" 
//         />
//       </label>
//     </div>
//   );
// }

import { useEditorStore } from '../stores/editorStore';
import { useEffect } from 'react';

export default function UploadVideoSection() {
  const { setVideoFile, setVideoUrl, initializeFFmpeg, ffmpegStatus } = useEditorStore();
  
  // Initialize FFmpeg when component mounts
  useEffect(() => {
    initializeFFmpeg();
  }, [initializeFFmpeg]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(file, url);
    }
  };

  return (
    <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
      <h2 className="text-xl mb-4">Upload a Video to Start Editing</h2>
      
      {ffmpegStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Video processor initialization failed. See console for details.</p>
          <p className="text-sm mt-1">
            Note: This feature requires HTTPS with special security headers.
          </p>
        </div>
      )}
      
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg inline-block">
        Select Video File
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={ffmpegStatus === 'error'}
        />
      </label>
      
      {ffmpegStatus === 'initializing' && (
        <div className="mt-4 text-blue-600">Initializing video processor...</div>
      )}
    </div>
  );
}