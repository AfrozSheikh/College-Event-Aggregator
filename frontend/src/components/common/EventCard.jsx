import { Link } from 'react-router-dom';
import { cn, fileUrl, formatTime, getCategoryStyle } from '@/lib/utils';

/**
 * Event card styled like a ticket stub: poster on top, perforated tear line, actions on the stub.
 *   <EventCard event={event} actions={<>...buttons</>} compact? badge? />
 * The poster/title area links to the event; `actions` sit on the stub (clicks don't navigate).
 */
export default function EventCard({ event, actions, badge, className, compact = false }) {
  const cat = getCategoryStyle(event.category);
  const image = event.images?.[0]?.image_url;
  const date = new Date(event.event_date);
  const isUpcoming = date >= new Date(new Date().toDateString());
  const fees = Number(event.registration_fees) || 0;

  return (
    <article
      className={cn(
        'group bg-card relative flex h-full flex-col rounded-lg border transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/30',
        !isUpcoming && 'opacity-90',
        className
      )}
    >
      <Link to={`/events/${event.id}`} className="flex flex-1 flex-col focus-visible:outline-none">
        <div className={cn('relative overflow-hidden rounded-t-lg', compact ? 'h-32' : 'h-44')}>
          {image ? (
            <img
              src={fileUrl(image)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className={cn('flex h-full w-full items-end p-4 text-white', cat.poster)}>
              <span className="font-serif text-[2.6rem] leading-none font-medium italic opacity-90">{cat.label}</span>
            </div>
          )}
          {!isUpcoming && (
            <span className="absolute top-3 right-3 rotate-3 rounded-sm border border-white/70 bg-black/45 px-1.5 py-0.5 font-mono text-[10.5px] tracking-wide text-white uppercase">
              Done
            </span>
          )}
        </div>

        <div className="flex flex-1 gap-4 p-4">
          {/* Date block, like a printed stub */}
          <div className="flex w-11 shrink-0 flex-col items-center border-r pr-4 text-center">
            <span className="meta uppercase">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
            <span className="font-serif text-[1.7rem] leading-none font-medium tabular">{date.getDate()}</span>
            <span className="meta mt-0.5">{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cat.text)}>
                <span className={cn('size-1.5 rounded-full', cat.dot)} />
                {cat.label}
              </span>
              {badge}
            </div>
            <h3 className="group-hover:text-primary line-clamp-2 text-[1.15rem] leading-snug transition-colors">{event.title}</h3>
            {!compact && event.description && (
              <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">{event.description}</p>
            )}
            <p className="meta mt-2.5 truncate">
              {formatTime(event.event_time)} · {event.location}
            </p>
          </div>
        </div>
      </Link>

      {/* Tear line */}
      <div className="relative">
        <span className="bg-background absolute top-1/2 -left-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
        <span className="bg-background absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
        <div className="perforated mx-3" />
      </div>

      <div className="flex min-h-12 flex-wrap items-center gap-2 px-4 py-2.5">
        <span className="mr-auto text-sm">
          {fees > 0 ? (
            <span className="font-medium tabular">₹{fees % 1 === 0 ? fees : fees.toFixed(2)}</span>
          ) : (
            <span className="text-success font-medium">Free</span>
          )}
          {!compact && event.max_participants ? <span className="meta ml-2">{event.max_participants} seats</span> : null}
        </span>
        {actions}
      </div>
    </article>
  );
}
