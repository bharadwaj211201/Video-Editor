import { useEditorStore } from '../stores/editorStore';

export default function UploadVideoSection() {
  const { setVideoFile, setVideoUrl } = useEditorStore();
  
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
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg inline-block">
        Select Video File
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </label>
    </div>
  );
}