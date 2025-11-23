import React, { useEffect, useRef, useState } from 'react';

interface BlueprintViewerProps {
  svgCode: string | null;
  onRasterized: (base64: string) => void;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({ svgCode, onRasterized }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasRasterized, setHasRasterized] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper to ensure SVG is valid for Blob/Image usage
  const prepareSvgForRender = (rawSvg: string) => {
    let svg = rawSvg;
    
    // 1. Add namespace if missing (required for Blob/Image src)
    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // 2. Ensure explicit pixel dimensions if possible to avoid 0x0 render issues
    // Check if width/height are missing or percentage-based (which fail in unattached Images)
    const hasPixelWidth = /width=["']\d+(\.\d+)?["']/.test(svg);
    const hasPixelHeight = /height=["']\d+(\.\d+)?["']/.test(svg);
    
    if (!hasPixelWidth || !hasPixelHeight) {
       const viewBoxMatch = svg.match(/viewBox=["']\s*([\d\s.-]+)\s*["']/i);
       if (viewBoxMatch) {
          const parts = viewBoxMatch[1].trim().split(/\s+/).map(parseFloat);
          if (parts.length === 4) {
             const w = parts[2];
             const h = parts[3];
             // Inject dimensions into the opening tag if missing
             if (!hasPixelWidth) svg = svg.replace(/<svg/i, `<svg width="${w}"`);
             if (!hasPixelHeight) svg = svg.replace(/<svg/i, `<svg height="${h}"`);
          }
       }
    }
    
    return svg;
  };

  useEffect(() => {
    // Reset rasterized state when svgCode changes
    if (!svgCode) {
        setHasRasterized(false);
        setViewMode('preview');
        return;
    }
    
    // If we have code but haven't rasterized it yet for this version
    if (svgCode && !hasRasterized) {
      const rasterize = async () => {
        try {
          const processedSvg = prepareSvgForRender(svgCode);
          const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Set a decent resolution for the vision model
            canvas.width = 1024; 
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              let w = img.width;
              let h = img.height;
              
              if (!w || !h) {
                 const viewBox = svgCode.match(/viewBox=["']\s*([\d\s.-]+)\s*["']/);
                 if (viewBox) {
                    const parts = viewBox[1].trim().split(/\s+/).map(parseFloat);
                    if (parts.length === 4) { w = parts[2]; h = parts[3]; }
                 }
              }
              if (!w || !h) { w = 1024; h = 1024; }

              // Draw image centered and contained
              const scale = Math.min(canvas.width / w, canvas.height / h);
              const x = (canvas.width / 2) - (w / 2) * scale;
              const y = (canvas.height / 2) - (h / 2) * scale;
              ctx.drawImage(img, x, y, w * scale, h * scale);
              
              const base64 = canvas.toDataURL('image/png');
              onRasterized(base64);
              setHasRasterized(true);
            }
            URL.revokeObjectURL(url);
          };

          img.onerror = () => {
             console.error("Failed to rasterize SVG for internal processing");
             URL.revokeObjectURL(url);
          };
          
          img.src = url;
        } catch (e) {
          console.error("Failed to rasterize SVG", e);
        }
      };
      
      // Small timeout to ensure DOM render update if needed, though mostly using Logic
      setTimeout(rasterize, 100);
    }
  }, [svgCode, hasRasterized, onRasterized]);

  const handleCopyCode = () => {
    if (svgCode) {
      navigator.clipboard.writeText(svgCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadPng = () => {
    if (!svgCode) return;
    setIsDownloading(true);

    try {
      const processedSvg = prepareSvgForRender(svgCode);
      const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // High resolution for user download
        canvas.width = 2048; 
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          let w = img.width;
          let h = img.height;
          
          // Fallback if natural dimensions aren't detected
          if (!w || !h) {
              const viewBox = svgCode.match(/viewBox=["']\s*([\d\s.-]+)\s*["']/);
              if (viewBox) {
                const parts = viewBox[1].trim().split(/\s+/).map(parseFloat);
                if (parts.length === 4) { w = parts[2]; h = parts[3]; }
              }
          }
          if (!w || !h) { w = 1000; h = 1000; }

          const scale = Math.min(canvas.width / w, canvas.height / h);
          const x = (canvas.width / 2) - (w / 2) * scale;
          const y = (canvas.height / 2) - (h / 2) * scale;
          
          ctx.drawImage(img, x, y, w * scale, h * scale);
          
          const link = document.createElement('a');
          link.download = `blueprint-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      };
      
      img.onerror = (e) => {
        console.error("Failed to load SVG for download", e);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      };

      img.src = url;
    } catch (e) {
      console.error("Error creating download", e);
      setIsDownloading(false);
    }
  };

  if (!svgCode) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
           <h3 className="font-mono text-sm uppercase tracking-wider text-slate-400">Blueprint_View.svg</h3>
           <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Code
              </button>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={handleDownloadPng}
             disabled={isDownloading}
             className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md border border-slate-600"
             title="Download as PNG"
           >
             {isDownloading ? (
               <span className="animate-spin">⌛</span>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             )}
             PNG
           </button>

           {viewMode === 'code' && (
             <button 
               onClick={handleCopyCode}
               className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
             >
               {copySuccess ? 'Copied!' : 'Copy SVG'}
             </button>
           )}
           <div className="flex gap-2 ml-1">
             <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></span>
             <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></span>
             <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></span>
           </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative bg-white min-h-[400px]">
        {viewMode === 'preview' ? (
          <div 
            ref={containerRef}
            className="w-full h-full overflow-auto flex items-center justify-center p-8"
            dangerouslySetInnerHTML={{ __html: svgCode }}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950 p-4 overflow-auto">
            <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap break-all">
              {svgCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};