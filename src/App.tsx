import React, { useState } from 'react';
import { Layout, PenTool } from 'lucide-react';
import BlueprintVisualizerApp from './features/blueprint-visualizer/BlueprintVisualizerApp';
import NanoArchitectApp from './features/nano-architect/NanoArchitectApp';

type AppMode = 'blueprint' | 'nano';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('blueprint');

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950">
            {/* Unified Navigation Bar */}
            <nav className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="text-white font-bold text-lg tracking-tight">
                        Gemini<span className="text-blue-500">Suite</span>
                    </div>
                    <div className="h-6 w-px bg-slate-700 mx-2"></div>
                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setMode('blueprint')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${mode === 'blueprint' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Layout size={16} /> Blueprint Visualizer
                        </button>
                        <button
                            onClick={() => setMode('nano')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${mode === 'nano' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <PenTool size={16} /> Nano Architect
                        </button>
                    </div>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                    Unified Workspace
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {mode === 'blueprint' ? (
                    <BlueprintVisualizerApp />
                ) : (
                    <NanoArchitectApp />
                )}
            </div>
        </div>
    );
};

export default App;
