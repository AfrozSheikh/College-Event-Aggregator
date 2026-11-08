import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Drag & drop file picker.
 *   <FileDropzone accept="image/*" multiple onFiles={(files) => ...} hint="PNG, JPG up to 5MB" />
 * `onFiles` always receives an array of File objects.
 */
export default function FileDropzone({ onFiles, accept, multiple = false, title, hint, icon: Icon = UploadCloud, className, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) onFiles?.(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-foreground/25 bg-card px-6 py-8 text-center transition-colors duration-150',
        'hover:border-foreground/50 hover:bg-accent/40 focus-visible:ring-ring/40 outline-none focus-visible:ring-2',
        dragging && 'border-foreground bg-accent',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <Icon className="text-muted-foreground mb-2.5 size-5" strokeWidth={1.5} />
      <p className="text-sm font-medium">
        {title || (
          <>
            <span className="underline underline-offset-4">Choose a file</span> or drop it here
          </>
        )}
      </p>
      {hint && <p className="meta mt-1.5">{hint}</p>}
    </div>
  );
}
