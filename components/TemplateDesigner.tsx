import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Template, TemplateElement } from '../types';

interface TemplateDesignerProps {
  onSaveTemplate: (template: Omit<Template, 'id'> & { id?: string }) => void;
  templateToEdit?: Template | null;
}

const MaterialInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; id?: string;}> = ({ label, ...props }) => (
    <div className="relative bg-slate-100 rounded-t-lg border-b-2 border-slate-300 focus-within:border-blue-600 pt-4 transition-colors">
      <input
        {...props}
        placeholder=" " 
        className="block w-full px-3 pb-2 bg-transparent outline-none text-gray-800 peer"
      />
      <label
        htmlFor={props.id}
        className="absolute top-4 right-3 text-gray-500 duration-300 transform -translate-y-3 scale-75 origin-top-right
                   peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                   peer-focus:scale-75 peer-focus:-translate-y-3
                   pointer-events-none"
      >
        {label}
      </label>
    </div>
);

const RESIZE_HANDLES = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'];

const PLACEHOLDERS = [
    { label: 'اسم المريض', value: '{{patientName}}' },
    { label: 'اسم الطبيب', value: '{{doctorName}}' },
    { label: 'التاريخ', value: '{{date}}' },
    { label: 'كل التشخيصات', value: '{{allDiagnoses}}' },
];

const FONT_FAMILIES = [
  { name: 'افتراضي', value: "" },
  { name: 'Tajawal', value: "'Tajawal', sans-serif" },
  { name: 'Cairo', value: "'Cairo', sans-serif" },
  { name: 'Amiri', value: "'Amiri', serif" },
  { name: 'Lalezar', value: "'Lalezar', cursive" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
];

// Helper to get clientX/Y and target from both mouse and touch events
const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.touches[0].target as HTMLElement };
        }
        // For touchend, which has no `touches` but `changedTouches`
        if (e.changedTouches && e.changedTouches.length > 0) {
             return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY, target: e.changedTouches[0].target as HTMLElement };
        }
    }
    return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY, target: e.target as HTMLElement };
};

