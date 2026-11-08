import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Fullscreen image viewer with keyboard navigation.
 *   <ImageLightbox images={['url1','url2']} index={i} onIndexChange={setI} onClose={() => setI(null)} />
 * Render with index === null to keep it closed.
 */
export default function ImageLightbox({ images = [], index, onIndexChange, onClose }) {
  const open = index !== null && index !== undefined && images[index];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') onIndexChange?.((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndexChange?.((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button asChild size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <a href={images[index]} target="_blank" rel="noopener noreferrer" aria-label="Open original">
                <Download />
              </a>
            </Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close">
              <X />
            </Button>
          </div>

          {images.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 size-11 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange?.((index - 1 + images.length) % images.length);
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 size-11 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange?.((index + 1) % images.length);
                }}
                aria-label="Next"
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          )}

          <motion.img
            key={images[index]}
            src={images[index]}
            alt=""
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="max-h-[85vh] max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {index + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
