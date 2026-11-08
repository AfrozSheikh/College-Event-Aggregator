import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 text-[11.5px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-foreground text-background',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/25 bg-destructive/8 text-destructive',
        success: 'border-success/25 bg-success/8 text-success',
        warning: 'border-warning/50 bg-warning/20 text-warning-foreground dark:text-warning',
        info: 'border-border bg-muted text-foreground',
        outline: 'text-foreground',
        soft: 'border-primary/20 bg-primary/8 text-primary',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'span';
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
