import React, { useState, useRef } from 'react';
import { Upload, Wand2, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { editImageWithPrompt } from '../services/geminiService';
import { ImageEditState } from '../types';

const ImageEditor: React.FC = () => {
  const [state, setState] = useState<ImageEditState>({
    originalImage: null,
    processedImage: null,
    prompt: '',
    loading: false,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({
          ...prev,
          originalImage: reader.result as string,
          processedImage: null,
          error: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!state.originalImage || !state.prompt) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64Data = state.originalImage.split(',')[1];
      const mimeType = state.originalImage.substring(state.originalImage.indexOf(':') + 1, state.originalImage.indexOf(';'));

      const resultBase64 = await editImageWithPrompt(base64Data, state.prompt, mimeType);
      
      setState(prev => ({
        ...prev,
        loading: false,
        processedImage: `data:${mimeType};base64,${resultBase64}`
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Failed to process image. Please try a different prompt or image."
      }));
    }
  };

  const handleDownload = () => {
    if (state.processedImage) {
      const link = document.createElement('a');
      link.href = state.processedImage;
      link.download = 'gemini-edited.png';
      link.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark text-slate-200 p-6 gap-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Wand2 className="text-secondary" /> Magic Editor
          </h2>
          <p className="text-slate-400 text-sm">Powered by Gemini 2.5 Flash Image. Describe how you want to change the image.</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-surface border border-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Upload size={18} /> Upload Image
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Original */}
        <div className="flex-1 bg-surface/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden group">
          {state.originalImage ? (
            <img 
              src={state.originalImage} 
              alt="Original" 
              className="max-w-full max-h-full object-contain" 
            />
          ) : (
            <div className="text-center p-6 text-slate-500">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
              <p>Upload an image to start editing</p>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-mono">Original</div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 bg-surface/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden">
           {state.loading ? (
             <div className="flex flex-col items-center gap-3 animate-pulse">
                <Loader2 size={48} className="animate-spin text-secondary" />
                <p className="text-secondary font-medium">Gemini is dreaming...</p>
             </div>
           ) : state.processedImage ? (
              <img 
                src={state.processedImage} 
                alt="Processed" 
                className="max-w-full max-h-full object-contain" 
              />
           ) : (
             <div className="text-center p-6 text-slate-500">
                <Wand2 size={48} className="mx-auto mb-2 opacity-50" />
                <p>Result will appear here</p>
             </div>
           )}
            {state.processedImage && (
             <div className="absolute top-2 left-2 bg-secondary px-2 py-1 rounded text-xs font-mono text-white font-bold">Generative Edit</div>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center sticky bottom-0 z-10 shadow-xl shadow-black/50">
        <div className="flex-1 w-full">
           <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">PROMPT</label>
           <input 
             type="text" 
             value={state.prompt}
             onChange={(e) => setState(prev => ({...prev, prompt: e.target.value}))}
             placeholder='e.g. "Add a retro filter", "Remove the person in background", "Make the sky purple"'
             className="w-full bg-dark border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-secondary focus:outline-none text-white placeholder-slate-500"
             onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
           />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleEdit}
            disabled={!state.originalImage || !state.prompt || state.loading}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 min-w-[140px] transition
              ${(!state.originalImage || !state.prompt || state.loading) 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-secondary hover:bg-purple-600 text-white shadow-lg shadow-purple-900/20'
              }`}
          >
            {state.loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
            Generate
          </button>
          {state.processedImage && (
             <button 
               onClick={handleDownload}
               className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition"
               title="Download Result"
             >
               <Download size={20} />
             </button>
          )}
        </div>
      </div>
      {state.error && (
        <div className="text-red-400 text-sm text-center p-2 bg-red-900/20 border border-red-900 rounded">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
