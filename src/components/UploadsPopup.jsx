import { useRef, useState, useCallback } from 'react';

export default function UploadsPopup({ onUpload, uploadedImages }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onUpload(file, url);
  }, [onUpload]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the drop zone itself (not a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-[350px] h-fit shrink-0 bg-white rounded-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Uploads</h2>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none"
          style={{
            border: `2px dashed ${isDragOver ? '#c0623a' : '#d1d5db'}`,
            background: isDragOver ? '#fff5f0' : '#f9fafb',
            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {/* Animated upload icon */}
          <div
            className="transition-transform duration-200"
            style={{ transform: isDragOver ? 'translateY(-4px)' : 'translateY(0)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
              stroke={isDragOver ? '#c0623a' : '#9ca3af'} className="w-10 h-10 mb-3 transition-colors duration-200">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          {isDragOver ? (
            <p className="text-sm font-semibold text-[#c0623a] mb-1">Drop to upload!</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-600 mb-1">Drag &amp; drop image here</p>
              <p className="text-xs text-gray-400 mb-3">or click to browse</p>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!isDragOver && (
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="px-5 py-1.5 bg-[#c0623a] hover:bg-[#a65330] text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors border-none cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload
            </button>
          )}
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-2">Supports PNG, JPG, WEBP, SVG</p>
      </div>

      <div className="px-6 pb-6 overflow-y-auto flex-1">
        <h3 className="text-[13px] font-bold text-gray-800 mb-3">Custom Material</h3>
        <div className="grid grid-cols-3 gap-3">
          {uploadedImages.map((url, idx) => (
            <button
              key={idx}
              onClick={() => onUpload(null, url)}
              className="aspect-square rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center p-0 cursor-pointer hover:border-[#c0623a] hover:shadow-md transition-all"
            >
              <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-contain pointer-events-none" />
            </button>
          ))}
          {uploadedImages.length === 0 && (
            <p className="col-span-3 text-xs text-gray-400 text-center py-4">No uploaded materials yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
