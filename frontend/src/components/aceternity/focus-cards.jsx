import { cn } from '@/lib/utils';

/**
 * Photo grid. cards: [{ src, title, onClick }]
 * Plain and calm: images with a caption on hover, no blur tricks.
 */
export function FocusCards({ cards, className }) {
  return (
    <div className={cn('grid w-full grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3', className)}>
      {cards.map((card, index) => (
        <button
          type="button"
          key={card.key ?? index}
          onClick={card.onClick}
          className="group bg-muted relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-md"
        >
          <img
            src={card.src}
            alt={card.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {card.title && (
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {card.title}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
