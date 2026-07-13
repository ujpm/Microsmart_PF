import React, { useRef, useState, useEffect } from 'react';
import SignaturePadLib from 'signature_pad';

interface SignaturePadProps {
  onSave: (base64Image: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigPadRef = useRef<any>(null);
  const [isSaved, setIsSaved] = useState(false);

  const clear = () => {
    sigPadRef.current?.clear();
    setIsSaved(false);
  };

  const save = () => {
    const pad = sigPadRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;
    if (pad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    const trimmed = trimCanvas(canvas);
    if (trimmed) {
      const dataURL = trimmed.toDataURL('image/png');
      setIsSaved(true);
      onSave(dataURL);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) ctx.scale(ratio, ratio);
    };

    resizeCanvas();
    const pad = new SignaturePadLib(canvas, { penColor: '#0f172a' });
    sigPadRef.current = pad;

    const handleResize = () => {
      try {
        const data = pad.toData();
        resizeCanvas();
        pad.clear();
        pad.fromData(data);
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      pad.off && pad.off();
    };
  }, []);

  // Trim whitespace around strokes and return a new canvas
  const trimCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
    try {
      const ctx = source.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      const w = source.width;
      const h = source.height;
      const pixels = ctx.getImageData(0, 0, w, h);
      const data = pixels.data;
      let minX = w, minY = h, maxX = 0, maxY = 0;
      let found = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a !== 0 && !(r === 255 && g === 255 && b === 255)) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!found) return null;

      const trimWidth = maxX - minX + 1;
      const trimHeight = maxY - minY + 1;
      const dest = document.createElement('canvas');
      dest.width = trimWidth;
      dest.height = trimHeight;
      const dctx = dest.getContext('2d');
      if (!dctx) return null;
      dctx.drawImage(source, minX, minY, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);
      return dest;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-2 sm:p-4 bg-white">
      <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Digital Signature</p>
      <div className="border border-dashed border-slate-300 rounded bg-slate-50 mb-2 sm:mb-3">
        <canvas ref={canvasRef} className="w-full h-24 sm:h-32 md:h-40" />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={isSaved}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isSaved}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
        >
          {isSaved ? 'Signature Locked' : 'Confirm Signature'}
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
