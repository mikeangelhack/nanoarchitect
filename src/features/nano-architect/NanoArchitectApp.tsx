import React, { useState } from 'react';
import { ViewMode } from './types';
import ImageEditor from './components/ImageEditor';
import BlueprintBuilder from './components/BlueprintBuilder';
import { Compass, Image as ImageIcon, AlertTriangle } from 'lucide-react';

const NanoArchitectApp: React.FC = () => {
  const [view, setView] = useState<ViewMode>('editor');
  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="bg-surface border border-red-900 p-8 rounded-2xl max-w-md text-center">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Missing API Key</h1>
          <p className="text-slate-400">
            This application requires a Google GenAI API Key.
            Please ensure <code>VITE_GEMINI_API_KEY</code> is configured in the environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-dark flex flex-col overflow-hidden">
      {/* Global Header */}
      <header className="h-16 bg-surface/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <Compass className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            Nano <span className="text-primary">Architect</span>
          </h1>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setView('editor')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${view === 'editor' ? 'bg-secondary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <ImageIcon size={16} /> Image Editor
          </button>
          <button
            onClick={() => setView('architect')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${view === 'architect' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Compass size={16} /> Blueprint Builder
          </button>
        </div>

        <div className="w-8"></div> {/* Spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {view === 'editor' ? <ImageEditor /> : <BlueprintBuilder />}
      </main>
    </div>
  );
};

export default NanoArchitectApp;
