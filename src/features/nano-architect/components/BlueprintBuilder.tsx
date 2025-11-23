import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  Plus, 
  Trash2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Maximize, 
  Image as ImageIcon,
  Loader2,
  Cpu
} from 'lucide-react';
import { ArchitectState, BlueprintItem, ComponentType } from '../types';
import { CATALOG, renderComponentSVG } from '../constants';
import { generateBlueprintLayout, renderPerspectiveView } from '../services/geminiService';

const BlueprintBuilder: React.FC = () => {
  const [state, setState] = useState<ArchitectState>({
    items: [],
    selectedId: null,
    prompt: '',
    isGenerating: false,
    renderedPerspective: null,
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'pan' | 'select'>('select');
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  // Handlers for manual manipulation
  const addItem = (type: ComponentType) => {
    const catItem = CATALOG.find(c => c.type === type);
    if (!catItem) return;

    const newItem: BlueprintItem = {
      id: crypto.randomUUID(),
      type: type,
      x: 300 - catItem.defaultWidth/2, // Center roughly
      y: 200 - catItem.defaultHeight/2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };

    setState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      selectedId: newItem.id
    }));
  };

  const removeItem = () => {
    if (!state.selectedId) return;
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== prev.selectedId),
      selectedId: null
    }));
  };

  const rotateItem = () => {
    if (!state.selectedId) return;
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === prev.selectedId ? { ...i, rotation: (i.rotation + 90) % 360 } : i)
    }));
  };

  // AI Generation Handlers
  const handleGenerateBlueprint = async () => {
    if (!state.prompt) return;
    setState(prev => ({ ...prev, isGenerating: true, renderedPerspective: null }));
    try {
      const newItems = await generateBlueprintLayout(state.prompt);
      setState(prev => ({
        ...prev,
        items: newItems,
        isGenerating: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
      alert("Failed to generate blueprint. Please try again.");
    }
  };

  const handleRenderPerspective = async () => {
    if (!svgRef.current) return;
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
       // In a real app, we'd rasterize the SVG to base64 here.
       // For this demo, we pass the SVG inner HTML as context.
       const svgContent = svgRef.current.innerHTML;
       const resultBase64 = await renderPerspectiveView(svgContent, "Photorealistic 3D render, isometric view, soft lighting, architectural visualization");
       
       setState(prev => ({
         ...prev,
         isGenerating: false,
         renderedPerspective: `data:image/png;base64,${resultBase64}`
       }));
    } catch (error) {
       console.error(error);
       setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Mouse Interaction for SVG
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'pan') {
       setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'pan' && dragStart) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    if (mode === 'select') {
       e.stopPropagation();
       setState(prev => ({ ...prev, selectedId: id }));
    }
  };

  return (
    <div className="flex h-full bg-dark text-slate-200 overflow-hidden">
      {/* Sidebar Catalog */}
      <div className="w-64 bg-surface border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-bold text-white flex items-center gap-2">
            <LayoutGrid size={20} className="text-primary" />
            Component Catalog
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {['structure', 'furniture', 'deco'].map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">{cat}</h3>
              <div className="grid grid-cols-2 gap-2">
                {CATALOG.filter(c => c.category === cat).map(item => (
                  <button
                    key={item.type}
                    onClick={() => addItem(item.type)}
                    className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition hover:border-primary group"
                  >
                    <div className="text-slate-400 group-hover:text-primary mb-2">
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <div className="h-14 bg-surface border-b border-slate-700 flex items-center justify-between px-4">
           <div className="flex items-center gap-2 bg-dark p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setMode('select')}
                className={`p-1.5 rounded ${mode === 'select' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                title="Select Mode"
              >
                <Move size={16} />
              </button>
              <button 
                onClick={() => setMode('pan')}
                className={`p-1.5 rounded ${mode === 'pan' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                title="Pan Mode"
              >
                <Maximize size={16} />
              </button>
           </div>

           <div className="flex items-center gap-4">
             {state.selectedId && (
               <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <button onClick={rotateItem} className="p-2 hover:bg-slate-700 rounded text-slate-300" title="Rotate">
                   <RotateCw size={18} />
                 </button>
                 <button onClick={removeItem} className="p-2 hover:bg-red-900/50 hover:text-red-400 rounded text-slate-300" title="Delete">
                   <Trash2 size={18} />
                 </button>
                 <div className="w-px h-4 bg-slate-600 mx-2"></div>
               </div>
             )}
             
             <div className="flex items-center gap-2">
               <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-slate-700 rounded">
                 <ZoomOut size={18} />
               </button>
               <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
               <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 hover:bg-slate-700 rounded">
                 <ZoomIn size={18} />
               </button>
             </div>
           </div>
        </div>

        {/* SVG Viewer */}
        <div 
          className={`flex-1 bg-[#0f172a] relative overflow-hidden cursor-${mode === 'pan' ? 'grab' : 'default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ 
                 backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
                 backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                 backgroundPosition: `${pan.x}px ${pan.y}px`
               }} 
          />

          <svg 
            ref={svgRef}
            className="w-full h-full"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid slice" // Use slice to allow panning effect visually or map coordinates
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
               {/* Origin Marker */}
               <path d="M-10,0 L10,0 M0,-10 L0,10" stroke="#334155" strokeWidth="1" />

               {state.items.map(item => {
                 const catalogItem = CATALOG.find(c => c.type === item.type);
                 if (!catalogItem) return null;
                 return (
                   <g 
                     key={item.id}
                     transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation} ${catalogItem.defaultWidth/2} ${catalogItem.defaultHeight/2})`}
                     onClick={(e) => handleItemClick(e, item.id)}
                     style={{ cursor: mode === 'select' ? 'pointer' : 'inherit' }}
                   >
                     {renderComponentSVG(item.type, catalogItem.defaultWidth, catalogItem.defaultHeight, state.selectedId === item.id)}
                   </g>
                 );
               })}
            </g>
          </svg>

          {/* Perspective Overlay */}
          {state.renderedPerspective && (
            <div className="absolute inset-4 bg-black/90 rounded-xl border border-slate-700 z-20 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
               <div className="p-2 flex justify-between items-center bg-surface/50 backdrop-blur-sm">
                 <span className="text-xs font-bold text-white uppercase tracking-wider ml-2">Gemini Render</span>
                 <button 
                   onClick={() => setState(prev => ({ ...prev, renderedPerspective: null }))}
                   className="text-slate-400 hover:text-white px-2"
                 >
                   Close
                 </button>
               </div>
               <div className="flex-1 flex items-center justify-center p-4">
                 <img src={state.renderedPerspective} className="max-w-full max-h-full rounded shadow-2xl" alt="Rendered perspective" />
               </div>
            </div>
          )}
        </div>

        {/* AI Command Bar */}
        <div className="p-4 bg-surface border-t border-slate-700">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Cpu className="absolute left-3 top-3 text-primary" size={20} />
              <input 
                type="text"
                value={state.prompt}
                onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Describe a layout (e.g., 'A large square room with a bed and a desk near the window')..."
                className="w-full bg-dark border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:outline-none text-white placeholder-slate-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateBlueprint()}
              />
            </div>
            <button 
              onClick={handleGenerateBlueprint}
              disabled={state.isGenerating || !state.prompt}
              className="bg-primary hover:bg-indigo-600 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              {state.isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Generate Layout
            </button>
            <button 
               onClick={handleRenderPerspective}
               disabled={state.items.length === 0 || state.isGenerating}
               className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border border-slate-600"
               title="Visualize as 3D Image"
            >
               <ImageIcon size={16} />
               Render View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintBuilder;
