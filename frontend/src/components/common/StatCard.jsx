import { cn } from '@/lib/utils';

/**
 * A single figure. Meant to sit in a row (see StatRow) rather than as a boxed tile.
 *   <StatCard label="Events this term" value={42} hint="3 new this week" />
 * `icon` and `tone` are accepted for compatibility; only `tone="accent"` changes anything (brick number).
 */
export default function StatCard({ label, value, hint, prefix = '', suffix = '', tone, className, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex flex-col items-start py-1 text-left',
        onClick && 'cursor-pointer rounded-md transition-colors hover:text-primary',
        className
      )}
    >
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn('mt-1 font-serif text-[2.4rem] leading-none font-medium tabular', tone === 'accent' && 'text-primary')}>
        {prefix}
        {value ?? '–'}
        {suffix}
      </span>
      {hint && <span className="meta mt-2">{hint}</span>}
    </Comp>
  );
}

/** Lays out StatCards as a ruled row: `<StatRow><StatCard/>…</StatRow>` */
export function StatRow({ children, className }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-6 border-y py-5 md:flex md:divide-x md:gap-0 [&>*]:md:flex-1 [&>*]:md:px-6 [&>*:first-child]:md:pl-0',
        className
      )}
    >
      {children}
    </div>
  );
}
