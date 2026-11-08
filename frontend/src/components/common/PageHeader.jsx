import { FadeIn } from '@/components/common/motion';
import { cn } from '@/lib/utils';

/**
 * Page title block – serif title, short plain description, hairline rule underneath.
 *   <PageHeader eyebrow="Admin" title="All events" description="..." actions={<Button/>} />
 * `icon` is accepted for compatibility but intentionally not rendered.
 */
export default function PageHeader({ title, description, eyebrow, actions, className }) {
  return (
    <FadeIn className={cn('mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="meta mb-2">{eyebrow}</p>}
        <h1 className="text-[2rem] leading-[1.1] sm:text-[2.4rem]">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </FadeIn>
  );
}
