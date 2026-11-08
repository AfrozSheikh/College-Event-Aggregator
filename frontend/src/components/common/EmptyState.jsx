import { cn } from '@/lib/utils';

/**
 * Quiet empty state: a line of serif text, a helpful sentence, an optional action.
 *   <EmptyState title="No registrations yet" description="..." action={<Button/>} />
 * `icon` is accepted but rendered small and muted.
 */
export default function EmptyState({ icon: Icon, title = 'Nothing here yet', description, action, className }) {
  return (
    <div className={cn('rounded-lg border border-dashed px-6 py-12 text-center', className)}>
      {Icon && <Icon className="text-muted-foreground/70 mx-auto mb-3 size-5" strokeWidth={1.5} />}
      <p className="font-serif text-xl">{title}</p>
      {description && <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
