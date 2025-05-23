// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { useEditorStore } from '../stores/editorStore';

// export default function Toolbar() {
//   const { addCanvasObject } = useEditorStore();
//   const [activeTool, setActiveTool] = useState(null);
  
//   const addText = () => {
//     const id = Date.now().toString();
//     addCanvasObject({
//       id,
//       type: 'text',
//       text: 'Double click to edit',
//       left: 100,
//       top: 100,
//       fill: '#ffffff',
//       fontSize: 40,
//       fontFamily: 'Arial',
//       opacity: 1
//     });
//   };
  
//   const addRectangle = () => {
//     const id = Date.now().toString();
//     addCanvasObject({
//       id,
//       type: 'rect',
//       left: 100,
//       top: 100,
//       width: 100,
//       height: 100,
//       fill: '#ffffff',
//       opacity: 0.7
//     });
//   };
  
//   return (
//     <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
//       <ToolButton 
//         icon="T" 
//         tooltip="Add Text" 
//         onClick={addText}
//         active={activeTool === 'text'}
//       />
//       <ToolButton 
//         icon="□" 
//         tooltip="Add Rectangle" 
//         onClick={addRectangle}
//         active={activeTool === 'rect'}
//       />
//       <ToolButton 
//         icon="🖼️" 
//         tooltip="Add Image" 
//         onClick={() => setActiveTool('image')}
//         active={activeTool === 'image'}
//       />
//       <ToolButton 
//         icon="✏️" 
//         tooltip="Draw" 
//         onClick={() => setActiveTool('draw')}
//         active={activeTool === 'draw'}
//       />
//       <div className="border-t border-gray-700 w-10 my-2"></div>
//       <ToolButton 
//         icon="✂️" 
//         tooltip="Trim Video" 
//         onClick={() => setActiveTool('trim')}
//         active={activeTool === 'trim'}
//       />
//       <ToolButton 
//         icon="🎵" 
//         tooltip="Add Audio" 
//         onClick={() => setActiveTool('audio')}
//         active={activeTool === 'audio'}
//       />
//     </div>
//   );
// }

// function ToolButton({ icon, tooltip, onClick, active }) {
//   return (
//     <motion.button
//       whileHover={{ scale: 1.1 }}
//       whileTap={{ scale: 0.95 }}
//       className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${active ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
//       onClick={onClick}
//       title={tooltip}
//     >
//       {icon}
//     </motion.button>
//   );
// }

import { motion } from 'framer-motion';
import { useEditorStore } from '../stores/editorStore';

export default function Toolbar() {
  const { 
    addCanvasObject, 
    setActiveTool, 
    activeTool,
    isPlaying,
    setIsPlaying
  } = useEditorStore();
  
  const addText = () => {
    setActiveTool('text');
    addCanvasObject({
      type: 'text',
      text: 'Double click to edit',
      fontSize: 40,
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
  };
  
  const addRectangle = () => {
    setActiveTool('rect');
    addCanvasObject({
      type: 'rect',
      width: 100,
      height: 100,
      fill: '#ffffff',
      opacity: 0.7
    });
  };

  const addImage = () => {
    setActiveTool('image');
    // Implement image upload logic here
  };

  const startDrawing = () => {
    setActiveTool('draw');
  };

  const startTrimming = () => {
    setActiveTool('trim');
  };

  return (
    <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
      <ToolButton 
        icon="T" 
        tooltip="Add Text" 
        onClick={addText}
        active={activeTool === 'text'}
      />
      <ToolButton 
        icon="□" 
        tooltip="Add Rectangle" 
        onClick={addRectangle}
        active={activeTool === 'rect'}
      />
      <ToolButton 
        icon="🖼️" 
        tooltip="Add Image" 
        onClick={addImage}
        active={activeTool === 'image'}
      />
      <ToolButton 
        icon="✏️" 
        tooltip="Draw" 
        onClick={startDrawing}
        active={activeTool === 'draw'}
      />
      <div className="border-t border-gray-700 w-10 my-2"></div>
      <ToolButton 
        icon="✂️" 
        tooltip="Trim Video" 
        onClick={startTrimming}
        active={activeTool === 'trim'}
      />
      <ToolButton 
        icon={isPlaying ? '⏸️' : '▶️'}
        tooltip={isPlaying ? 'Pause' : 'Play'}
        onClick={() => setIsPlaying(!isPlaying)}
        active={false}
      />
    </div>
  );
}

function ToolButton({ icon, tooltip, onClick, active }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
        active ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
      }`}
      onClick={onClick}
      title={tooltip}
    >
      {icon}
    </motion.button>
  );
}