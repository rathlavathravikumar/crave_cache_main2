import React, { useRef, useState } from 'react';
import { Upload, Loader2, X, ImageOff, CloudUpload } from 'lucide-react';
import { apiFetch } from '../../utils/apiBase';
import { cn } from './cn';

/**
 * Picks an image, downscales it in the browser, then uploads it via
 * `POST /api/uploads/image` and reports back the hosted URL.
 *
 * The client-side downscale matters: it keeps the request under the server's
 * body limit and avoids pushing multi-megabyte originals to Cloudinary.
 *
 * When Cloudinary is not configured the endpoint echoes the data URI back, so
 * this component still works locally — it just isn't persisted to a CDN.
 */

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Draws the file to a canvas capped at `maxDimension` and returns a data URI. */
const downscaleToDataUrl = (file: File, maxDimension: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') return reject(new Error('Unsupported file.'));
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height >= width && height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  /** Cloudinary folder, e.g. 'cravecache/avatars'. */
  folder?: string;
  label?: string;
  hint?: string;
  /** Longest edge before upload. */
  maxDimension?: number;
  /** Circular preview for avatars. */
  rounded?: boolean;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  folder = 'cravecache',
  label = 'Image',
  hint,
  maxDimension = 800,
  rounded = false,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notPersisted, setNotPersisted] = useState(false);

  const handleFile = async (file?: File) => {
    setError(null);
    setNotPersisted(false);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That image is over 8MB. Please choose a smaller one.');
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await downscaleToDataUrl(file, maxDimension);

      const res = await apiFetch('/api/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, folder, maxDimension }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      onChange(data.url);
      if (!data.stored) setNotPersisted(true);
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <span className="block text-[13px] font-bold text-ink-800">{label}</span>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-surface-line bg-surface-sunken',
            rounded ? 'rounded-full' : 'rounded-card'
          )}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-6 w-6 text-ink-400" aria-hidden="true" />
          )}

          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-control border border-surface-line bg-white px-3 py-2 text-[13px] font-bold text-ink-800 transition-colors hover:bg-surface-sunken disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" />
              {value ? 'Replace' : 'Upload'}
            </button>

            {value && !busy && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setNotPersisted(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-control border border-surface-line bg-white px-3 py-2 text-[13px] font-bold text-ink-600 transition-colors hover:bg-danger-50 hover:text-danger-600"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          {/* Paste-a-URL escape hatch — several forms were URL-only before. */}
          <input
            type="url"
            value={value && value.startsWith('data:') ? '' : value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-full rounded-control border border-surface-line px-3 py-2 text-[13px] font-medium text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
          />

          {error ? (
            <p role="alert" className="text-[13px] font-bold text-danger-600">
              {error}
            </p>
          ) : notPersisted ? (
            <p className="flex items-start gap-1 text-[13px] font-semibold text-warning-500">
              <CloudUpload className="mt-px h-3 w-3 shrink-0" />
              Stored inline only — set the Cloudinary keys to host images on a CDN.
            </p>
          ) : (
            hint && <p className="text-[13px] font-medium text-ink-400">{hint}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};