const TemplateDesigner: React.FC<TemplateDesignerProps> = ({ onSaveTemplate, templateToEdit }) => {
  const [name, setName] = useState('');
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const interactionRef = useRef<{
    type: 'move' | 'resize' | 'select-box';
    startMouseX: number;
    startMouseY: number;
    elementsToTransform: Map<string, TemplateElement>;
    handle?: string;
    shiftKey?: boolean;
    initialBox?: { x: number; y: number };
  } | null>(null);
  
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);


  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setElements(templateToEdit.elements);
    } else {
      setName('');
      setElements([]);
    }
    setSelectedElementIds(new Set());
    setEditingTextId(null);
  }, [templateToEdit]);

  const getCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect() || null;
  }, []);
  
  const addElement = (type: 'text' | 'image', content?: string) => {
    const newElement: TemplateElement = {
      id: Date.now().toString(),
      type: type,
      content: content || 'نص جديد',
      positionPercent: { x: 5, y: 5 },
      widthPercent: type === 'image' ? 30 : 25,
      heightPercent: type === 'image' ? 10 : 5,
      fontSize: 16,
      fontFamily: '',
      textAlign: 'right',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementIds(new Set([newElement.id]));
  };

  const updateSelectedElements = (newProps: Partial<Omit<TemplateElement, 'id'>>) => {
    if (selectedElementIds.size === 0) return;
    setElements(prev =>
        prev.map(el =>
            selectedElementIds.has(el.id) ? { ...el, ...newProps } : el
        )
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addElement('image', reader.result as string);
      };
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset input
    }
  };
  
  const handleSave = () => {
    if (!name.trim()) {
      alert('الرجاء إدخال اسم للقالب.');
      return;
    }
    onSaveTemplate({
      id: templateToEdit?.id,
      name,
      elements,
      designerCanvasWidth: getCanvasRect()?.width || 210 * 3.78, // fallback
    });
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.size > 0) {
      setElements(prev => prev.filter(el => !selectedElementIds.has(el.id)));
      setSelectedElementIds(new Set());
    }
  }, [selectedElementIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement).nodeName !== 'TEXTAREA' && (e.target as HTMLElement).nodeName !== 'INPUT') {
          handleDeleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected]);


  const handleInteractionStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.type === 'touchstart') {
      e.preventDefault();
    }

    const canvasRect = getCanvasRect();
    if (!canvasRect) return;

    const coords = getEventCoordinates(e.nativeEvent as MouseEvent | TouchEvent);
    const { clientX: startMouseX, clientY: startMouseY, target } = coords;

    const elementNode = target.closest<HTMLElement>('.report-element-designer');
    const resizeHandle = target.dataset.resizeHandle;
    const elementId = elementNode?.dataset.id;
    
    const elementsToTransform = new Map<string, TemplateElement>();
    const shiftKey = 'shiftKey' in e && e.shiftKey;

    if (resizeHandle && elementId) {
        const elementToResize = elements.find(el => el.id === elementId);
        if (elementToResize) {
            elementsToTransform.set(elementId, { ...elementToResize });
            interactionRef.current = { type: 'resize', startMouseX, startMouseY, elementsToTransform, handle: resizeHandle, shiftKey };
        }
    } else if (elementId) {
        let currentSelectedIds = new Set(selectedElementIds);
        if (!currentSelectedIds.has(elementId)) {
            currentSelectedIds = shiftKey ? new Set([...currentSelectedIds, elementId]) : new Set([elementId]);
            setSelectedElementIds(currentSelectedIds);
        }
        
        elements.forEach(el => {
            if (currentSelectedIds.has(el.id)) {
                elementsToTransform.set(el.id, { ...el });
            }
        });
        
        interactionRef.current = { type: 'move', startMouseX, startMouseY, elementsToTransform };
    } else {
        setSelectedElementIds(new Set());
        const initialBox = {
            x: (canvasRect.right - startMouseX) / canvasRect.width * 100,
            y: (startMouseY - canvasRect.top) / canvasRect.height * 100,
        };
        interactionRef.current = { type: 'select-box', startMouseX, startMouseY, elementsToTransform, initialBox };
        setSelectionBox({ ...initialBox, width: 0, height: 0 });
    }

    const handleInteractionMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!interactionRef.current) return;
      
      if (moveEvent.type === 'touchmove') {
          moveEvent.preventDefault();
      }

      const currentCoords = getEventCoordinates(moveEvent);
      if (!currentCoords) return;
      const { clientX: currentMouseX, clientY: currentMouseY } = currentCoords;

      const { type, startMouseX, startMouseY, elementsToTransform, handle, shiftKey } = interactionRef.current;
      const dx = (currentMouseX - startMouseX) / canvasRect.width * 100;
      const dy = (currentMouseY - startMouseY) / canvasRect.height * 100;

      if (type === 'move') {
        setElements(prev => prev.map(el => {
            if (elementsToTransform.has(el.id)) {
                const initialEl = elementsToTransform.get(el.id)!;
                return { ...el, positionPercent: { x: initialEl.positionPercent.x - dx, y: initialEl.positionPercent.y + dy }};
            }
            return el;
        }));
      } else if (type === 'resize' && handle && elementsToTransform.size === 1) {
        const resizingId = elementsToTransform.keys().next().value;
        setElements(prev => prev.map(el => {
          if (el.id === resizingId) {
            const initialEl = elementsToTransform.get(el.id)!;
            let { x, y } = initialEl.positionPercent;
            let { widthPercent, heightPercent } = initialEl;

            if (handle.includes('top')) { heightPercent -= dy; y += dy; }
            if (handle.includes('bottom')) { heightPercent += dy; }
            if (handle.includes('left')) { widthPercent -= dx; }
            if (handle.includes('right')) { widthPercent += dx; x -= dx; }

            if(shiftKey && el.type === 'image') {
                const aspectRatio = initialEl.widthPercent / initialEl.heightPercent;
                if (widthPercent !== initialEl.widthPercent) { heightPercent = widthPercent / aspectRatio; } 
                else if (heightPercent !== initialEl.heightPercent) { widthPercent = heightPercent * aspectRatio; }
            }
            return { ...el, positionPercent: { x, y }, widthPercent: Math.max(2, widthPercent), heightPercent: Math.max(2, heightPercent) };
          }
          return el;
        }));
      } else if (type === 'select-box') {
          const initialBox = interactionRef.current.initialBox;
          if (!initialBox) return;

          const currentX = (canvasRect.right - currentMouseX) / canvasRect.width * 100;
          const currentY = (currentMouseY - canvasRect.top) / canvasRect.height * 100;
          
          const newBox = {
              x: Math.min(initialBox.x, currentX),
              y: Math.min(initialBox.y, currentY),
              width: Math.abs(currentX - initialBox.x),
              height: Math.abs(currentY - initialBox.y),
          };
          setSelectionBox(newBox);
      }
    };
    
    const handleInteractionEnd = () => {
        if (interactionRef.current?.type === 'select-box' && selectionBox) {
            const newSelectedIds = new Set<string>();
            elements.forEach(el => {
                const elRightEdgePos = el.positionPercent.x;
                const elLeftEdgePos = el.positionPercent.x + el.widthPercent;
                const elTopEdgePos = el.positionPercent.y;
                const elBottomEdgePos = el.positionPercent.y + el.heightPercent;

                const boxRightEdgePos = selectionBox.x;
                const boxLeftEdgePos = selectionBox.x + selectionBox.width;
                const boxTopEdgePos = selectionBox.y;
                const boxBottomEdgePos = selectionBox.y + selectionBox.height;

                const horizOverlap = elRightEdgePos < boxLeftEdgePos && elLeftEdgePos > boxRightEdgePos;
                const vertOverlap = elTopEdgePos < boxBottomEdgePos && elBottomEdgePos > boxTopEdgePos;

                if (horizOverlap && vertOverlap) {
                    newSelectedIds.add(el.id);
                }
            });
            setSelectedElementIds(newSelectedIds);
        }

        interactionRef.current = null;
        setSelectionBox(null);
        document.removeEventListener('mousemove', handleInteractionMove);
        document.removeEventListener('mouseup', handleInteractionEnd);
        document.removeEventListener('touchmove', handleInteractionMove);
        document.removeEventListener('touchend', handleInteractionEnd);
    };

    document.addEventListener('mousemove', handleInteractionMove);
    document.addEventListener('mouseup', handleInteractionEnd, { once: true });
    document.addEventListener('touchmove', handleInteractionMove, { passive: false });
    document.addEventListener('touchend', handleInteractionEnd, { once: true });
  }, [elements, getCanvasRect, selectedElementIds, selectionBox]);
  
  const handleDoubleClick = (e: React.MouseEvent, el: TemplateElement) => {
      e.stopPropagation();
      if (el.type === 'text') {
        setEditingTextId(el.id);
      }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingTextId) return;
    setElements(prev => prev.map(el => el.id === editingTextId ? { ...el, content: e.target.value } : el));
  };
  
  const handleTextBlur = () => {
    setEditingTextId(null);
  }

  const handleZoom = (factor: number) => {
    if (selectedElementIds.size === 0) return;
    setElements(prev => prev.map(el => {
        if (selectedElementIds.has(el.id)) {
            const oldWidth = el.widthPercent;
            const oldHeight = el.heightPercent;

            const newWidth = oldWidth * factor;
            const newHeight = el.type === 'image' ? oldHeight * factor : oldHeight;

            const dx = (newWidth - oldWidth) / 2;
            const dy = (newHeight - oldHeight) / 2;

            const newX = el.positionPercent.x - dx;
            const newY = el.positionPercent.y - dy;

            return {
                ...el,
                widthPercent: newWidth,
                heightPercent: newHeight,
                positionPercent: { x: newX, y: newY },
            };
        }
        return el;
    }));
  };

  const selectedElements = elements.filter(el => selectedElementIds.has(el.id));
  const singleSelectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="space-y-4">
        <MaterialInput label="اسم القالب" name="templateName" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-600 mb-2">إضافة عناصر</h3>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addElement('text')} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all text-sm">نص مخصص</button>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all text-sm">صورة</button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
            <h3 className="text-sm font-bold text-gray-600 my-2 pt-2 border-t">إضافة حقول جاهزة</h3>
            <div className="grid grid-cols-2 gap-2">
                {PLACEHOLDERS.map(p => (
                    <button key={p.value} onClick={() => addElement('text', p.value)} className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-all text-sm">{p.label}</button>
                ))}
            </div>
        </div>
      </div>
      
      {/* Designer Canvas */}
      <div className="flex-1 relative" onMouseDown={handleInteractionStart} onTouchStart={handleInteractionStart}>
        <div ref={canvasRef} className="report-a4-container-preview overflow-hidden border border-gray-400 bg-white cursor-crosshair">
          {elements.map(el => {
            const isSelected = selectedElementIds.has(el.id);
            const isEditing = editingTextId === el.id;

            const style: React.CSSProperties = {
                position: 'absolute',
                top: `${el.positionPercent.y}%`,
                right: `${el.positionPercent.x}%`,
                width: `${el.widthPercent}%`,
                height: `${el.heightPercent}%`,
                outline: isSelected ? '2px solid #3b82f6' : '1px dashed #9ca3af',
                userSelect: 'none',
                cursor: 'move',
            };

            return (
              <div key={el.id} className="report-element-designer" data-id={el.id} style={style} onDoubleClick={(e) => handleDoubleClick(e, el)}>
                {el.type === 'image' && <img src={el.content} className="w-full h-full object-contain pointer-events-none" alt="template element"/>}
                {el.type === 'text' && !isEditing && (
                    <div className="w-full h-full pointer-events-none overflow-hidden whitespace-pre-wrap break-words" style={{fontSize: el.fontSize, textAlign: el.textAlign, color: el.color, fontWeight: el.fontWeight, fontStyle: el.fontStyle, fontFamily: el.fontFamily}}>
                        {el.content}
                    </div>
                )}
                 {el.type === 'text' && isEditing && (
                    <textarea 
                        value={el.content} 
                        onChange={handleTextChange} 
                        onBlur={handleTextBlur}
                        autoFocus
                        className="w-full h-full resize-none border-none bg-blue-100 outline-none p-0"
                        style={{fontSize: el.fontSize, textAlign: el.textAlign, color: el.color, fontWeight: el.fontWeight, fontStyle: el.fontStyle, fontFamily: el.fontFamily}}
                    />
                 )}
                {isSelected && (
                    RESIZE_HANDLES.map(handle => (
                      <div
                        key={handle}
                        data-resize-handle={handle}
                        className={`absolute w-2 h-2 bg-white border border-blue-600 rounded-full -m-1 ${handle.includes('left') ? 'left-0' : ''} ${handle.includes('right') ? 'right-0' : ''} ${handle.includes('top') ? 'top-0' : ''} ${handle.includes('bottom') ? 'bottom-0' : ''} ${handle === 'top' || handle === 'bottom' ? 'left-1/2 -translate-x-1/2' : ''} ${handle === 'left' || handle === 'right' ? 'top-1/2 -translate-y-1/2' : ''}
                        ${(handle.includes('left') && handle.includes('top')) || (handle.includes('right') && handle.includes('bottom')) ? 'cursor-nwse-resize' : ''}
                        ${(handle.includes('right') && handle.includes('top')) || (handle.includes('left') && handle.includes('bottom')) ? 'cursor-nesw-resize' : ''}
                        ${handle === 'top' || handle === 'bottom' ? 'cursor-ns-resize' : ''}
                        ${handle === 'left' || handle === 'right' ? 'cursor-ew-resize' : ''}
                        `}
                      />
                    ))
                )}
              </div>
            );
          })}
          {selectionBox && (
              <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                  style={{ top: `${selectionBox.y}%`, right: `${selectionBox.x}%`, width: `${selectionBox.width}%`, height: `${selectionBox.height}%` }}
              />
          )}
        </div>
      </div>
      
      {/* Properties & Actions Panel */}
      {selectedElementIds.size > 0 && (
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 space-y-4">
          {singleSelectedElement && singleSelectedElement.type === 'text' && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 -mb-2">خصائص النص</h3>
              <div className="flex items-center gap-4 mt-4">
                  <label className="text-xs text-gray-500 w-16">حجم الخط</label>
                  <input type="number" value={singleSelectedElement.fontSize || 16} onChange={e => updateSelectedElements({ fontSize: parseInt(e.target.value, 10) })} className="w-20 p-1 border rounded-md" />
                  <label className="text-xs text-gray-500">اللون</label>
                  <input type="color" value={singleSelectedElement.color || '#000000'} onChange={e => updateSelectedElements({ color: e.target.value })} className="w-8 h-8 p-0 border-none rounded-md" />
              </div>
              <div className="flex items-center gap-4 mt-4">
                  <label className="text-xs text-gray-500 w-16">الخط</label>
                  <div className="relative flex-1 bg-white rounded-md border border-gray-300 focus-within:border-blue-600 transition-colors">
                      <select
                          value={singleSelectedElement.fontFamily || ''}
                          onChange={e => updateSelectedElements({ fontFamily: e.target.value })}
                          className="block w-full px-2 py-1.5 bg-transparent outline-none text-gray-800 appearance-none text-sm"
                          style={{ fontFamily: singleSelectedElement.fontFamily }}
                      >
                          {FONT_FAMILIES.map(font => (
                              <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                                  {font.name}
                              </option>
                          ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                  <label className="text-xs text-gray-500 w-16">المحاذاة</label>
                  <div className="flex rounded-md shadow-sm">
                    {([['right', 'يمين'], ['center', 'وسط'], ['left', 'يسار']] as const).map(([align, label], index) => (
                      <button 
                        key={align}
                        onClick={() => updateSelectedElements({ textAlign: align })}
                        className={`relative inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium transition-colors 
                          ${index === 0 ? 'rounded-r-md' : ''} ${index === 2 ? 'rounded-l-md -ml-px' : '-ml-px'}
                          ${singleSelectedElement.textAlign === align ? 'bg-blue-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                  <label className="text-xs text-gray-500 w-16">النمط</label>
                  <div className="flex rounded-md shadow-sm">
                    <button 
                      onClick={() => updateSelectedElements({ fontWeight: 'normal' })}
                      className={`relative inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium transition-colors rounded-r-md ${!singleSelectedElement.fontWeight || singleSelectedElement.fontWeight === 'normal' ? 'bg-blue-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      عادي
                    </button>
                    <button
                      onClick={() => updateSelectedElements({ fontWeight: 'bold' })}
                      className={`relative -ml-px inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium transition-colors ${singleSelectedElement.fontWeight === 'bold' ? 'bg-blue-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      عريض
                    </button>
                    <button
                      onClick={() => updateSelectedElements({ fontStyle: 'normal' })}
                      className={`relative -ml-px inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium transition-colors ${!singleSelectedElement.fontStyle || singleSelectedElement.fontStyle === 'normal' ? 'bg-blue-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      عادي
                    </button>
                    <button
                      onClick={() => updateSelectedElements({ fontStyle: 'italic' })}
                      className={`relative -ml-px inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium transition-colors rounded-l-md ${singleSelectedElement.fontStyle === 'italic' ? 'bg-blue-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      مائل
                    </button>
                  </div>
              </div>
            </div>
          )}
           <div className={singleSelectedElement && singleSelectedElement.type === 'text' ? 'pt-4 border-t' : ''}>
              <h3 className="text-sm font-bold text-gray-600 mb-2">إجراءات العنصر</h3>
              <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">الحجم:</label>
                  <button onClick={() => handleZoom(1.1)} className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition-all text-sm">تكبير</button>
                  <button onClick={() => handleZoom(0.9)} className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition-all text-sm">تصغير</button>
              </div>
          </div>
        </div>
      )}

       <div className="flex gap-4 mt-auto">
        <button onClick={handleSave} className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all">
          {templateToEdit ? 'حفظ التعديلات' : 'حفظ القالب'}
        </button>
        {selectedElementIds.size > 0 &&
           <button onClick={handleDeleteSelected} className="px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all">
              حذف العنصر
            </button>
        }
       </div>
    </div>
  );
};

export default TemplateDesigner;