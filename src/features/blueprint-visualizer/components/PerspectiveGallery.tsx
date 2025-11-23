import React, { useState } from 'react';
import { Perspective } from '../types';

interface PerspectiveGalleryProps {
  perspectives: Perspective[];
}

export const PerspectiveGallery: React.FC<PerspectiveGalleryProps> = ({ perspectives }) => {
  const [selectedImage, setSelectedImage] = useState<Perspective | null>(null);

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation(); // Prevent opening modal
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (perspectives.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {perspectives.map((p) => (
          <div 
            key={p.id} 
            className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all cursor-pointer shadow-lg hover:shadow-blue-900/20"
            onClick={() => setSelectedImage(p)}
          >
            <div className="aspect-square w-full overflow-hidden bg-slate-900 relative">
               <img 
                 src={p.imageUrl} 
                 alt={p.description} 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               />
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
               
               {/* Overlay Download Button */}
               <button
                 onClick={(e) => handleDownload(e, p.imageUrl, `${p.type.replace(/\s+/g, '-')}-${Date.now()}.png`)}
                 className="absolute top-3 right-3 p-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 border border-slate-600 hover:border-blue-500 shadow-xl"
                 title="Download Image"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
               </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform">
               <h4 className="text-white font-medium text-sm font-mono uppercase tracking-wide border-l-2 border-blue-500 pl-2">
                 {p.type}
               </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col gap-4 relative" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center text-white mb-2">
                <span className="font-mono text-sm uppercase tracking-wider text-slate-300">{selectedImage.type}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleDownload(e, selectedImage.imageUrl, `${selectedImage.type.replace(/\s+/g, '-')}-${Date.now()}.png`)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span className="text-sm font-medium">Download</span>
                  </button>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
             </div>
             
             <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-2xl relative">
                <img 
                  src={selectedImage.imageUrl} 
                  alt={selectedImage.description} 
                  className="w-full h-full object-contain max-h-[80vh]"
                />
             </div>
          </div>
        </div>
      )}
    </>
  );
};