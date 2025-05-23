import { useEditorStore } from '../stores/editorStore';

export default function PropertiesPanel() {
  const { selectedObject, updateObject } = useEditorStore();
  
  if (!selectedObject) {
    return (
      <div className="p-4 text-center text-gray-400">
        Select an element to edit its properties
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Properties</h3>
      
      <div className="space-y-4">
        {selectedObject.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Text</label>
              <input
                type="text"
                value={selectedObject.text}
                onChange={(e) => updateObject(selectedObject.id, { text: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Font Size</label>
              <input
                type="number"
                value={selectedObject.fontSize}
                onChange={(e) => updateObject(selectedObject.id, { fontSize: parseInt(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input
            type="color"
            value={selectedObject.fill || '#ffffff'}
            onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
            className="w-full h-10"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedObject.opacity || 1}
            onChange={(e) => updateObject(selectedObject.id, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}