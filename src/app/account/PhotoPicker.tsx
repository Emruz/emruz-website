'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPhoto } from './actions';

const SIZE = 256;

/** Crop to a centered square and shrink before upload, so the server only stores a small JPEG. */
async function squareJpeg(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.88));
}

export default function PhotoPicker({ current, initials }: { current: string | null; initials: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Choose an image file.');
    try {
      const b = await squareJpeg(f);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
    } catch {
      setError('That image could not be read. Try a JPEG or PNG.');
    }
  }

  async function save() {
    if (!blob) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('photo', blob, 'photo.jpg');
    const r = await uploadPhoto(fd);
    setBusy(false);
    if (!r.ok) return setError(r.error ?? 'Upload failed.');
    setPreview(null);
    setBlob(null);
    router.refresh();
    window.dispatchEvent(new Event('emruz:me'));
  }

  const shown = preview ?? current;
  return (
    <div className="flex flex-wrap items-center gap-5">
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="Your photo" className="w-24 h-24 rounded-full object-cover border border-gray-200" />
      ) : (
        <span className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl font-semibold flex items-center justify-center">
          {initials}
        </span>
      )}
      <div className="space-y-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} className="px-4 py-2 rounded-md font-semibold border border-gray-300 text-gray-800 hover:bg-gray-50">
            {current || preview ? 'Choose another photo' : 'Choose a photo'}
          </button>
          {preview && (
            <button type="button" disabled={busy} onClick={save} className="px-4 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save photo'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">Square photos look best. It replaces your initials in the menu.</p>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
