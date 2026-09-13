import { useState, useEffect } from 'react';
import { FileText, X as CancelIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AttachmentViewer({ files = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(files.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  if (!files || files.length === 0) return null;

  const currentFile = files[currentIndex];
  // Determine if it's an image. In templates we might only have the path and filename.
  // We can guess by extension if type is missing.
  const isImage = currentFile?.type?.includes('image') || 
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(currentFile?.path || currentFile?.filename || currentFile?.name || '');
                  
  const fileUrl = currentFile?.url || currentFile?.path;
  const fileName = currentFile?.name || currentFile?.filename;

  return (
    <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4 bg-black/50 text-white shadow-md">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-sm">{fileName}</h3>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={fileUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 px-4 py-2 rounded transition-colors"
          >
            Download
          </a>
          <button onClick={onClose} className="p-2 hover:bg-white dark:bg-slate-900/20 rounded-full transition-colors">
            <CancelIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-black/20">
        {isImage ? (
          <img src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
        ) : (
          <iframe src={fileUrl} title={fileName} className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl" />
        )}
      </div>

      {files.length > 1 && (
        <div className="p-4 flex justify-center gap-6 items-center border-t border-white/5 bg-transparent">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-[#2a2a2a] text-white font-semibold text-sm rounded hover:bg-[#3a3a3a] disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {files.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
            className="px-6 py-2 bg-[#2a2a2a] text-white font-semibold text-sm rounded hover:bg-[#3a3a3a] disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
