import React, { useState, useEffect } from 'react';
import { AppStatus, GenerationMode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface InputSectionProps {
  onSubmit: (prompt: string, mode: GenerationMode) => void;
  onStop: () => void;
  status: AppStatus;
}

export const InputSection: React.FC<InputSectionProps> = ({ onSubmit, onStop, status }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<GenerationMode>('fast');
  const [elapsed, setElapsed] = useState(0);

  // Check if we are in a processing state
  const isProcessing = status === AppStatus.GENERATING_BLUEPRINT || 
                       status === AppStatus.RASTERIZING || 
                       status === AppStatus.GENERATING_PERSPECTIVES;

  useEffect(() => {
    let interval: number;
    if (isProcessing) {
      setElapsed(0);
      interval = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input, mode);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.preventDefault();
    onStop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <label htmlFor="prompt" className="text-lg font-semibold text-slate-200">
            Describe your space
          </label>
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => !isProcessing && setMode('blueprint-only')}
              disabled={isProcessing}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'blueprint-only' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Blueprint Only
            </button>
            <button
              type="button"
              onClick={() => !isProcessing && setMode('fast')}
              disabled={isProcessing}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'fast' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fast (1 View)
            </button>
            <button
              type="button"
              onClick={() => !isProcessing && setMode('quality')}
              disabled={isProcessing}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'quality' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quality (3 Views)
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="E.g., A cozy brutalist living room with a sunken conversation pit, large concrete fireplace, and floor-to-ceiling windows overlooking a forest..."
            className="w-full h-32 p-4 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {isProcessing ? (
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
               <span className="font-mono text-xs text-slate-400 tabular-nums bg-slate-800 px-2 py-1 rounded border border-slate-700">
                 Time: {formatTime(elapsed)}
               </span>
               <button
                type="button"
                onClick={handleStop}
                className="px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                <span>Stop</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                ${!input.trim() 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
              <span>Generate Blueprint</span>
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-center min-h-[24px]">
           <div className="flex gap-2">
            {status === AppStatus.GENERATING_BLUEPRINT && (
              <p className="text-sm text-blue-400 animate-pulse flex items-center gap-2">
                <LoadingSpinner size="sm" color="text-blue-400" />
                Drafting architectural blueprints...
              </p>
            )}
            {status === AppStatus.RASTERIZING && (
              <p className="text-sm text-purple-400 animate-pulse flex items-center gap-2">
                <LoadingSpinner size="sm" color="text-purple-400" />
                Processing geometry...
              </p>
            )}
            {status === AppStatus.GENERATING_PERSPECTIVES && (
              <p className="text-sm text-emerald-400 animate-pulse flex items-center gap-2">
                <LoadingSpinner size="sm" color="text-emerald-400" />
                Rendering {mode === 'fast' ? 'preview' : '3D'} perspectives...
              </p>
            )}
            {status === AppStatus.ERROR && (
              <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
            )}
            {status === AppStatus.STOPPED && (
              <p className="text-sm text-slate-400">Generation stopped.</p>
            )}
           </div>
           <p className="text-xs text-slate-500 hidden sm:block">
             {mode === 'blueprint-only' && 'Blueprint Only (Fastest)'}
             {mode === 'fast' && 'Fast Mode: Blueprint + 1 Render'}
             {mode === 'quality' && 'Quality Mode: Blueprint + 3 Renders'}
           </p>
        </div>
      </form>
    </div>
  );
};