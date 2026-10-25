import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Camera } from 'lucide-react';

interface ImageInsertModalProps {
  onInsertImage: (src: string, alt?: string) => void;
  onClose: () => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  onInsertImage,
  onClose,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndProcessImage = (file: File) => {
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPreview(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      compressAndProcessImage(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onInsertImage(preview, altText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              ছবি যোগ করুন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="my-4">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
                গ্যালারি বা ডিভাইস থেকে ছবি নির্বাচন করুন
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                PNG, JPG, WebP (স্বয়ংক্রিয়ভাবে অপ্টিমাইজড হবে)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <img
                  src={preview}
                  alt="প্রিভিউ"
                  className="max-h-48 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-medium rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors"
                >
                  অন্য ছবি
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ছবির ক্যাপশন / অল্টারনেটিভ টেক্সট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="ছবির বর্ণনা..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={!preview || isCompressing}
            onClick={handleConfirm}
            className="flex-1 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors shadow-xs"
          >
            {isCompressing ? 'প্রসেস হচ্ছে…' : 'যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
