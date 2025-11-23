import React, { useState, useCallback, useRef } from 'react';
import { AppStatus, GenerationState, Perspective, GenerationMode } from './types';
import { generateBlueprintSvg, generatePerspectiveImage } from './services/geminiService';
import { InputSection } from './components/InputSection';
import { BlueprintViewer } from './components/BlueprintViewer';
import { PerspectiveGallery } from './components/PerspectiveGallery';

const BlueprintVisualizerApp: React.FC = () => {
  const processingRef = useRef(false);

  const [state, setState] = useState<GenerationState>({
    prompt: '',
    svgCode: null,
    blueprintImageBase64: null,
    perspectives: [],
    status: AppStatus.IDLE,
    errorMessage: null,
    mode: 'fast',
    blueprintTime: 0,
    renderTime: 0
  });

  const handleGenerate = async (prompt: string, mode: GenerationMode) => {
    processingRef.current = true;
    setState(prev => ({
      ...prev,
      prompt,
      mode,
      status: AppStatus.GENERATING_BLUEPRINT,
      svgCode: null,
      blueprintImageBase64: null,
      perspectives: [],
      errorMessage: null,
      blueprintTime: 0,
      renderTime: 0
    }));

    const startTime = Date.now();

    try {
      // Step 1: Generate Blueprint SVG
      const svgCode = await generateBlueprintSvg(prompt);
      const blueprintEndTime = Date.now();
      const blueprintDuration = (blueprintEndTime - startTime) / 1000;

      if (!processingRef.current) return; // Stop check

      setState(prev => ({
        ...prev,
        svgCode,
        blueprintTime: blueprintDuration,
        status: mode === 'blueprint-only' ? AppStatus.COMPLETE : AppStatus.RASTERIZING
      }));

      if (mode === 'blueprint-only') {
        processingRef.current = false;
      }
      // The BlueprintViewer component will trigger onRasterized when ready if we continue
    } catch (error) {
      if (!processingRef.current) return;

      console.error(error);
      setState(prev => ({
        ...prev,
        status: AppStatus.ERROR,
        errorMessage: 'Failed to generate blueprint. Please try again.'
      }));
      processingRef.current = false;
    }
  };

  const handleStop = () => {
    processingRef.current = false;
    setState(prev => ({
      ...prev,
      status: AppStatus.STOPPED,
      errorMessage: null
    }));
  };

  const handleRasterized = useCallback(async (base64: string) => {
    if (!processingRef.current) return; // Stop check

    // If mode is blueprint-only, we shouldn't be here usually, but safety check
    if (state.mode === 'blueprint-only') return;

    // Avoid double triggering if we already have the image or moved on
    setState(prev => {
      if (prev.blueprintImageBase64) return prev; // Already have it
      return {
        ...prev,
        blueprintImageBase64: base64,
        status: AppStatus.GENERATING_PERSPECTIVES
      }
    });

    // Start generating perspectives
    triggerPerspectiveGeneration(state.prompt, base64, state.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prompt, state.mode]);

  const triggerPerspectiveGeneration = async (currentPrompt: string, base64Image: string, mode: GenerationMode) => {
    if (!processingRef.current) return;

    const renderStartTime = Date.now();

    const allPerspectives = [
      { id: 'p1', type: 'Isometric View', name: 'Isometric Cutaway' },
      { id: 'p2', type: 'Interior Eye-Level View', name: 'Interior Eye-Level' },
      { id: 'p3', type: 'Top-Down Photorealistic View', name: 'Realistic Top-Down' }
    ];

    // Filter based on mode
    const targetPerspectives = mode === 'fast'
      ? [allPerspectives[0]]
      : allPerspectives;

    try {
      // Launch all requests in parallel
      const promises = targetPerspectives.map(async (pt) => {
        if (!processingRef.current) return null;

        try {
          const imageUrl = await generatePerspectiveImage(currentPrompt, pt.type, base64Image);
          if (!processingRef.current) return null; // Check again after await

          return {
            id: pt.id,
            type: pt.name,
            imageUrl,
            description: `${pt.name} of ${currentPrompt}`
          } as Perspective;
        } catch (e) {
          console.error(`Failed to generate ${pt.type}`, e);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const renderEndTime = Date.now();
      const renderDuration = (renderEndTime - renderStartTime) / 1000;

      if (!processingRef.current) return;

      const validPerspectives = results.filter((p): p is Perspective => p !== null);

      setState(prev => ({
        ...prev,
        perspectives: validPerspectives,
        status: AppStatus.COMPLETE,
        renderTime: renderDuration
      }));

      processingRef.current = false;

    } catch (error) {
      if (!processingRef.current) return;

      console.error("Critical error in perspective generation", error);
      setState(prev => ({
        ...prev,
        status: AppStatus.ERROR,
        errorMessage: 'Failed to generate perspectives.'
      }));
      processingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Archi<span className="text-blue-400">Gen</span>
            </h1>
          </div>
          <div className="text-sm font-mono text-slate-500">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Input Section */}
        <InputSection
          onSubmit={handleGenerate}
          onStop={handleStop}
          status={state.status}
        />

        {/* Results Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Blueprint (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path><path d="m2 12 10-10 10 10"></path></svg>
              Blueprint Layout
              {state.blueprintTime > 0 && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {state.blueprintTime.toFixed(2)}s
                </span>
              )}
            </h2>
            {state.svgCode ? (
              <BlueprintViewer
                svgCode={state.svgCode}
                onRasterized={handleRasterized}
              />
            ) : (
              <div className="h-[400px] bg-slate-900/50 rounded-xl border border-slate-800 border-dashed flex items-center justify-center text-slate-600">
                <div className="text-center p-6">
                  <p>Blueprint will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Perspectives (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Rendered Perspectives
              {state.renderTime > 0 && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {state.renderTime.toFixed(2)}s
                </span>
              )}
            </h2>

            {state.status === AppStatus.GENERATING_PERSPECTIVES && (
              <div className="h-64 flex items-center justify-center bg-slate-900/30 rounded-xl border border-slate-800/50 animate-pulse">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-0"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <p className="text-slate-400 font-mono text-sm">
                    Rendering {state.mode === 'fast' ? 'draft' : '3D'} visualizations...
                  </p>
                </div>
              </div>
            )}

            {state.perspectives.length > 0 ? (
              <PerspectiveGallery perspectives={state.perspectives} />
            ) : (
              state.status !== AppStatus.GENERATING_PERSPECTIVES && (
                <div className="h-full min-h-[400px] bg-slate-900/50 rounded-xl border border-slate-800 border-dashed flex items-center justify-center text-slate-600">
                  <p>
                    {state.status === AppStatus.STOPPED
                      ? 'Generation stopped'
                      : state.mode === 'blueprint-only' && state.svgCode
                        ? 'Blueprint only mode active (no renders)'
                        : 'Rendered views will appear here'}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlueprintVisualizerApp;