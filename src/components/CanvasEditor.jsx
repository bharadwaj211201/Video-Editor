import { useEffect, useRef, useCallback, useState } from 'react';
import { 
  Canvas,
  Text as FabricText,
  Rect as FabricRect,
  Image as FabricImage,
  Path as FabricPath
} from 'fabric';
import { useEditorStore } from '../stores/editorStore';

export default function CanvasEditor() {
  const {
    videoUrl,
    currentTime,
    canvasObjects,
    addCanvasObject,
    setSelectedObject,
    updateObject,
    removeCanvasObject,
    selectedObject,
    activeTool,
    isPlaying,
    setIsPlaying
  } = useEditorStore();
  
  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const isDrawing = useRef(false);
  const lastPointer = useRef(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Initialize Fabric canvas
  const initCanvas = useCallback(() => {
    if (!videoUrl || !canvasContainerRef.current || fabricCanvas.current) return;
    
    // Create a new canvas element
    const canvasEl = document.createElement('canvas');
    canvasContainerRef.current.appendChild(canvasEl);
    canvasRef.current = canvasEl;
    
    fabricCanvas.current = new Canvas(canvasEl, {
      selection: activeTool === null,
      backgroundColor: 'transparent',
      preserveObjectStacking: true
    });

    // Event handlers
    const handleSelectionCreated = (e) => {
      if (e.selected && e.selected.length === 1) {
        const obj = e.selected[0];
        setSelectedObject({
          id: obj.id,
          type: obj.type,
          ...obj.toObject()
        });
      }
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    const handleObjectModified = (e) => {
      if (e.target) {
        updateObject(e.target.id, e.target.toObject());
      }
    };

    const handleObjectRemoved = (e) => {
      if (e.target) {
        removeCanvasObject(e.target.id);
      }
    };

    // Drawing mode handlers
    const handleMouseDown = (e) => {
      if (activeTool === 'draw' && e.target === null) {
        isDrawing.current = true;
        lastPointer.current = fabricCanvas.current.getPointer(e.e);
        const path = new FabricPath([], {
          stroke: '#ffffff',
          strokeWidth: 3,
          fill: null,
          selectable: false
        });
        path.id = Date.now().toString();
        fabricCanvas.current.add(path);
        fabricCanvas.current.renderAll();
      }
    };

    const handleMouseMove = (e) => {
      if (isDrawing.current && activeTool === 'draw') {
        const pointer = fabricCanvas.current.getPointer(e.e);
        const path = fabricCanvas.current.getObjects().find(obj => 
          obj.id === fabricCanvas.current.getObjects().slice(-1)[0]?.id
        );
        
        if (path && path.type === 'path') {
          path.path.push([
            'L',
            pointer.x,
            pointer.y
          ]);
          path.setCoords();
          fabricCanvas.current.renderAll();
        }
      }
    };

    const handleMouseUp = () => {
      if (isDrawing.current && activeTool === 'draw') {
        isDrawing.current = false;
        const path = fabricCanvas.current.getObjects().slice(-1)[0];
        if (path) {
          addCanvasObject({
            type: 'path',
            path: path.path,
            stroke: path.stroke,
            strokeWidth: path.strokeWidth,
            left: path.left,
            top: path.top
          });
        }
      }
    };

    fabricCanvas.current.on('selection:created', handleSelectionCreated);
    fabricCanvas.current.on('selection:cleared', handleSelectionCleared);
    fabricCanvas.current.on('object:modified', handleObjectModified);
    fabricCanvas.current.on('object:removed', handleObjectRemoved);
    fabricCanvas.current.on('mouse:down', handleMouseDown);
    fabricCanvas.current.on('mouse:move', handleMouseMove);
    fabricCanvas.current.on('mouse:up', handleMouseUp);

    setCanvasInitialized(true);

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off('selection:created', handleSelectionCreated);
        fabricCanvas.current.off('selection:cleared', handleSelectionCleared);
        fabricCanvas.current.off('object:modified', handleObjectModified);
        fabricCanvas.current.off('object:removed', handleObjectRemoved);
        fabricCanvas.current.off('mouse:down', handleMouseDown);
        fabricCanvas.current.off('mouse:move', handleMouseMove);
        fabricCanvas.current.off('mouse:up', handleMouseUp);
        
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      
      if (canvasRef.current && canvasContainerRef.current?.contains(canvasRef.current)) {
        canvasContainerRef.current.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
      setCanvasInitialized(false);
    };
  }, [videoUrl, activeTool]);

  // Sync canvas objects with store
  useEffect(() => {
    if (!fabricCanvas.current || !canvasInitialized) return;
    
    // Remove objects not in store
    fabricCanvas.current.getObjects().forEach(obj => {
      if (!canvasObjects.some(storeObj => storeObj.id === obj.id)) {
        fabricCanvas.current.remove(obj);
      }
    });

    // Add/update objects from store
    canvasObjects.forEach(storeObj => {
      const existingObj = fabricCanvas.current.getObjects().find(obj => obj.id === storeObj.id);
      
      if (!existingObj) {
        let fabricObj;
        switch (storeObj.type) {
          case 'text':
            fabricObj = new FabricText(storeObj.text, {
              id: storeObj.id,
              left: storeObj.left,
              top: storeObj.top,
              fill: storeObj.fill,
              fontSize: storeObj.fontSize,
              fontFamily: storeObj.fontFamily,
              opacity: storeObj.opacity,
              selectable: storeObj.selectable
            });
            break;
          case 'rect':
            fabricObj = new FabricRect({
              id: storeObj.id,
              left: storeObj.left,
              top: storeObj.top,
              width: storeObj.width,
              height: storeObj.height,
              fill: storeObj.fill,
              opacity: storeObj.opacity,
              selectable: storeObj.selectable
            });
            break;
          case 'path':
            fabricObj = new FabricPath(storeObj.path, {
              id: storeObj.id,
              left: storeObj.left,
              top: storeObj.top,
              stroke: storeObj.stroke,
              strokeWidth: storeObj.strokeWidth,
              fill: null,
              selectable: storeObj.selectable
            });
            break;
          default:
            return;
        }
        
        if (fabricObj) {
          fabricCanvas.current.add(fabricObj);
          if (selectedObject?.id === storeObj.id) {
            fabricCanvas.current.setActiveObject(fabricObj);
          }
        }
      } else {
        existingObj.set(storeObj);
        existingObj.setCoords();
      }
    });

    fabricCanvas.current.renderAll();
  }, [canvasObjects, selectedObject, canvasInitialized]);

  // Update canvas dimensions
  useEffect(() => {
    if (!fabricCanvas.current || !canvasInitialized) return;
    
    const videoElement = document.querySelector('video');
    if (videoElement && canvasRef.current) {
      const { width, height } = videoElement.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      fabricCanvas.current.setDimensions({ width, height });
      fabricCanvas.current.renderAll();
    }
  }, [currentTime, canvasInitialized]);

  // Toggle selection mode based on active tool
  useEffect(() => {
    if (fabricCanvas.current && canvasInitialized) {
      fabricCanvas.current.selection = activeTool === null;
      fabricCanvas.current.renderAll();
    }
  }, [activeTool, canvasInitialized]);

  return (
    <div 
      ref={canvasContainerRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto"
    />
  );
}