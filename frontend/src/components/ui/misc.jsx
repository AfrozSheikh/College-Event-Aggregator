// Small shadcn primitives grouped in one file: Skeleton, Separator, Progress, Avatar, Checkbox, Switch
import * as React from 'react';
import {
  Separator as SeparatorPrimitive,
  Progress as ProgressPrimitive,
  Avatar as AvatarPrimitive,
  Checkbox as CheckboxPrimitive,
  Switch as SwitchPrimitive,
} from 'radix-ui';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return <div data-slot="skeleton" className={cn('bg-muted animate-pulse rounded-lg', className)} {...props} />;
}

function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  );
}

function Progress({ className, indicatorClassName, value, ...props }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('bg-muted relative h-1.5 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn('bg-foreground h-full w-full flex-1 rounded-full transition-all duration-500', indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.min(100, value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

function Avatar({ className, ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn('aspect-square size-full', className)} {...props} />;
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full border border-border bg-secondary font-serif text-[13px] font-medium text-secondary-foreground',
        className
      )}
      {...props}
    />
  );
}

function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:border-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-current">
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background pointer-events-none block size-4 rounded-full shadow ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  );
}

export { Skeleton, Separator, Progress, Avatar, AvatarImage, AvatarFallback, Checkbox, Switch };
