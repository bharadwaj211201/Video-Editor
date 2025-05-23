import { useState } from 'react';
import { useEditorStore } from './stores/editorStore';
import Toolbar from './components/Toolbar';
import VideoPlayer from './components/VideoPlayer';
import CanvasEditor from './components/CanvasEditor';
import Timeline from './components/Timeline';
import ExportPanel from './components/ExportPanel';
import PropertiesPanel from './components/PropertiesPanel';
import UploadVideoSection from './components/UploadVideoSection';

function App() {
  const { videoUrl, reset, isPlaying, setIsPlaying } = useEditorStore();
  const [activeTab, setActiveTab] = useState('edit');

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Video Editor</h1>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Toolbar */}
        <Toolbar />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Preview Area */}
          <div className="relative flex-1 bg-black overflow-hidden">
            {videoUrl ? (
              <>
                <VideoPlayer />
                <CanvasEditor />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <UploadVideoSection />
              </div>
            )}
          </div>

          {/* Timeline */}
          {videoUrl && <Timeline />}
        </div>

        {/* Right Sidebar - Properties/Export */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {activeTab === 'edit' ? (
            <PropertiesPanel />
          ) : (
            <ExportPanel onBack={() => setActiveTab('edit')} />
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button 
            onClick={() => reset()}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            New Project
          </button>
        </div>
        <div>
          <button 
            onClick={() => setActiveTab('export')}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Export Video
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;